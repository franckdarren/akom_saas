import type { Restaurant, UserRole } from '@prisma/client'

export type RestaurantUser = {
    id: string
    userId: string
    role: UserRole | null
    createdAt: Date
}

export type RestaurantDetails = Restaurant & {
    users: RestaurantUser[]
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
