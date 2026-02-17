import {NextRequest, NextResponse} from 'next/server'
import prisma from '@/lib/prisma'
import {logSystemAction} from '@/lib/actions/logs'

/**
 * CRON JOB : Annulation automatique des commandes abandonnées
 * Fréquence : Toutes les 15 minutes
 * Logique : Annule les commandes en "pending" depuis plus de 4 heures
 */
export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization')
        const token = authHeader?.replace('Bearer ', '')

        if (!token || token !== process.env.CRON_SECRET) {
            console.error('❌ Tentative d\'accès non autorisée au CRON')
            return NextResponse.json({error: 'Non autorisé'}, {status: 401})
        }

        console.log('🔄 Démarrage de l\'annulation des commandes abandonnées...')

        const twoHoursAgo = new Date()
        twoHoursAgo.setHours(twoHoursAgo.getHours() - 4)

        // ✅ On utilise SELECT explicite (plus safe que include en prod)
        const abandonedOrders = await prisma.order.findMany({
            where: {
                status: 'pending',
                createdAt: {lt: twoHoursAgo},
                restaurant: {isActive: true},
                isArchived: false,
            },
            select: {
                id: true,
                orderNumber: true,
                restaurantId: true,
                totalAmount: true,
                createdAt: true,
                table: {
                    select: {number: true},
                },
                restaurant: {
                    select: {id: true, name: true},
                },
                orderItems: {
                    select: {
                        id: true,
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

        // ✅ Transaction sécurisée
        await prisma.$transaction(
            abandonedOrders.map((order) =>
                prisma.order.update({
                    where: {id: order.id},
                    data: {
                        status: 'cancelled',
                        updatedAt: new Date(),
                    },
                })
            )
        )

        const details = []

        for (const order of abandonedOrders) {
            const minutesOld = Math.floor(
                (Date.now() - order.createdAt.getTime()) / (1000 * 60)
            )

            const safeOrderNumber =
                order.orderNumber ?? `CMD-${order.id.slice(0, 6)}`

            await logSystemAction(
                'order_cancelled_auto',
                {
                    orderId: order.id,
                    orderNumber: safeOrderNumber,
                    restaurantId: order.restaurantId,
                    restaurantName: order.restaurant.name,
                    tableNumber: order.table?.number ?? null,
                    totalAmount: order.totalAmount,
                    itemsCount: order.orderItems.length,
                    minutesOld,
                    reason: 'Commande abandonnée (> 2 heures)',
                },
                'warning'
            )

            details.push({
                orderId: order.id,
                orderNumber: safeOrderNumber,
                restaurantName: order.restaurant.name,
                tableNumber: order.table?.number ?? null,
                totalAmount: order.totalAmount,
                minutesOld,
            })

            console.log(`🗑️ Commande ${safeOrderNumber} annulée (${minutesOld}min)`)
        }

        const result = {
            success: true,
            message: `${abandonedOrders.length} commande(s) annulée(s)`,
            cancelled: abandonedOrders.length,
            details,
            executedAt: new Date().toISOString(),
        }

        console.log('✅ Annulation des commandes terminée')
        return NextResponse.json(result)

    } catch (error) {
        console.error('❌ Erreur annulation commandes:', error)

        await logSystemAction(
            'cron_error',
            {
                task: 'cancel-abandoned-orders',
                error: error instanceof Error ? error.message : 'Erreur inconnue',
            },
            'error'
        )

        return NextResponse.json(
            {
                error: 'Erreur lors de l\'annulation',
                details: error instanceof Error ? error.message : 'Erreur inconnue',
            },
            {status: 500}
        )
    }
}
