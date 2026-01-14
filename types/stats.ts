// types/stats.ts

// ============================================================
// ENUMS & CONSTANTES
// ============================================================

export const TIME_PERIODS = {
    TODAY: 'today',
    WEEK: 'week',
    MONTH: 'month',
    CUSTOM: 'custom',
} as const

export type TimePeriod = typeof TIME_PERIODS[keyof typeof TIME_PERIODS]

// ============================================================
// STATS GÉNÉRALES
// ============================================================

export interface RevenueStats {
    total: number // Montant total en FCFA
    previousPeriod: number // Pour comparaison
    percentChange: number // Variation en %
    ordersCount: number // Nombre de commandes
}

export interface OrdersStats {
    total: number // Nombre total de commandes
    pending: number
    preparing: number
    ready: number
    delivered: number
    cancelled: number
    averageOrderValue: number // Panier moyen
}

export interface StockAlert {
    productId: string
    productName: string
    currentQuantity: number
    alertThreshold: number
    categoryName: string | null
}

// ============================================================
// GRAPHIQUES
// ============================================================

export interface DailySales {
    date: string // Format: "2025-01-15"
    revenue: number
    orders: number
}

export interface HourlySales {
    hour: number // 0-23
    orders: number
    revenue: number
}

export interface CategorySales {
    categoryId: string | null
    categoryName: string
    revenue: number
    ordersCount: number
    percentage: number
}

export interface TopProduct {
    productId: string
    productName: string
    quantitySold: number
    revenue: number
    categoryName: string | null
}

// ============================================================
// COMMANDES RÉCENTES
// ============================================================

export interface RecentOrder {
    id: string
    orderNumber: string | null
    tableNumber: number | null
    customerName: string | null
    totalAmount: number
    status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
    itemsCount: number
    createdAt: Date
}

// ============================================================
// DASHBOARD GLOBAL
// ============================================================

export interface DashboardStats {
    revenue: RevenueStats
    orders: OrdersStats
    stockAlerts: StockAlert[]
    dailySales: DailySales[]
    topProducts: TopProduct[]
    categorySales: CategorySales[]
    recentOrders: RecentOrder[]
}

// ============================================================
// PÉRIODE PERSONNALISÉE
// ============================================================

export interface CustomPeriod {
    startDate: Date
    endDate: Date
}

export interface PeriodRange {
    startDate: Date
    endDate: Date
    previousStartDate: Date // Pour comparaison
    previousEndDate: Date
}