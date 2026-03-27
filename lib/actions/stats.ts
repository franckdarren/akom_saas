// lib/actions/stats.ts
'use server'

import {createClient} from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import {getPeriodRange} from '@/lib/utils/period'
import type {
    TimePeriod,
    CustomPeriod,
    RevenueStats,
    OrdersStats,
    StockAlert,
    DailySales,
    TopProduct,
    CategorySales,
    RecentOrder,
    DashboardStats,
} from '@/types/stats'
import {format, eachDayOfInterval} from 'date-fns'
import {getFinancialStats} from '@/lib/stats/financial-aggregates'
import type {FinancialPeriodStats} from '@/lib/stats/financial-aggregates'

// ============================================================
// Auth — appelée UNE SEULE FOIS par getDashboardStats.
// Le restaurantId est ensuite passé en paramètre à toutes les
// fonctions internes pour éviter des appels Supabase parallèles
// qui peuvent échouer aléatoirement ("Non authentifié").
// ============================================================

async function getCurrentRestaurantId(): Promise<string> {
    const supabase = await createClient()
    const {data: {user}} = await supabase.auth.getUser()

    if (!user) throw new Error('Non authentifié')

    const restaurantUser = await prisma.restaurantUser.findFirst({
        where: {userId: user.id},
        select: {restaurantId: true},
    })

    if (!restaurantUser) throw new Error('Aucun restaurant trouvé')

    return restaurantUser.restaurantId
}

// ============================================================
// STATISTIQUES DE CHIFFRE D'AFFAIRES
// ============================================================

async function getRevenueStats(
    restaurantId: string,
    period: TimePeriod,
    customPeriod?: CustomPeriod,
): Promise<RevenueStats> {
    const {startDate, endDate, previousStartDate, previousEndDate} =
        getPeriodRange(period, customPeriod)

    // Normalisation UTC pour les colonnes @db.Date (revenueDate)
    const dateStart = new Date(startDate.toISOString().slice(0, 10))
    const dateEnd = new Date(endDate.toISOString().slice(0, 10) + 'T23:59:59.999Z')
    const prevDateStart = new Date(previousStartDate.toISOString().slice(0, 10))
    const prevDateEnd = new Date(previousEndDate.toISOString().slice(0, 10) + 'T23:59:59.999Z')

    const [currentOrders, previousOrders, currentManual, previousManual] =
        await Promise.all([
            prisma.order.aggregate({
                where: {
                    restaurantId,
                    status: 'delivered',
                    createdAt: {gte: startDate, lte: endDate},
                },
                _sum: {totalAmount: true},
                _count: true,
            }),
            prisma.order.aggregate({
                where: {
                    restaurantId,
                    status: 'delivered',
                    createdAt: {gte: previousStartDate, lte: previousEndDate},
                },
                _sum: {totalAmount: true},
            }),
            prisma.manualRevenue.aggregate({
                where: {
                    restaurantId,
                    revenueDate: {gte: dateStart, lte: dateEnd},
                },
                _sum: {totalAmount: true},
            }),
            prisma.manualRevenue.aggregate({
                where: {
                    restaurantId,
                    revenueDate: {gte: prevDateStart, lte: prevDateEnd},
                },
                _sum: {totalAmount: true},
            }),
        ])

    const posRevenue = currentOrders._sum.totalAmount ?? 0
    const manualRevenue = currentManual._sum.totalAmount ?? 0
    const total = posRevenue + manualRevenue

    const posPrev = previousOrders._sum.totalAmount ?? 0
    const manualPrev = previousManual._sum.totalAmount ?? 0
    const previousPeriod = posPrev + manualPrev

    const percentChange =
        previousPeriod > 0 ? ((total - previousPeriod) / previousPeriod) * 100 : 0

    return {
        total,
        previousPeriod,
        percentChange: Math.round(percentChange * 10) / 10,
        ordersCount: currentOrders._count,
    }
}

// ============================================================
// STATISTIQUES DE COMMANDES
// ============================================================

