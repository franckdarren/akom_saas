'use server'

import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { isSuperAdminEmail } from '@/lib/utils/permissions'

// ============================================================
// VÉRIFICATION SUPERADMIN
// ============================================================

async function verifySuperAdmin() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !isSuperAdminEmail(user.email || '')) {
        throw new Error('Accès refusé : SuperAdmin uniquement')
    }

    return user
}

// ============================================================
// STATS PAR PÉRIODE (jour/semaine/mois)
// ============================================================

export async function getStatsByPeriod(
    period: 'day' | 'week' | 'month',
    restaurantId?: string
) {
    await verifySuperAdmin()

    const now = new Date()
    let startDate: Date
    let groupByFormat: string

    switch (period) {
        case 'day':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            groupByFormat = 'YYYY-MM-DD' // Format compatible Postgres TO_CHAR
            break
        case 'week':
            startDate = new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000)
            groupByFormat = 'YYYY-"W"IW'
            break
        case 'month':
            startDate = new Date(now.getTime() - 12 * 30 * 24 * 60 * 60 * 1000)
            groupByFormat = 'YYYY-MM'
            break
        default:
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            groupByFormat = 'YYYY-MM-DD'
    }

    // Solution : On sépare les deux cas pour que Prisma puisse préparer correctement les requêtes
    const stats = restaurantId
        ? await prisma.$queryRaw<Array<{
            period: string
            orders_count: bigint
            revenue: bigint
            avg_order_value: number
        }>>`
            SELECT 
                TO_CHAR(created_at, ${groupByFormat}) as period,
                COUNT(*)::bigint as orders_count,
                COALESCE(SUM(total_amount), 0)::bigint as revenue,
                COALESCE(AVG(total_amount), 0)::float as avg_order_value
            FROM orders
            WHERE created_at >= ${startDate}
                AND restaurant_id = ${restaurantId}::uuid
                AND status IN ('delivered', 'ready')
            GROUP BY period
            ORDER BY period ASC
          `
        : await prisma.$queryRaw<Array<{
            period: string
            orders_count: bigint
            revenue: bigint
            avg_order_value: number
        }>>`
            SELECT 
                TO_CHAR(created_at, ${groupByFormat}) as period,
                COUNT(*)::bigint as orders_count,
                COALESCE(SUM(total_amount), 0)::bigint as revenue,
                COALESCE(AVG(total_amount), 0)::float as avg_order_value
            FROM orders
            WHERE created_at >= ${startDate}
                AND status IN ('delivered', 'ready')
            GROUP BY period
            ORDER BY period ASC
            `;

    return stats.map(s => ({
        period: s.period,
        ordersCount: Number(s.orders_count),
        revenue: Number(s.revenue),
        avgOrderValue: Math.round(s.avg_order_value),
    }))
}

// ============================================================
// COMPARAISON RESTAURANTS (Top/Flop)
// ============================================================

export async function getRestaurantsComparison(limit: number = 10) {
    await verifySuperAdmin()

    const restaurants = await prisma.restaurant.findMany({
        where: { isActive: true },
        select: {
            id: true,
            name: true,
            slug: true,
            _count: {
                select: { orders: true },
            },
        },
        orderBy: {
            orders: {
                _count: 'desc',
            },
        },
        take: limit,
    })

    // Calculer le revenu pour chaque restaurant
    const restaurantsWithRevenue = await Promise.all(
        restaurants.map(async (r) => {
            const revenue = await prisma.order.aggregate({
                where: {
                    restaurantId: r.id,
                    status: { in: ['delivered', 'ready'] },
                },
                _sum: { totalAmount: true },
            })

            return {
                ...r,
                ordersCount: r._count.orders,
                revenue: revenue._sum.totalAmount || 0,
            }
        })
    )

    return restaurantsWithRevenue
}

// ============================================================
// ANALYSE PRODUITS (Top ventes globales)
// ============================================================

export async function getTopProducts(limit: number = 10) {
    await verifySuperAdmin()

    const topProducts = await prisma.$queryRaw<Array<{
        product_name: string
        total_quantity: bigint
        total_revenue: bigint
        orders_count: bigint
    }>>`
        SELECT 
            product_name,
            SUM(quantity)::bigint as total_quantity,
            SUM(quantity * unit_price)::bigint as total_revenue,
            COUNT(DISTINCT order_id)::bigint as orders_count
        FROM order_items
        GROUP BY product_name
        ORDER BY total_quantity DESC
        LIMIT ${limit}
    `

    return topProducts.map(p => ({
        productName: p.product_name,
        totalQuantity: Number(p.total_quantity),
        totalRevenue: Number(p.total_revenue),
        ordersCount: Number(p.orders_count),
    }))
}

// ============================================================
// STATS TEMPS RÉEL (dernières 24h)
// ============================================================

export async function getRealTimeStats() {
    await verifySuperAdmin()

    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const [ordersLast24h, revenueLast24h, activeRestaurants] = await Promise.all([
        // Commandes dernières 24h
        prisma.order.count({
            where: { createdAt: { gte: last24h } },
        }),

        // Revenu dernières 24h
        prisma.order.aggregate({
            where: {
                createdAt: { gte: last24h },
                status: { in: ['delivered', 'ready'] },
            },
            _sum: { totalAmount: true },
        }),

        // Restaurants actifs (ayant reçu au moins 1 commande dans les 24h)
        prisma.restaurant.count({
            where: {
                orders: {
                    some: {
                        createdAt: { gte: last24h },
                    },
                },
            },
        }),
    ])

    return {
        ordersLast24h,
        revenueLast24h: revenueLast24h._sum.totalAmount || 0,
        activeRestaurants,
    }
}

// ============================================================
// EXPORT CSV
// ============================================================

export async function exportStatsToCSV(
    period: 'day' | 'week' | 'month'
): Promise<string> {
    await verifySuperAdmin()

    const stats = await getStatsByPeriod(period)

    // Générer CSV
    const header = 'Période,Commandes,Revenu,Panier Moyen\n'
    const rows = stats
        .map(
            s =>
                `${s.period},${s.ordersCount},${s.revenue},${s.avgOrderValue}`
        )
        .join('\n')

    return header + rows
}