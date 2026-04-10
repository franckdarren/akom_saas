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
    total: number          // Montant total en FCFA
    previousPeriod: number // Pour comparaison
    percentChange: number  // Variation en %
    ordersCount: number    // Nombre de commandes POS livrées
}

export interface OrdersStats {
    total: number
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
    topProduct: string | null
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
    status: 'awaiting_payment' | 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
    itemsCount: number
    createdAt: Date
}

// ============================================================
// DASHBOARD GLOBAL
// ============================================================

// Import du type depuis son module source — on n'importe que le type,
// jamais la fonction, pour éviter de faire fuiter du code Prisma côté client.
import type {FinancialPeriodStats} from '@/lib/stats/financial-aggregates'

export type {FinancialPeriodStats}

export interface DashboardStats {
    revenue: RevenueStats
    orders: OrdersStats
    stockAlerts: StockAlert[]
    dailySales: DailySales[]
    topProducts: TopProduct[]
    categorySales: CategorySales[]
    recentOrders: RecentOrder[]
    financial: FinancialPeriodStats | null // Données caisse — suit la période sélectionnée
}

// ============================================================
// ANALYTICS COMMANDES (Sprint 2)
// ============================================================

export interface OrdersBySource {
    source: string
    count: number
    revenue: number
}

export interface OrdersByFulfillment {
    fulfillmentType: string | null
    count: number
    revenue: number
}

export interface DayOfWeekSales {
    dayOfWeek: number // 0 = Dimanche, 6 = Samedi (ISO PostgreSQL DOW)
    orders: number
    revenue: number
}

export interface OrderAnalytics {
    bySource: OrdersBySource[]
    byFulfillment: OrdersByFulfillment[]
    byHour: HourlySales[]
    byDayOfWeek: DayOfWeekSales[]
}

// ============================================================
// ANALYTICS PAIEMENTS (Sprint 3 — Phase 4)
// ============================================================

export interface PaymentByStatus {
    status: string
    count: number
    amount: number
}

export interface PaymentByMethod {
    method: string
    paidCount: number
    failedCount: number
    totalCount: number
    successRate: number // pourcentage 0-100
}

export interface PaymentAnalytics {
    totalPayments: number
    previousTotalPayments: number  // même période N-1 pour comparaison
    overallSuccessRate: number // pourcentage 0-100
    byStatus: PaymentByStatus[]
    byMethod: PaymentByMethod[]
}

// ============================================================
// ANALYTICS PERFORMANCE (Sprint 3 — Phase 6)
// ============================================================

export interface OrderByStatus {
    status: string
    count: number
}

export interface PerformanceAnalytics {
    totalOrders: number
    previousTotalOrders: number  // même période N-1 pour comparaison
    cancelledCount: number
    cancellationRate: number // pourcentage 0-100
    avgFulfillmentMinutes: number | null // null si aucune commande livrée
    byStatus: OrderByStatus[]
}

// ============================================================
// ANALYTICS PRODUITS & STOCK (Sprint 5 — Phase 8)
// ============================================================

export interface StockMovementByStat {
    type: string          // StockMovementType enum value
    count: number
    totalQty: number      // somme des |quantity|
}

export interface StockRotationItem {
    productId: string
    productName: string
    categoryName: string | null
    outQty: number        // sorties totales (order_out + sale_manual) sur la période
    inQty: number         // entrées totales (manual_in + purchase) sur la période
    currentQty: number    // stock actuel
}

export interface StockValuation {
    totalValue: number            // somme qty * price pour les produits avec prix & stock
    productsWithStock: number     // nb de produits ayant un stock géré
    productsOutOfStock: number    // nb de produits stock = 0
    productsInAlert: number       // nb de produits qty <= alertThreshold (et > 0)
}

export interface ProductAnalytics {
    valuation: StockValuation
    movementsByType: StockMovementByStat[]
    topRotation: StockRotationItem[]   // top 10 produits par sorties
    alerts: StockAlert[]               // produits en rupture / alerte (réexposé avec détail)
    previousMovementsCount: number     // même période N-1 pour comparaison
}

// ============================================================
// ANALYTICS CAISSE & ÉQUIPE (Sprint 4 — Phases 7, 9)
// ============================================================

export interface CashSessionStat {
    id: string
    sessionDate: string          // "YYYY-MM-DD" — date métier de la session
    openingBalance: number
    closingBalance: number | null
    balanceDifference: number | null // positif = surplus, négatif = déficit
    status: string               // 'open' | 'closed'
}

export interface CashOperatorStat {
    userId: string
    email: string                // résolu via supabaseAdmin.auth.admin.listUsers()
    sessionsOpened: number
    sessionsClosed: number
}

export interface CashAnalytics {
    sessions: CashSessionStat[]           // triées par date ASC pour le graphique
    avgOpeningBalance: number
    avgClosingBalance: number | null      // null si aucune session clôturée
    avgGapAmount: number | null           // null si aucun écart constaté
    gapCount: number                      // nb de sessions avec écart > 500 FCFA
    operators: CashOperatorStat[]
    previousSessionsCount: number         // même période N-1 pour comparaison
}

// ============================================================
// ANALYTICS CLIENTS (Sprint 7)
// ============================================================

export interface CustomerStat {
    phone: string | null        // null si client anonyme (pas de téléphone)
    name: string | null         // nom saisi à la commande
    ordersCount: number
    totalRevenue: number        // en FCFA
    isReturning: boolean        // avait déjà commandé avant la période
}

export interface CustomerAnalytics {
    identifiedCustomers: number     // clients avec numéro de téléphone (unique par phone)
    newCustomers: number            // phones apparus pour la première fois sur la période
    returningCustomers: number      // phones ayant commandé avant la période
    anonymousOrders: number         // commandes sans phone ni name
    avgOrdersPerCustomer: number    // moyenne des commandes par client identifié
    topCustomers: CustomerStat[]    // top 10 par CA (clients avec phone uniquement)
    previousIdentifiedCustomers: number  // N-1 pour comparaison
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
    previousStartDate: Date
    previousEndDate: Date
}