// lib/actions/stats.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { getPeriodRange } from '@/lib/utils/period'
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
import { format, eachDayOfInterval } from 'date-fns'

// ============================================================
// Récupérer le restaurant de l'utilisateur connecté
// ============================================================

async function getCurrentRestaurantId() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Non authentifié')
    }

    const restaurantUser = await prisma.restaurantUser.findFirst({
        where: { userId: user.id },
        select: { restaurantId: true },
    })

    if (!restaurantUser) {
        throw new Error('Aucun restaurant trouvé')
    }

    return restaurantUser.restaurantId
}

// ============================================================
// STATISTIQUES DE CHIFFRE D'AFFAIRES
// ============================================================

export async function getRevenueStats(
    period: TimePeriod,
    customPeriod?: CustomPeriod
): Promise<RevenueStats> {
    try {
        const restaurantId = await getCurrentRestaurantId()
        const { startDate, endDate, previousStartDate, previousEndDate } =
            getPeriodRange(period, customPeriod)

        // Chiffre d'affaires période actuelle
        const currentRevenue = await prisma.order.aggregate({
            where: {
                restaurantId,
                status: { in: ['delivered'] },
                createdAt: { gte: startDate, lte: endDate },
            },
            _sum: { totalAmount: true },
            _count: true,
        })

        // Chiffre d'affaires période précédente
        const previousRevenue = await prisma.order.aggregate({
            where: {
                restaurantId,
                status: { in: ['delivered'] },
                createdAt: { gte: previousStartDate, lte: previousEndDate },
            },
            _sum: { totalAmount: true },
        })

        const total = currentRevenue._sum.totalAmount || 0
        const previousPeriod = previousRevenue._sum.totalAmount || 0
        const percentChange =
            previousPeriod > 0
                ? ((total - previousPeriod) / previousPeriod) * 100
                : 0

        return {
            total,
            previousPeriod,
            percentChange: Math.round(percentChange * 10) / 10,
            ordersCount: currentRevenue._count,
        }
    } catch (error) {
        console.error('Erreur récupération stats CA:', error)
        throw error
    }
}

// ============================================================
// STATISTIQUES DE COMMANDES
// ============================================================

export async function getOrdersStats(
    period: TimePeriod,
    customPeriod?: CustomPeriod
): Promise<OrdersStats> {
    try {
        const restaurantId = await getCurrentRestaurantId()
        const { startDate, endDate } = getPeriodRange(period, customPeriod)

        const orders = await prisma.order.groupBy({
            by: ['status'],
            where: {
                restaurantId,
                createdAt: { gte: startDate, lte: endDate },
            },
            _count: true,
            _sum: { totalAmount: true },
        })

        const stats = {
            total: 0,
            pending: 0,
            preparing: 0,
            ready: 0,
            delivered: 0,
            cancelled: 0,
            totalRevenue: 0,
        }

        orders.forEach((order) => {
            stats.total += order._count
            stats.totalRevenue += order._sum.totalAmount || 0

            switch (order.status) {
                case 'pending':
                    stats.pending = order._count
                    break
                case 'preparing':
                    stats.preparing = order._count
                    break
                case 'ready':
                    stats.ready = order._count
                    break
                case 'delivered':
                    stats.delivered = order._count
                    break
                case 'cancelled':
                    stats.cancelled = order._count
                    break
            }
        })

        const averageOrderValue =
            stats.total > 0 ? Math.round(stats.totalRevenue / stats.total) : 0

        return {
            total: stats.total,
            pending: stats.pending,
            preparing: stats.preparing,
            ready: stats.ready,
            delivered: stats.delivered,
            cancelled: stats.cancelled,
            averageOrderValue,
        }
    } catch (error) {
        console.error('Erreur récupération stats commandes:', error)
        throw error
    }
}

// ============================================================
// ALERTES STOCK BAS
// ============================================================

export async function getStockAlerts(): Promise<StockAlert[]> {
    try {
        const restaurantId = await getCurrentRestaurantId()

        const alerts = await prisma.stock.findMany({
            where: {
                restaurantId,
                quantity: { lte: prisma.stock.fields.alertThreshold },
            },
            include: {
                product: {
                    select: {
                        name: true,
                        category: {
                            select: { name: true },
                        },
                    },
                },
            },
            orderBy: { quantity: 'asc' },
            take: 10,
        })

        return alerts.map((alert) => ({
            productId: alert.productId,
            productName: alert.product.name,
            currentQuantity: alert.quantity,
            alertThreshold: alert.alertThreshold,
            categoryName: alert.product.category?.name || null,
        }))
    } catch (error) {
        console.error('Erreur récupération alertes stock:', error)
        throw error
    }
}

// ============================================================
// VENTES PAR JOUR
// ============================================================

export async function getDailySales(
    period: TimePeriod,
    customPeriod?: CustomPeriod
): Promise<DailySales[]> {
    try {
        const restaurantId = await getCurrentRestaurantId()
        const { startDate, endDate } = getPeriodRange(period, customPeriod)

        const orders = await prisma.order.groupBy({
            by: ['createdAt'],
            where: {
                restaurantId,
                status: { in: ['delivered'] },
                createdAt: { gte: startDate, lte: endDate },
            },
            _sum: { totalAmount: true },
            _count: true,
        })

        // Générer tous les jours de la période
        const allDays = eachDayOfInterval({ start: startDate, end: endDate })

        // Map pour accès rapide
        const salesByDate = new Map<string, { revenue: number; orders: number }>()
        orders.forEach((order) => {
            const date = format(order.createdAt, 'yyyy-MM-dd')
            const existing = salesByDate.get(date) || { revenue: 0, orders: 0 }
            salesByDate.set(date, {
                revenue: existing.revenue + (order._sum.totalAmount || 0),
                orders: existing.orders + order._count,
            })
        })

        // Remplir avec zéros pour les jours sans ventes
        return allDays.map((day) => {
            const date = format(day, 'yyyy-MM-dd')
            const sales = salesByDate.get(date) || { revenue: 0, orders: 0 }
            return {
                date,
                revenue: sales.revenue,
                orders: sales.orders,
            }
        })
    } catch (error) {
        console.error('Erreur récupération ventes quotidiennes:', error)
        throw error
    }
}

