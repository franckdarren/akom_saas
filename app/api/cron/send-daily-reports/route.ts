// app/api/cron/send-daily-reports/route.ts

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { logSystemAction } from '@/lib/actions/logs'
import { sendDailyReportEmail } from '@/lib/email/cron-emails'

/**
 * CRON JOB : Envoi des rapports quotidiens
 * Fréquence : Tous les jours à 9h du matin
 * Logique : Génère et envoie un rapport complet de l'activité de la veille
 */
export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization')
        const token = authHeader?.replace('Bearer ', '')

        if (!token || token !== process.env.CRON_SECRET) {
            console.error('❌ Tentative d\'accès non autorisée au CRON')
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
        }

        console.log('🔄 Démarrage de l\'envoi des rapports quotidiens...')

        const now = new Date()
        
        const yesterdayStart = new Date(now)
        yesterdayStart.setDate(yesterdayStart.getDate() - 1)
        yesterdayStart.setHours(0, 0, 0, 0)
        
        const yesterdayEnd = new Date(yesterdayStart)
        yesterdayEnd.setHours(23, 59, 59, 999)

        const dayBeforeStart = new Date(yesterdayStart)
        dayBeforeStart.setDate(dayBeforeStart.getDate() - 1)
        
        const dayBeforeEnd = new Date(dayBeforeStart)
        dayBeforeEnd.setHours(23, 59, 59, 999)

        console.log(`📅 Rapport pour : ${yesterdayStart.toLocaleDateString('fr-FR')}`)

        const activeRestaurants = await prisma.restaurant.findMany({
            where: {
                isActive: true,
                subscription: { status: { in: ['trial', 'active'] } },
            },
            select: { id: true, name: true, email: true },
        })

        if (activeRestaurants.length === 0) {
            console.log('✅ Aucun restaurant actif')
            return NextResponse.json({
                success: true,
                message: 'Aucun restaurant actif',
                reportsSent: 0,
            })
        }

        console.log(`📊 Génération pour ${activeRestaurants.length} restaurant(s)`)

        let totalReportsSent = 0
        const reportDetails = []

        for (const restaurant of activeRestaurants) {
            try {
                const [yesterdayOrders, yesterdayStats] = await Promise.all([
                    prisma.order.findMany({
                        where: {
                            restaurantId: restaurant.id,
                            createdAt: { gte: yesterdayStart, lte: yesterdayEnd },
                        },
                        include: {
                            items: {
                                include: {
                                    product: { select: { name: true } },
                                },
                            },
                        },
                    }),

                    prisma.order.groupBy({
                        by: ['status'],
                        where: {
                            restaurantId: restaurant.id,
                            createdAt: { gte: yesterdayStart, lte: yesterdayEnd },
                        },
                        _count: { id: true },
                        _sum: { totalAmount: true },
                    }),
                ])

                const dayBeforeOrders = await prisma.order.count({
                    where: {
                        restaurantId: restaurant.id,
                        createdAt: { gte: dayBeforeStart, lte: dayBeforeEnd },
                    },
                })

                const yesterdayRevenue = yesterdayStats.reduce(
                    (sum, stat) => sum + (stat._sum.totalAmount || 0),
                    0
                )

                const yesterdayOrdersCount = yesterdayOrders.length

                if (yesterdayOrdersCount === 0) {
                    console.log(`   ⏭️ ${restaurant.name} : Aucune commande hier`)
                    continue
                }

                const avgBasket = yesterdayOrdersCount > 0
                    ? Math.round(yesterdayRevenue / yesterdayOrdersCount)
                    : 0

                const productSales = yesterdayOrders
                    .flatMap(order => order.items)
                    .reduce((acc, item) => {
                        const productName = item.product.name
                        if (!acc[productName]) {
                            acc[productName] = {
                                name: productName,
                                quantity: 0,
                                revenue: 0,
                            }
                        }
                        acc[productName].quantity += item.quantity
                        acc[productName].revenue += item.quantity * item.unitPrice
                        return acc
                    }, {} as Record<string, { name: string; quantity: number; revenue: number }>)

                const topProducts = Object.values(productSales)
                    .sort((a, b) => b.quantity - a.quantity)
                    .slice(0, 5)

                const statusBreakdown = yesterdayStats.reduce((acc, stat) => {
                    acc[stat.status] = stat._count.id
                    return acc
                }, {} as Record<string, number>)

                const evolutionPercent = dayBeforeOrders > 0
                    ? Math.round(((yesterdayOrdersCount - dayBeforeOrders) / dayBeforeOrders) * 100)
                    : 0

                const reportData = {
                    restaurantName: restaurant.name,
                    date: yesterdayStart.toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                    }),
                    ordersCount: yesterdayOrdersCount,
                    revenue: yesterdayRevenue,
                    avgBasket,
                    topProducts,
                    statusBreakdown,
                    comparison: {
                        previousDay: dayBeforeOrders,
                        evolution: evolutionPercent,
                    },
                }

                await sendDailyReportEmail({
                    to: restaurant.email,
                    data: reportData,
                })

                totalReportsSent++
                reportDetails.push({
                    restaurantId: restaurant.id,
                    restaurantName: restaurant.name,
                    ordersCount: yesterdayOrdersCount,
                    revenue: yesterdayRevenue,
                    emailSent: true,
                })

                await logSystemAction(
                    'daily_report_sent',
                    {
                        restaurantId: restaurant.id,
                        restaurantName: restaurant.name,
                        date: yesterdayStart.toISOString(),
                        ordersCount: yesterdayOrdersCount,
                        revenue: yesterdayRevenue,
                    },
                    'info'
                )

                console.log(`   ✅ ${restaurant.name} : ${yesterdayOrdersCount} commandes, ${yesterdayRevenue} FCFA`)

            } catch (restaurantError) {
                console.error(`   ❌ Erreur pour ${restaurant.name}:`, restaurantError)

                reportDetails.push({
                    restaurantId: restaurant.id,
                    restaurantName: restaurant.name,
                    emailSent: false,
                    error: restaurantError instanceof Error ? restaurantError.message : 'Erreur inconnue',
                })

                await logSystemAction(
                    'daily_report_failed',
                    {
                        restaurantId: restaurant.id,
                        restaurantName: restaurant.name,
                        error: restaurantError instanceof Error ? restaurantError.message : 'Erreur inconnue',
                    },
                    'error'
                )
            }
        }

        const result = {
            success: true,
            message: `${totalReportsSent} rapport(s) envoyé(s)`,
            reportsSent: totalReportsSent,
            restaurantsChecked: activeRestaurants.length,
            date: yesterdayStart.toLocaleDateString('fr-FR'),
            details: reportDetails,
            executedAt: new Date().toISOString(),
        }

        console.log('✅ Envoi des rapports terminé')
        return NextResponse.json(result)

    } catch (error) {
        console.error('❌ Erreur envoi rapports:', error)
        
        await logSystemAction(
            'cron_error',
            { task: 'send-daily-reports', error: error instanceof Error ? error.message : 'Erreur inconnue' },
            'error'
        )

        return NextResponse.json(
            { error: 'Erreur lors de l\'envoi des rapports', details: error instanceof Error ? error.message : 'Erreur inconnue' },
            { status: 500 }
        )
    }
}
