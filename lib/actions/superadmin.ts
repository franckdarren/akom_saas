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

    if (!user) {
        throw new Error('Non authentifié')
    }

    if (!isSuperAdminEmail(user.email || '')) {
        throw new Error('Accès refusé : SuperAdmin uniquement')
    }

    return user
}

// ============================================================
// STATISTIQUES GLOBALES PLATEFORME
// ============================================================

export async function getPlatformStats() {
    await verifySuperAdmin()

    const [
        totalRestaurants,
        activeRestaurants,
        totalUsers,
        totalOrders,
        totalRevenue,
        ordersToday,
    ] = await Promise.all([
        // Total restaurants
        prisma.restaurant.count(),

        // Restaurants actifs
        prisma.restaurant.count({
            where: { isActive: true },
        }),

        // Total utilisateurs
        prisma.restaurantUser.count(),

        // Total commandes
        prisma.order.count(),

        // Revenu total (somme de tous les total_amount)
        prisma.order.aggregate({
            _sum: { totalAmount: true },
            where: { status: { in: ['delivered', 'ready'] } },
        }),

        // Commandes aujourd'hui
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
        totalRevenue: totalRevenue._sum.totalAmount || 0,
        ordersToday,
    }
}

// ============================================================
// LISTE DE TOUS LES RESTAURANTS
// ============================================================

export async function getAllRestaurants() {
    await verifySuperAdmin()

    const restaurants = await prisma.restaurant.findMany({
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

    return restaurants
}

// ============================================================
// DÉTAILS D'UN RESTAURANT
// ============================================================

export async function getRestaurantDetails(restaurantId: string) {
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

    // Stats du restaurant
    const [totalOrders, totalRevenue, ordersThisMonth] = await Promise.all([
        prisma.order.count({
            where: { restaurantId },
        }),

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
                    gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                },
            },
        }),
    ])

    return {
        ...restaurant,
        stats: {
            totalOrders,
            totalRevenue: totalRevenue._sum.totalAmount || 0,
            ordersThisMonth,
        },
    }
}

// ============================================================
// ACTIVER / DÉSACTIVER UN RESTAURANT
// ============================================================

export async function toggleRestaurantStatus(restaurantId: string) {
    await verifySuperAdmin()

    const restaurant = await prisma.restaurant.findUnique({
        where: { id: restaurantId },
        select: { isActive: true },
    })

    if (!restaurant) {
        return { error: 'Restaurant introuvable' }
    }

    await prisma.restaurant.update({
        where: { id: restaurantId },
        data: { isActive: !restaurant.isActive },
    })

    return { success: true }
}

// ============================================================
// LISTE DE TOUS LES UTILISATEURS
// ============================================================

export async function getAllUsers() {
    await verifySuperAdmin()

    const users = await prisma.restaurantUser.findMany({
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

    return users
}

// ============================================================
// RECHERCHER UN UTILISATEUR
// ============================================================

export async function searchUser(query: string) {
    await verifySuperAdmin()

    // Si la query ressemble à un UUID, chercher par userId exact
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(query)
    
    const users = await prisma.restaurantUser.findMany({
        where: {
            OR: [
                // Si UUID, recherche exacte par userId
                ...(isUuid ? [{ userId: query }] : []),
                // Recherche par nom de restaurant
                {
                    restaurant: {
                        name: { 
                            contains: query, 
                            mode: 'insensitive' as const
                        },
                    },
                },
                // Recherche par slug de restaurant
                {
                    restaurant: {
                        slug: { 
                            contains: query, 
                            mode: 'insensitive' as const
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

    return users
}

// ============================================================
// STATISTIQUES D'ACTIVITÉ (7 derniers jours)
// ============================================================

export async function getActivityStats() {
    await verifySuperAdmin()

    const days = 7
    const stats = []

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
            revenue: revenue._sum.totalAmount || 0,
        })
    }

    return stats
}

// ============================================================
// TOP 5 RESTAURANTS PAR COMMANDES
// ============================================================

export async function getTopRestaurants() {
    await verifySuperAdmin()

    const restaurants = await prisma.restaurant.findMany({
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

    return restaurants
}