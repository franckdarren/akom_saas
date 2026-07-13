import type {
    Restaurant,
    SubscriptionPlan,
    SubscriptionStatus,
    SubscriptionPayment,
} from '@prisma/client'

export type RestaurantUser = {
    id: string
    userId: string
    role: string | null // slug du rôle (ex: 'admin', 'kitchen', 'cashier')
    createdAt: Date
}

export type RestaurantSubscriptionDetails = {
    id: string
    plan: SubscriptionPlan
    status: SubscriptionStatus
    trialStartsAt: Date
    trialEndsAt: Date
    currentPeriodStart: Date | null
    currentPeriodEnd: Date | null
    activeUsersCount: number
    basePlanPrice: number
    billingCycle: number
    createdAt: Date
    payments: SubscriptionPayment[]
}

export type RestaurantDetails = Restaurant & {
    users: RestaurantUser[]
    singpayConfig: {
        enabled: boolean
        isConfigured: boolean
        walletId: string | null
    } | null
    subscription: RestaurantSubscriptionDetails | null
    _count: {
        orders: number
        products: number
        tables: number
    }
    stats: {
        totalOrders: number
        totalRevenue: number
        ordersThisMonth: number
    }
}
