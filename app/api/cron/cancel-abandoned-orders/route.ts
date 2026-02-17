// app/api/cron/cancel-abandoned-orders/route.ts

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { logSystemAction } from '@/lib/actions/logs'

/**
 * CRON JOB : Annulation automatique des commandes abandonnées
 * Fréquence : Toutes les 15 minutes
 * Logique : Annule les commandes en "pending" depuis plus de 2 heures
 */
export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization')
        const token = authHeader?.replace('Bearer ', '')

        if (!token || token !== process.env.CRON_SECRET) {
            console.error('❌ Tentative d\'accès non autorisée au CRON')
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
        }

        console.log('🔄 Démarrage de l\'annulation des commandes abandonnées...')

        const twoHoursAgo = new Date()
        twoHoursAgo.setHours(twoHoursAgo.getHours() - 2)

        const abandonedOrders = await prisma.order.findMany({
            where: {
                status: 'pending',
                createdAt: { lt: twoHoursAgo },
                restaurant: { isActive: true },
            },
            include: {
                restaurant: { select: { id: true, name: true } },
                table: { select: { number: true } },
                items: {
                    select: {
                        productId: true,
                        quantity: true,
                        unitPrice: true,
                    },
                },
            },
        })

        if (abandonedOrders.length === 0) {
            console.log('✅ Aucune commande abandonnée à annuler')
            return NextResponse.json({
                success: true,
                message: 'Aucune commande abandonnée détectée',
                cancelled: 0,
            })
        }

        console.log(`⚠️ ${abandonedOrders.length} commande(s) abandonnée(s)`)

        const cancelledOrders = await prisma.$transaction(
            abandonedOrders.map(order =>
                prisma.order.update({
                    where: { id: order.id },
                    data: { status: 'cancelled', updatedAt: new Date() },
                })
            )
        )

        const details = []

        for (const order of abandonedOrders) {
            const minutesOld = Math.floor(
                (Date.now() - order.createdAt.getTime()) / (1000 * 60)
            )

            await logSystemAction(
                'order_cancelled_auto',
                {
                    orderId: order.id,
                    orderNumber: order.orderNumber,
                    restaurantId: order.restaurantId,
                    restaurantName: order.restaurant.name,
                    tableNumber: order.table?.number,
                    totalAmount: order.totalAmount,
                    itemsCount: order.items.length,
                    minutesOld,
                    reason: 'Commande abandonnée (> 2 heures)',
                },
                'warning'
            )

            details.push({
                orderId: order.id,
                orderNumber: order.orderNumber,
                restaurantName: order.restaurant.name,
                tableNumber: order.table?.number,
                totalAmount: order.totalAmount,
                minutesOld,
            })

            console.log(`🗑️ Commande ${order.orderNumber} annulée (${minutesOld}min)`)
        }

        const result = {
            success: true,
            message: `${cancelledOrders.length} commande(s) annulée(s)`,
            cancelled: cancelledOrders.length,
            details,
            executedAt: new Date().toISOString(),
        }

        console.log('✅ Annulation des commandes terminée')
        return NextResponse.json(result)

    } catch (error) {
        console.error('❌ Erreur annulation commandes:', error)
        
        await logSystemAction(
            'cron_error',
            { task: 'cancel-abandoned-orders', error: error instanceof Error ? error.message : 'Erreur inconnue' },
            'error'
        )

        return NextResponse.json(
            { error: 'Erreur lors de l\'annulation', details: error instanceof Error ? error.message : 'Erreur inconnue' },
            { status: 500 }
        )
    }
}