async function getOrdersStats(
    restaurantId: string,
    period: TimePeriod,
    customPeriod?: CustomPeriod,
): Promise<OrdersStats> {
    let {startDate, endDate} = getPeriodRange(period, customPeriod)

    const lastOrder = await prisma.order.findFirst({
        where: {restaurantId},
        orderBy: {createdAt: 'desc'},
        select: {createdAt: true},
    })

    if (lastOrder && lastOrder.createdAt < startDate) {
        endDate = lastOrder.createdAt
        startDate = new Date(endDate)
        startDate.setDate(endDate.getDate() - 6)
    }

    const ordersGrouped = await prisma.order.groupBy({
        by: ['status'],
        where: {
            restaurantId,
            createdAt: {gte: startDate, lte: endDate},
        },
        _count: {_all: true},
        _sum: {totalAmount: true},
    })

    const stats = {
        total: 0, pending: 0, preparing: 0, ready: 0,
        delivered: 0, cancelled: 0, totalRevenue: 0,
    }

    ordersGrouped.forEach((order) => {
        const count = order._count._all
        const revenue = order._sum.totalAmount ?? 0
        stats.total += count
        stats.totalRevenue += revenue
        switch (order.status) {
            case 'pending':   stats.pending = count;   break
            case 'preparing': stats.preparing = count; break
            case 'ready':     stats.ready = count;     break
            case 'delivered': stats.delivered = count; break
            case 'cancelled': stats.cancelled = count; break
        }
    })

    return {
        total: stats.total,
        pending: stats.pending,
        preparing: stats.preparing,
        ready: stats.ready,
        delivered: stats.delivered,
        cancelled: stats.cancelled,
        averageOrderValue: stats.total > 0
            ? Math.round(stats.totalRevenue / stats.total)
            : 0,
    }
}

// ============================================================
// ALERTES STOCK BAS
// ============================================================

async function getStockAlerts(restaurantId: string): Promise<StockAlert[]> {
    // Filtre quantity <= alert_threshold directement en SQL (Prisma ne supporte pas
    // les comparaisons colonne-à-colonne dans where)
    const alerts = await prisma.$queryRaw<{
        productId: string
        productName: string
        currentQuantity: number
        alertThreshold: number
        categoryName: string | null
    }[]>`
        SELECT
            s.product_id      AS "productId",
            p.name            AS "productName",
            s.quantity        AS "currentQuantity",
            s.alert_threshold AS "alertThreshold",
            c.name            AS "categoryName"
        FROM stocks s
        JOIN products p ON p.id = s.product_id
        LEFT JOIN categories c ON c.id = p.category_id
        WHERE s.restaurant_id = ${restaurantId}::uuid
          AND s.quantity <= s.alert_threshold
        ORDER BY s.quantity ASC
        LIMIT 10
    `

    return alerts.map((a) => ({
        productId: a.productId,
        productName: a.productName,
        currentQuantity: Number(a.currentQuantity),
        alertThreshold: Number(a.alertThreshold),
        categoryName: a.categoryName,
    }))
}

// ============================================================
// VENTES PAR JOUR
// ============================================================

async function getDailySales(
    restaurantId: string,
    period: TimePeriod,
    customPeriod?: CustomPeriod,
): Promise<DailySales[]> {
    const {startDate, endDate} = getPeriodRange(period, customPeriod)
    const allDays = eachDayOfInterval({start: startDate, end: endDate})

    const dateStart = new Date(startDate.toISOString().slice(0, 10))
    const dateEnd = new Date(endDate.toISOString().slice(0, 10) + 'T23:59:59.999Z')

    const [orders, manualRevenues] = await Promise.all([
        prisma.order.findMany({
            where: {
                restaurantId,
                status: {notIn: ['cancelled']},
                createdAt: {gte: startDate, lte: endDate},
            },
            select: {createdAt: true, totalAmount: true},
        }),
        prisma.manualRevenue.findMany({
            where: {
                restaurantId,
                revenueDate: {gte: dateStart, lte: dateEnd},
            },
            select: {revenueDate: true, totalAmount: true},
        }),
    ])

    const salesByDate = new Map<string, { revenue: number; orders: number }>()

    const addToMap = (date: Date, amount: number, countAsOrder: boolean) => {
        const key = format(date, 'yyyy-MM-dd')
        const existing = salesByDate.get(key) ?? {revenue: 0, orders: 0}
        salesByDate.set(key, {
            revenue: existing.revenue + amount,
            orders: existing.orders + (countAsOrder ? 1 : 0),
        })
    }

    orders.forEach((o) => addToMap(o.createdAt, o.totalAmount, true))
    manualRevenues.forEach((r) => addToMap(r.revenueDate, r.totalAmount, false))

    return allDays.map((day) => {
        const date = format(day, 'yyyy-MM-dd')
        const sales = salesByDate.get(date) ?? {revenue: 0, orders: 0}
        return {date, revenue: sales.revenue, orders: sales.orders}
    })
}

// ============================================================
// TOP PRODUITS
// ============================================================