// ============================================================
// TOP PRODUITS
// ============================================================

export async function getTopProducts(
    period: TimePeriod,
    customPeriod?: CustomPeriod,
    limit: number = 5
): Promise<TopProduct[]> {
    try {
        const restaurantId = await getCurrentRestaurantId()
        const { startDate, endDate } = getPeriodRange(period, customPeriod)

        const topProducts = await prisma.orderItem.groupBy({
            by: ['productId', 'productName'],
            where: {
                order: {
                    restaurantId,
                    status: { in: ['delivered'] },
                    createdAt: { gte: startDate, lte: endDate },
                },
            },
            _sum: {
                quantity: true,
                unitPrice: true,
            },
            _count: true,
            orderBy: {
                _sum: {
                    quantity: 'desc',
                },
            },
            take: limit,
        })

        // Récupérer les catégories
        const productIds = topProducts.map((p) => p.productId)
        const products = await prisma.product.findMany({
            where: { id: { in: productIds } },
            select: {
                id: true,
                category: { select: { name: true } },
            },
        })

        const categoryMap = new Map(
            products.map((p) => [p.id, p.category?.name || null])
        )

        return topProducts.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            quantitySold: item._sum.quantity || 0,
            revenue: (item._sum.quantity || 0) * (item._sum.unitPrice || 0),
            categoryName: categoryMap.get(item.productId) || null,
        }))
    } catch (error) {
        console.error('Erreur récupération top produits:', error)
        throw error
    }
}

// ============================================================
// VENTES PAR CATÉGORIE
// ============================================================

export async function getSalesByCategory(
    period: TimePeriod,
    customPeriod?: CustomPeriod
): Promise<CategorySales[]> {
    try {
        const restaurantId = await getCurrentRestaurantId()
        const { startDate, endDate } = getPeriodRange(period, customPeriod)

        // Récupérer tous les items vendus avec leur catégorie
        const orderItems = await prisma.orderItem.findMany({
            where: {
                order: {
                    restaurantId,
                    status: { in: ['delivered'] },
                    createdAt: { gte: startDate, lte: endDate },
                },
            },
            include: {
                product: {
                    select: {
                        categoryId: true,
                        category: {
                            select: { name: true },
                        },
                    },
                },
            },
        })

        // Grouper par catégorie
        const categoryMap = new Map<
            string,
            { name: string; revenue: number; count: number }
        >()

        orderItems.forEach((item) => {
            const categoryId = item.product.categoryId || 'uncategorized'
            const categoryName =
                item.product.category?.name || 'Sans catégorie'
            const revenue = item.quantity * item.unitPrice

            const existing = categoryMap.get(categoryId) || {
                name: categoryName,
                revenue: 0,
                count: 0,
            }

            categoryMap.set(categoryId, {
                name: categoryName,
                revenue: existing.revenue + revenue,
                count: existing.count + 1,
            })
        })

        // Calculer le total pour les pourcentages
        const totalRevenue = Array.from(categoryMap.values()).reduce(
            (sum, cat) => sum + cat.revenue,
            0
        )

        return Array.from(categoryMap.entries())
            .map(([categoryId, data]) => ({
                categoryId: categoryId === 'uncategorized' ? null : categoryId,
                categoryName: data.name,
                revenue: data.revenue,
                ordersCount: data.count,
                percentage:
                    totalRevenue > 0
                        ? Math.round((data.revenue / totalRevenue) * 100)
                        : 0,
            }))
            .sort((a, b) => b.revenue - a.revenue)
    } catch (error) {
        console.error('Erreur récupération ventes par catégorie:', error)
        throw error
    }
}

// ============================================================
// COMMANDES RÉCENTES
// ============================================================

export async function getRecentOrders(limit: number = 10): Promise<RecentOrder[]> {
    try {
        const restaurantId = await getCurrentRestaurantId()

        const orders = await prisma.order.findMany({
            where: { restaurantId },
            include: {
                table: { select: { number: true } },
                orderItems: { select: { id: true } },
            },
            orderBy: { createdAt: 'desc' },
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
    } catch (error) {
        console.error('Erreur récupération commandes récentes:', error)
        throw error
    }
}

// ============================================================
// DASHBOARD COMPLET (une seule requête optimisée)
// ============================================================

export async function getDashboardStats(
    period: TimePeriod,
    customPeriod?: CustomPeriod
): Promise<DashboardStats> {
    try {
        const [
            revenue,
            orders,
            stockAlerts,
            dailySales,
            topProducts,
            categorySales,
            recentOrders,
        ] = await Promise.all([
            getRevenueStats(period, customPeriod),
            getOrdersStats(period, customPeriod),
            getStockAlerts(),
            getDailySales(period, customPeriod),
            getTopProducts(period, customPeriod, 5),
            getSalesByCategory(period, customPeriod),
            getRecentOrders(10),
        ])

        return {
            revenue,
            orders,
            stockAlerts,
            dailySales,
            topProducts,
            categorySales,
            recentOrders,
        }
    } catch (error) {
        console.error('Erreur récupération dashboard:', error)
        throw error
    }
}