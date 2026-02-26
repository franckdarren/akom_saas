// app/(dashboard)/dashboard/pos/_actions/create-pos-order.ts
'use server'

import prisma from '@/lib/prisma'
import {getCurrentUserAndRestaurant} from '@/lib/auth/session'
import {revalidatePath} from 'next/cache'
import {OrderSource, OrderStatus, PaymentStatus, PaymentTiming} from '@prisma/client'
import type {POSOrderPayload} from '../_types'

export async function createPOSOrder(payload: POSOrderPayload) {
    // ✅ FIX 1 : getCurrentUserAndRestaurant retourne { userId, restaurantId }
    //            pas { user, restaurant }
    const {userId, restaurantId} = await getCurrentUserAndRestaurant()

    if (!userId || !restaurantId) throw new Error('Non autorisé')

    // Récupérer les produits pour avoir les prix à jour en BDD
    const productIds = payload.items.map(i => i.productId)
    const products = await prisma.product.findMany({
        where: {id: {in: productIds}, restaurantId},
    })

    const productMap = new Map(products.map(p => [p.id, p]))

    const order = await prisma.$transaction(async (tx) => {

        // ─────────────────────────────────────────────────────
        // ÉTAPE 1 : Créer la commande
        // ✅ FIX 2 : Utiliser les enums Prisma au lieu des strings littéraux
        //           OrderSource.counter et OrderStatus.confirmed
        // ✅ FIX 3 : Pas d'imbrication `items: { create: [...] }` dans order.create
        //           On crée la commande d'abord, puis les orderItems séparément
        //           car le schéma utilise `orderItems` (pas `items`) et le champ
        //           s'appelle `productName` (obligatoire) + unitPrice (pas `total`)
        // ─────────────────────────────────────────────────────
        const newOrder = await tx.order.create({
            data: {
                restaurantId,
                source: OrderSource.counter,
                status: OrderStatus.pending,   // La cuisine doit quand même valider
                notes: payload.note ?? null,
                tableLabel: 'Comptoir',
                totalAmount: 0, // Sera mis à jour juste après
            },
        })

        // ─────────────────────────────────────────────────────
        // ÉTAPE 2 : Créer les orderItems
        // ✅ FIX 4 : Le modèle OrderItem exige `productName` (String, non nullable)
        //           et `unitPrice` (Int). Pas de champ `total`.
        // ─────────────────────────────────────────────────────
        let totalAmount = 0

        for (const item of payload.items) {
            const product = productMap.get(item.productId)
            const unitPrice = product?.price ?? item.price

            // price peut être null dans le schéma (produit sur devis)
            // On bloque la commande si le prix est introuvable
            if (unitPrice == null) {
                throw new Error(`Prix introuvable pour le produit ${item.productId}`)
            }

            await tx.orderItem.create({
                data: {
                    orderId: newOrder.id,
                    productId: item.productId,
                    productName: product?.name ?? item.name,
                    quantity: item.quantity,
                    unitPrice: unitPrice,
                },
            })

            totalAmount += unitPrice * item.quantity
        }

        // ─────────────────────────────────────────────────────
        // ÉTAPE 3 : Mettre à jour le totalAmount de la commande
        // ─────────────────────────────────────────────────────
        await tx.order.update({
            where: {id: newOrder.id},
            data: {totalAmount},
        })

        // ─────────────────────────────────────────────────────
        // ÉTAPE 4 : Créer le paiement
        // ✅ FIX 5 : PaymentStatus.paid (pas "completed") et
        //           `timing` est obligatoire dans le schéma
        // ─────────────────────────────────────────────────────
        await tx.payment.create({
            data: {
                orderId: newOrder.id,
                restaurantId,
                amount: totalAmount,
                method: payload.paymentMethod,
                status: PaymentStatus.paid,
                timing: PaymentTiming.after_meal, // Comptoir = encaissement immédiat
            },
        })

        // ─────────────────────────────────────────────────────
        // ÉTAPE 5 : Décrémenter le stock
        // On ne décrémente que les produits avec hasStock = true
        // ─────────────────────────────────────────────────────
        for (const item of payload.items) {
            const product = productMap.get(item.productId)

            // Ignorer les produits de type service ou sans stock
            if (!product?.hasStock) continue

            await tx.stock.updateMany({
                where: {productId: item.productId, restaurantId},
                data: {quantity: {decrement: item.quantity}},
            })
        }

        return {...newOrder, totalAmount}
    })

    revalidatePath('/dashboard/pos/orders')
    return {success: true, orderId: order.id}
}