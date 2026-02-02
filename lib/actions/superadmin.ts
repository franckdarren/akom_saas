'use server'

import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { isSuperAdminEmail } from '@/lib/utils/permissions'
import {
    logRestaurantActivated,
    logRestaurantDeactivated,
} from '@/lib/actions/logs'
import type {
    Restaurant,
    RestaurantUser,
} from '@prisma/client'
import type { RestaurantDetails } from '@/types/restaurant'

// ============================================================
// TYPES
// ============================================================

export interface PlatformStats {
    totalRestaurants: number
    activeRestaurants: number
    totalUsers: number
    totalOrders: number
    totalRevenue: number
    ordersToday: number
}

export interface ActivityDay {
    date: string
    orders: number
    revenue: number
}

// ============================================================
// VÉRIFICATION SUPERADMIN
// ============================================================

async function verifySuperAdmin() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Non authentifié')
    }

    if (!isSuperAdminEmail(user.email ?? '')) {
        throw new Error('Accès refusé : SuperAdmin uniquement')
    }

    return user
}

// ============================================================
// STATISTIQUES GLOBALES PLATEFORME
// ============================================================

export async function getPlatformStats(): Promise<PlatformStats> {
    await verifySuperAdmin()

    const [
        totalRestaurants,
        activeRestaurants,
        totalUsers,
        totalOrders,
        totalRevenue,
        ordersToday,
    ] = await Promise.all([
        prisma.restaurant.count(),
        prisma.restaurant.count({ where: { isActive: true } }),
        prisma.restaurantUser.count(),
        prisma.order.count(),
        prisma.order.aggregate({
            _sum: { totalAmount: true },
            where: { status: { in: ['delivered', 'ready'] } },
        }),
        prisma.order.count({
            where: {
                createdAt: {
                    gte: new Date(new Date().setHours(0, 0, 0, 0)),
                },
            },
        }),
    ])

    return {
        totalRestaurants,
        activeRestaurants,
        totalUsers,
        totalOrders,
        totalRevenue: totalRevenue._sum.totalAmount ?? 0,
        ordersToday,
    }
}

// ============================================================
// LISTE DE TOUS LES RESTAURANTS
// ============================================================

export async function getAllRestaurants(): Promise<
    (Restaurant & {
        _count: {
            users: number
            orders: number
            products: number
        }
    })[]
> {
    await verifySuperAdmin()

    return prisma.restaurant.findMany({
        include: {
            _count: {
                select: {
                    users: true,
                    orders: true,
                    products: true,
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    })
}

// ============================================================
// DÉTAILS D'UN RESTAURANT
// ============================================================

export async function getRestaurantDetails(
    restaurantId: string
): Promise<RestaurantDetails> {
    await verifySuperAdmin()

    const restaurant = await prisma.restaurant.findUnique({
        where: { id: restaurantId },
        include: {
            users: {
                select: {
                    id: true,
                    userId: true,
                    role: true,
                    createdAt: true,
                },
            },
            _count: {
                select: {
                    orders: true,
                    products: true,
                    tables: true,
                },
            },
        },
    })

    if (!restaurant) {
        throw new Error('Restaurant introuvable')
    }

    const [totalOrders, totalRevenue, ordersThisMonth] = await Promise.all([
        prisma.order.count({ where: { restaurantId } }),

        prisma.order.aggregate({
            where: {
                restaurantId,
                status: { in: ['delivered', 'ready'] },
            },
            _sum: { totalAmount: true },
        }),

        prisma.order.count({
            where: {
                restaurantId,
                createdAt: {
                    gte: new Date(
                        new Date().getFullYear(),
                        new Date().getMonth(),
                        1
                    ),
                },
            },
        }),
    ])

    return {
        ...restaurant,
        stats: {
            totalOrders,
            totalRevenue: totalRevenue._sum.totalAmount ?? 0,
            ordersThisMonth,
        },
    }
}

// ============================================================
// ACTIVER / DÉSACTIVER UN RESTAURANT
// ============================================================

export async function toggleRestaurantStatus(
    restaurantId: string
): Promise<{ success?: true; error?: string }> {
    await verifySuperAdmin()

    const restaurant = await prisma.restaurant.findUnique({
        where: { id: restaurantId },
        select: { isActive: true, name: true },
    })

    if (!restaurant) {
        return { error: 'Restaurant introuvable' }
    }

    const updatedRestaurant = await prisma.restaurant.update({
        where: { id: restaurantId },
        data: { isActive: !restaurant.isActive },
    })

    if (!updatedRestaurant.isActive) {
        await logRestaurantDeactivated(restaurantId, restaurant.name)
    } else {
        await logRestaurantActivated(restaurantId, restaurant.name)
    }

    return { success: true }
}

// ============================================================
// LISTE DE TOUS LES UTILISATEURS
// ============================================================

export async function getAllUsers(): Promise<
    (RestaurantUser & {
        restaurant: {
            id: string
            name: string
            slug: string
        }
    })[]
> {
    await verifySuperAdmin()

    return prisma.restaurantUser.findMany({
        include: {
            restaurant: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    })
}

// ============================================================
// RECHERCHER UN UTILISATEUR
// ============================================================

export async function searchUser(
    query: string
): Promise<
    (RestaurantUser & {
        restaurant: {
            id: string
            name: string
            slug: string
        }
    })[]
> {
    await verifySuperAdmin()

    const isUuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            query
        )

    return prisma.restaurantUser.findMany({
        where: {
            OR: [
                ...(isUuid ? [{ userId: query }] : []),
                {
                    restaurant: {
                        name: {
                            contains: query,
                            mode: 'insensitive',
                        },
                    },
                },
                {
                    restaurant: {
                        slug: {
                            contains: query,
                            mode: 'insensitive',
                        },
                    },
                },
            ],
        },
        include: {
            restaurant: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                },
            },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
    })
}

// ============================================================
// STATISTIQUES D'ACTIVITÉ (7 derniers jours)
// ============================================================

export async function getActivityStats(): Promise<ActivityDay[]> {
    await verifySuperAdmin()

    const days = 7
    const stats: ActivityDay[] = []

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        date.setHours(0, 0, 0, 0)

        const nextDate = new Date(date)
        nextDate.setDate(nextDate.getDate() + 1)

        const ordersCount = await prisma.order.count({
            where: {
                createdAt: {
                    gte: date,
                    lt: nextDate,
                },
            },
        })

        const revenue = await prisma.order.aggregate({
            where: {
                createdAt: {
                    gte: date,
                    lt: nextDate,
                },
                status: { in: ['delivered', 'ready'] },
            },
            _sum: { totalAmount: true },
        })

        stats.push({
            date: date.toISOString().split('T')[0],
            orders: ordersCount,
            revenue: revenue._sum.totalAmount ?? 0,
        })
    }

    return stats
}

// ============================================================
// TOP 5 RESTAURANTS PAR COMMANDES
// ============================================================

export async function getTopRestaurants(): Promise<
    (Restaurant & { _count: { orders: number } })[]
> {
    await verifySuperAdmin()

    return prisma.restaurant.findMany({
        include: {
            _count: {
                select: { orders: true },
            },
        },
        orderBy: {
            orders: {
                _count: 'desc',
            },
        },
        take: 5,
    })
}
