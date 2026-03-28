import type { Restaurant } from '@prisma/client'

export type RestaurantUser = {
    id: string
    userId: string
    role: string | null // slug du rôle (ex: 'admin', 'kitchen', 'cashier')
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
