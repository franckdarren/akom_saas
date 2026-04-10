// lib/stock/deduct-order-stock.ts

import prisma from '@/lib/prisma'

/**
 * Déduit le stock pour une commande payée.
 * Idempotent : ne fait rien si order.stockDeducted est déjà true.
 * Crée un StockMovement de type order_out pour chaque produit déduit.
 *
 * Utilisé par : webhook SingPay, webhook eBilling.
 */
export async function deductOrderStock(
    orderId: string,
    restaurantId: string,
): Promise<void> {
    await prisma.$transaction(async (tx) => {
        const order = await tx.order.findUnique({
            where: {id: orderId},
            select: {
                stockDeducted: true,
                orderItems: {
                    select: {
                        productId: true,
                        quantity: true,
                        product: {select: {hasStock: true}},
                    },
                },
            },
        })

        if (!order || order.stockDeducted) return

        // Récupérer un userId pour le StockMovement (premier membre du restaurant)
        const member = await tx.restaurantUser.findFirst({
            where: {restaurantId},
            select: {userId: true},
        })
        const systemUserId = member?.userId ?? null

        for (const item of order.orderItems) {
            if (!item.productId || !item.product?.hasStock) continue

            const stock = await tx.stock.findUnique({
                where: {restaurantId_productId: {restaurantId, productId: item.productId}},
                select: {quantity: true},
            })
            if (!stock) continue

            const previousQty = stock.quantity
            const newQty = Math.max(0, previousQty - item.quantity)

            await tx.stock.update({
                where: {restaurantId_productId: {restaurantId, productId: item.productId}},
                data: {quantity: newQty},
            })

            if (newQty <= 0) {
                await tx.product.update({
                    where: {id: item.productId},
                    data: {isAvailable: false},
                })
            }

            if (systemUserId) {
                await tx.stockMovement.create({
                    data: {
                        restaurantId,
                        productId: item.productId,
                        userId: systemUserId,
                        type: 'order_out',
                        quantity: -(item.quantity),
                        previousQty,
                        newQty,
                        orderId,
                        reason: 'Vente confirmée',
                    },
                })
            }
        }

        await tx.order.update({
            where: {id: orderId},
            data: {stockDeducted: true},
        })
    })
}
