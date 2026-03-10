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
import {getCurrentUserAndRestaurant} from '@/lib/auth/session'
import {getFinancialStats} from '@/lib/stats/financial-aggregates'
import type {FinancialPeriodStats} from '@/lib/stats/financial-aggregates'
import {OrderStatus} from '@prisma/client'

// ============================================================
// Récupérer le restaurant de l'utilisateur connecté
// ============================================================

async function getCurrentRestaurantId() {
    const supabase = await createClient()
    const {
        data: {user},
    } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Non authentifié')
    }

    const restaurantUser = await prisma.restaurantUser.findFirst({
        where: {userId: user.id},
        select: {restaurantId: true},
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
    const restaurantId = await getCurrentRestaurantId()
    const { startDate, endDate, previousStartDate, previousEndDate } =
        getPeriodRange(period, customPeriod)

    // ── POS : commandes livrées ──────────────────────────────────────────
    const [currentOrders, previousOrders, currentManual, previousManual] =
        await Promise.all([
            prisma.order.aggregate({
                where: {
                    restaurantId,
                    status: 'delivered',
                    createdAt: { gte: startDate, lte: endDate },
                },
                _sum: { totalAmount: true },
                _count: true,
            }),
            prisma.order.aggregate({
                where: {
                    restaurantId,
                    status: 'delivered',
                    createdAt: { gte: previousStartDate, lte: previousEndDate },
                },
                _sum: { totalAmount: true },
            }),
            // ── CAISSE : recettes manuelles ──────────────────────────────
            prisma.manualRevenue.aggregate({
                where: {
                    restaurantId,
                    createdAt: { gte: startDate, lte: endDate },
                },
                _sum: { totalAmount: true },
            }),
            prisma.manualRevenue.aggregate({
                where: {
                    restaurantId,
                    createdAt: { gte: previousStartDate, lte: previousEndDate },
                },
                _sum: { totalAmount: true },
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
        // tu peux enrichir le type avec posRevenue + manualRevenue si tu veux les afficher séparément
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
        // console.log('🟢 restaurantId used in stats:', restaurantId)

        // 🔹 Déterminer la plage via getPeriodRange
        let {startDate, endDate} = getPeriodRange(period, customPeriod)

        // 🔹 Vérifier s’il y a des commandes dans cette période
        const lastOrder = await prisma.order.findFirst({
            where: {restaurantId},
            orderBy: {createdAt: 'desc'},
            select: {createdAt: true},
        })

        if (lastOrder && lastOrder.createdAt < startDate) {
            // Ajuster la période à la dernière commande pour éviter 0 partout
            endDate = lastOrder.createdAt
            startDate = new Date(endDate)
            startDate.setDate(endDate.getDate() - 6) // dernière semaine de commandes
            console.log('⚠️ Ajustement période à la dernière commande existante')
        }

        // console.log('🛰 Filtering orders from', startDate.toISOString(), 'to', endDate.toISOString())

        // 🔹 GroupBy Prisma par statut
        const ordersGrouped = await prisma.order.groupBy({
            by: ['status'],
            where: {
                restaurantId,
                createdAt: {gte: startDate, lte: endDate},
            },
            _count: {_all: true},
            _sum: {totalAmount: true},
        })

        // console.log('🟢 GROUP BY RESULT:', ordersGrouped)

        // 🔹 Initialisation stats
        const stats = {
            total: 0,
            pending: 0,
            preparing: 0,
            ready: 0,
            delivered: 0,
            cancelled: 0,
            totalRevenue: 0,
        }

        // 🔹 Calcul par statut
        ordersGrouped.forEach((order) => {
            const count = order._count._all
            const revenue = order._sum.totalAmount ?? 0

            stats.total += count
            stats.totalRevenue += revenue

            switch (order.status) {
                case 'pending':
                    stats.pending = count
                    break
                case 'preparing':
                    stats.preparing = count
                    break
                case 'ready':
                    stats.ready = count
                    break
                case 'delivered':
                    stats.delivered = count
                    break
                case 'cancelled':
                    stats.cancelled = count
                    break
                default:
                    console.warn('⚠️ Statut inconnu:', order.status)
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
        console.error('❌ Erreur récupération stats commandes:', error)
        throw error
    }
}


// ============================================================
// ALERTES STOCK BAS
// ============================================================

export async function getStockAlerts(): Promise<StockAlert[]> {
    try {
        const restaurantId = await getCurrentRestaurantId()

        // ⚠️ IMPORTANT : Prisma ne peut pas comparer deux colonnes directement
        // On récupère tous les stocks et on filtre côté application
        const allStocks = await prisma.stock.findMany({
            where: {
                restaurantId,
            },
            include: {
                product: {
                    select: {
                        name: true,
                        category: {
                            select: {name: true},
                        },
                    },
                },
            },
            orderBy: {quantity: 'asc'},
        })

        // Filtrer les stocks bas côté application
        const alerts = allStocks
            .filter(stock => stock.quantity <= stock.alertThreshold)
            .slice(0, 10)

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
    const restaurantId = await getCurrentRestaurantId()
    const { startDate, endDate } = getPeriodRange(period, customPeriod)
    const allDays = eachDayOfInterval({ start: startDate, end: endDate })

    const [orders, manualRevenues] = await Promise.all([
        prisma.order.findMany({
            where: {
                restaurantId,
                status: { notIn: ['cancelled'] },
                createdAt: { gte: startDate, lte: endDate },
            },
            select: { createdAt: true, totalAmount: true },
        }),
        prisma.manualRevenue.findMany({
            where: {
                restaurantId,
                createdAt: { gte: startDate, lte: endDate },
            },
            select: { createdAt: true, totalAmount: true },
        }),
    ])

    const salesByDate = new Map<string, { revenue: number; orders: number }>()

    // Fusionner les deux flux dans la même map
    const addToMap = (createdAt: Date, amount: number, countAsOrder: boolean) => {
        const date = format(createdAt, 'yyyy-MM-dd')
        const existing = salesByDate.get(date) ?? { revenue: 0, orders: 0 }
        salesByDate.set(date, {
            revenue: existing.revenue + amount,
            orders: existing.orders + (countAsOrder ? 1 : 0),
        })
    }

    orders.forEach((o) => addToMap(o.createdAt, o.totalAmount, true))
    manualRevenues.forEach((r) => addToMap(r.createdAt, r.totalAmount, false))

    return allDays.map((day) => {
        const date = format(day, 'yyyy-MM-dd')
        const sales = salesByDate.get(date) ?? { revenue: 0, orders: 0 }
        return { date, revenue: sales.revenue, orders: sales.orders }
    })
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
        const {startDate, endDate} = getPeriodRange(period, customPeriod)

        // ✅ FIX : On compte tous les produits vendus (sauf commandes annulées)
        const topProducts = await prisma.orderItem.groupBy({
            by: ['productId', 'productName'],
            where: {
                order: {
                    restaurantId,
                    status: {notIn: ['cancelled']},
                    createdAt: {gte: startDate, lte: endDate},
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
            where: {id: {in: productIds}},
            select: {
                id: true,
                category: {select: {name: true}},
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
        const {startDate, endDate} = getPeriodRange(period, customPeriod)

        // ✅ FIX : On récupère tous les items vendus (sauf commandes annulées)
        const orderItems = await prisma.orderItem.findMany({
            where: {
                order: {
                    restaurantId,
                    status: {notIn: ['cancelled']},
                    createdAt: {gte: startDate, lte: endDate},
                },
            },
            include: {
                product: {
                    select: {
                        categoryId: true,
                        category: {
                            select: {name: true},
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
            financial,
        ] = await Promise.all([
            getRevenueStats(period, customPeriod),
            getOrdersStats(period, customPeriod),
            getStockAlerts(),
            getDailySales(period, customPeriod),
            getTopProducts(period, customPeriod, 5),
            getSalesByCategory(period, customPeriod),
            getRecentOrders(5),
            getFinancialOverviewStats(period, customPeriod),
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
    } catch (error) {
        console.error('Erreur récupération dashboard:', error)
        throw error
    }
}


// ============================================================
// STATS DE LA CAISSE
// ============================================================
export async function getFinancialOverviewStats(
    period: TimePeriod,
    customPeriod?: CustomPeriod,
): Promise<FinancialPeriodStats | null> {
    try {
        const { restaurantId } = await getCurrentUserAndRestaurant()
        if (!restaurantId) return null

        const { startDate, endDate } = getPeriodRange(period, customPeriod)
        return await getFinancialStats(restaurantId, startDate, endDate)
    } catch (error) {
        console.error('Erreur chargement stats financières:', error)
        return null
    }
}