async function getTopProducts(
    restaurantId: string,
    period: TimePeriod,
    customPeriod?: CustomPeriod,
    limit: number = 5,
): Promise<TopProduct[]> {
    const {startDate, endDate} = getPeriodRange(period, customPeriod)

    // groupBy ne permet pas SUM(quantity * unit_price) — on utilise $queryRaw
    const topProducts = await prisma.$queryRaw<
        {productId: string; productName: string; quantitySold: bigint; revenue: bigint}[]
    >`
        SELECT
            oi.product_id                            AS "productId",
            oi.product_name                          AS "productName",
            SUM(oi.quantity)::bigint                 AS "quantitySold",
            SUM(oi.quantity * oi.unit_price)::bigint AS "revenue"
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        WHERE o.restaurant_id = ${restaurantId}::uuid
          AND o.status NOT IN ('cancelled')
          AND o.created_at >= ${startDate}
          AND o.created_at <= ${endDate}
        GROUP BY oi.product_id, oi.product_name
        ORDER BY SUM(oi.quantity) DESC
        LIMIT ${limit}
    `

    const productIds = topProducts.map((p) => p.productId)
    const products = await prisma.product.findMany({
        where: {id: {in: productIds}},
        select: {id: true, category: {select: {name: true}}},
    })

    const categoryMap = new Map(
        products.map((p) => [p.id, p.category?.name || null])
    )

    return topProducts.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        quantitySold: Number(item.quantitySold),
        revenue: Number(item.revenue),
        categoryName: categoryMap.get(item.productId) || null,
    }))
}

// ============================================================
// VENTES PAR CATÉGORIE
// ============================================================

async function getSalesByCategory(
    restaurantId: string,
    period: TimePeriod,
    customPeriod?: CustomPeriod,
): Promise<CategorySales[]> {
    const {startDate, endDate} = getPeriodRange(period, customPeriod)

    const rows = await prisma.$queryRaw<{
        categoryId: string | null
        categoryName: string | null
        revenue: bigint
        ordersCount: bigint
    }[]>`
        SELECT
            p.category_id                            AS "categoryId",
            c.name                                   AS "categoryName",
            SUM(oi.quantity * oi.unit_price)::bigint AS "revenue",
            COUNT(oi.id)::bigint                     AS "ordersCount"
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        JOIN products p ON p.id = oi.product_id
        LEFT JOIN categories c ON c.id = p.category_id
        WHERE o.restaurant_id = ${restaurantId}::uuid
          AND o.status NOT IN ('cancelled')
          AND o.created_at >= ${startDate}
          AND o.created_at <= ${endDate}
        GROUP BY p.category_id, c.name
        ORDER BY SUM(oi.quantity * oi.unit_price) DESC
    `

    const totalRevenue = rows.reduce((sum, r) => sum + Number(r.revenue), 0)

    return rows.map((r) => ({
        categoryId: r.categoryId ?? null,
        categoryName: r.categoryName ?? 'Sans catégorie',
        revenue: Number(r.revenue),
        ordersCount: Number(r.ordersCount),
        percentage: totalRevenue > 0
            ? Math.round((Number(r.revenue) / totalRevenue) * 100)
            : 0,
    }))
}

// ============================================================
// COMMANDES RÉCENTES
// ============================================================

async function getRecentOrders(
    restaurantId: string,
    limit: number = 10,
): Promise<RecentOrder[]> {
    const orders = await prisma.order.findMany({
        where: {restaurantId},
        include: {
            table: {select: {number: true}},
            orderItems: {select: {id: true}},
        },
        orderBy: {createdAt: 'desc'},
        take: limit,
    })

    return orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        tableNumber: order.table?.number || null,
        customerName: order.customerName,
        totalAmount: order.totalAmount,
        status: order.status,
        itemsCount: order.orderItems.length,
        createdAt: order.createdAt,
    }))
}

// ============================================================
// STATS FINANCIÈRES CAISSE
// ============================================================

async function getFinancialOverviewStats(
    restaurantId: string,
    period: TimePeriod,
    customPeriod?: CustomPeriod,
): Promise<FinancialPeriodStats | null> {
    try {
        const {startDate, endDate} = getPeriodRange(period, customPeriod)
        return await getFinancialStats(restaurantId, startDate, endDate)
    } catch (error) {
        console.error('Erreur chargement stats financières:', error)
        return null
    }
}

// ============================================================
// DASHBOARD COMPLET — point d'entrée public
// ============================================================

export async function getDashboardStats(
    period: TimePeriod,
    customPeriod?: CustomPeriod,
): Promise<DashboardStats> {
    // Une seule auth, restaurantId partagé par tous les appels parallèles
    const restaurantId = await getCurrentRestaurantId()

    const [
        revenue,
        orders,
        stockAlerts,
        dailySales,
        topProducts,
        categorySales,
        recentOrders,
        financial,
    ] = await Promise.all([
        getRevenueStats(restaurantId, period, customPeriod),
        getOrdersStats(restaurantId, period, customPeriod),
        getStockAlerts(restaurantId),
        getDailySales(restaurantId, period, customPeriod),
        getTopProducts(restaurantId, period, customPeriod, 5),
        getSalesByCategory(restaurantId, period, customPeriod),
        getRecentOrders(restaurantId, 5),
        getFinancialOverviewStats(restaurantId, period, customPeriod),
    ])

    return {
        revenue,
        orders,
        stockAlerts,
        dailySales,
        topProducts,
        categorySales,
        recentOrders,
        financial,
    }
}