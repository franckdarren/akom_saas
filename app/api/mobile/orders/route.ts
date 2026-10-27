import { NextRequest, NextResponse } from 'next/server'
import { validateMobileRequest } from '@/lib/mobile-auth'
import prisma from '@/lib/prisma'
import { PaymentMethod, PaymentStatus, PaymentTiming } from '@prisma/client'
import { z } from 'zod'

// unitPrice et totalAmount envoyés par l'app sont ignorés : les prix font foi côté serveur.
const CreateMobileOrderSchema = z.object({
    items: z.array(z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().min(1).max(9999),
    })).min(1).max(200),
    paymentMethod: z.enum(['cash', 'airtel_money', 'moov_money']),
    customerName: z.string().max(100).optional(),
})

const PAYMENT_METHOD_MAP: Record<z.infer<typeof CreateMobileOrderSchema>['paymentMethod'], PaymentMethod> = {
    cash: PaymentMethod.cash,
    airtel_money: PaymentMethod.airtel_money,
    moov_money: PaymentMethod.moov_money,
}

// ============================================================
// POST — Créer une commande depuis la caisse mobile
// Déduction de stock immédiate (vente au comptoir, source: mobile_pos)
// ============================================================
export async function POST(req: NextRequest) {
    const { ctx, error } = await validateMobileRequest(req, 'cash')
    if (error) return error

    try {
        const parsed = CreateMobileOrderSchema.safeParse(await req.json())
        if (!parsed.success) {
            return NextResponse.json({ error: 'Données de commande invalides' }, { status: 400 })
        }
        const { items, paymentMethod, customerName } = parsed.data

        // Vérifier que tous les produits existent et appartiennent au restaurant
        const productIds = items.map((i) => i.productId)
        const products = await prisma.product.findMany({
            where: { id: { in: productIds }, restaurantId: ctx.restaurantId },
            include: { stock: { select: { quantity: true } } },
        })

        if (products.length !== productIds.length) {
            return NextResponse.json({ error: 'Certains produits sont introuvables' }, { status: 400 })
        }

        const missingPrice = products.find((p) => p.price === null)
        if (missingPrice) {
            return NextResponse.json({ error: `Le produit "${missingPrice.name}" n'a pas de prix` }, { status: 400 })
        }

        const priceOf = (productId: string): number => products.find((p) => p.id === productId)!.price!
        const totalAmount = items.reduce((sum, item) => sum + priceOf(item.productId) * item.quantity, 0)

        // Vérifier le stock disponible
        for (const item of items) {
            const product = products.find((p) => p.id === item.productId)!
            if (product.hasStock && product.stock && product.stock.quantity < item.quantity) {
                return NextResponse.json(
                    { error: `Stock insuffisant pour "${product.name}"` },
                    { status: 400 }
                )
            }
        }

        // Générer le numéro de commande
        const lastOrder = await prisma.order.findFirst({
            where: { restaurantId: ctx.restaurantId, orderNumber: { startsWith: '#' } },
            orderBy: { orderNumber: 'desc' },
            select: { orderNumber: true },
        })
        const lastNum = lastOrder?.orderNumber ? parseInt(lastOrder.orderNumber.replace('#', ''), 10) : 0
        const orderNumber = `#${String((isNaN(lastNum) ? 0 : lastNum) + 1).padStart(3, '0')}`

        // Créer la commande, les items et déduire le stock en une transaction
        const order = await prisma.$transaction(async (tx) => {
            const newOrder = await tx.order.create({
                data: {
                    restaurantId: ctx.restaurantId,
                    orderNumber,
                    customerName: customerName ?? null,
                    status: 'delivered', // vente comptoir = immédiatement livrée
                    source: 'mobile_pos',
                    totalAmount,
                    stockDeducted: true,
                    notes: `Paiement : ${paymentMethod}`,
                    orderItems: {
                        create: items.map((item) => {
                            const product = products.find((p) => p.id === item.productId)!
                            return {
                                productId: item.productId,
                                productName: product.name,
                                quantity: item.quantity,
                                unitPrice: priceOf(item.productId),
                            }
                        }),
                    },
                },
                select: { id: true, orderNumber: true, totalAmount: true, status: true },
            })

            // Paiement encaissé immédiatement (vente comptoir mobile)
            await tx.payment.create({
                data: {
                    orderId: newOrder.id,
                    restaurantId: ctx.restaurantId,
                    amount: totalAmount,
                    method: PAYMENT_METHOD_MAP[paymentMethod],
                    status: PaymentStatus.paid,
                    timing: PaymentTiming.after_meal,
                },
            })

            // Déduire le stock pour chaque produit géré en stock
            for (const item of items) {
                const product = products.find((p) => p.id === item.productId)!
                if (!product.hasStock || !product.stock) continue

                const previousQty = product.stock.quantity
                const newQty = previousQty - item.quantity

                await tx.stock.update({
                    where: { restaurantId_productId: { restaurantId: ctx.restaurantId, productId: item.productId } },
                    data: { quantity: newQty },
                })

                await tx.stockMovement.create({
                    data: {
                        restaurantId: ctx.restaurantId,
                        productId: item.productId,
                        userId: ctx.userId,
                        orderId: newOrder.id,
                        type: 'sale_manual',
                        quantity: -item.quantity,
                        previousQty,
                        newQty,
                        reason: `Vente mobile #${newOrder.orderNumber}`,
                    },
                })

                await tx.product.update({
                    where: { id: item.productId },
                    data: { isAvailable: newQty > 0 },
                })
            }

            return newOrder
        })

        return NextResponse.json({ orderId: order.id, orderNumber: order.orderNumber, totalAmount: order.totalAmount }, { status: 201 })
    } catch (err) {
        console.error('POST /api/mobile/orders:', err)
        return NextResponse.json({ error: 'Erreur lors de la création de la commande' }, { status: 500 })
    }
}
