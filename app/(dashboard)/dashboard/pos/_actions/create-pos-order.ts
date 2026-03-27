// app/(dashboard)/dashboard/pos/_actions/create-pos-order.ts
'use server'

import prisma from '@/lib/prisma'
import {getCurrentUserAndRestaurant} from '@/lib/auth/session'
import {revalidatePath} from 'next/cache'
import {OrderSource, OrderStatus, PaymentStatus, PaymentTiming, PaymentMethod} from '@prisma/client'
import type {POSOrderPayload, POSPaymentMethod} from '../_types'

const PAYMENT_METHOD_MAP: Record<POSPaymentMethod, PaymentMethod> = {
    cash: PaymentMethod.cash,
    airtel_money: PaymentMethod.airtel_money,
    moov_money: PaymentMethod.moov_money,
}

export async function createPOSOrder(payload: POSOrderPayload) {
    const {userId, restaurantId} = await getCurrentUserAndRestaurant()
    if (!userId || !restaurantId) throw new Error('Non autorisé')

    if (payload.mode === 'pay_now' && !payload.paymentMethod) {
        return {success: false, error: 'Méthode de paiement requise'}
    }

    // ── Récupérer produits + stock ───────────────────────────────────
    const productIds = payload.items.map(i => i.productId)
    const products = await prisma.product.findMany({
        where: {id: {in: productIds}, restaurantId},
        include: {stock: {select: {quantity: true}}},
    })
    const productMap = new Map(products.map(p => [p.id, p]))

    // ── Vérification stock ───────────────────────────────────────────
    const errors: string[] = []
    for (const item of payload.items) {
        const p = productMap.get(item.productId)
        if (!p) {
            errors.push(`Produit introuvable`);
            continue
        }
        if (p.price == null) {
            errors.push(`"${p.name}" n'a pas de prix`);
            continue
        }
        if (p.hasStock) {
            const available = p.stock?.quantity ?? 0
            if (item.quantity > available)
                errors.push(`"${p.name}" : stock insuffisant (demandé ${item.quantity}, dispo ${available})`)
        }
    }
    if (errors.length > 0) return {success: false, error: errors.join(' · ')}

    // ── Générer orderNumber unique ───────────────────────────────────
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const rand = String(Math.floor(Math.random() * 900 + 100))
    const orderNumber = `POS-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}-${rand}`

    const isPayNow = payload.mode === 'pay_now'

    // ── Transaction ──────────────────────────────────────────────────
    const order = await prisma.$transaction(async (tx) => {

        // 1. Commande
        // stockDeducted = true  → pay_now  : stock déduit ici, trigger SQL skippera
        // stockDeducted = false → pay_later : trigger SQL décrémentera au premier changement actif
        const newOrder = await tx.order.create({
            data: {
                restaurantId,
                orderNumber,
                source: OrderSource.counter,
                status: OrderStatus.pending,
                notes: payload.note ?? null,
                tableLabel: payload.tableLabel ?? 'Comptoir',
                totalAmount: 0,
                stockDeducted: isPayNow,
            },
        })

        // 2. Items + total — createMany évite N requêtes individuelles
        let totalAmount = 0
        const itemsData = payload.items.map((item) => {
            const p = productMap.get(item.productId)!
            totalAmount += (p.price as number) * item.quantity
            return {
                orderId: newOrder.id,
                productId: item.productId,
                productName: p.name,
                quantity: item.quantity,
                unitPrice: p.price as number,
            }
        })
        await tx.orderItem.createMany({data: itemsData})
        await tx.order.update({where: {id: newOrder.id}, data: {totalAmount}})

        // 3. Paiement
        await tx.payment.create({
            data: {
                orderId: newOrder.id,
                restaurantId,
                amount: totalAmount,
                // pay_now  → méthode choisie, statut paid
                // pay_later → cash placeholder, statut pending (mis à jour via "Encaisser")
                method: isPayNow ? PAYMENT_METHOD_MAP[payload.paymentMethod!] : PaymentMethod.cash,
                status: isPayNow ? PaymentStatus.paid : PaymentStatus.pending,
                timing: PaymentTiming.after_meal,
            },
        })

        // 4. Décrément stock — pay_now uniquement
        // pay_later : le trigger SQL s'en charge au premier changement de statut
        if (isPayNow) {
            for (const item of payload.items) {
                const p = productMap.get(item.productId)!
                if (!p.hasStock) continue

                await tx.stock.updateMany({
                    where: {productId: item.productId, restaurantId},
                    data: {quantity: {decrement: item.quantity}},
                })

                const updated = await tx.stock.findUnique({
                    where: {restaurantId_productId: {restaurantId, productId: item.productId}},
                    select: {quantity: true},
                })
                if ((updated?.quantity ?? 0) <= 0) {
                    await tx.product.update({
                        where: {id: item.productId},
                        data: {isAvailable: false},
                    })
                }
            }
        }

        return {...newOrder, totalAmount}
    })

    revalidatePath('/dashboard/pos/orders')
    revalidatePath('/dashboard/pos')

    return {success: true, orderId: order.id, mode: payload.mode}
}