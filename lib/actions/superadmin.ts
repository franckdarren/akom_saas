'use server'

import {createClient} from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import {isSuperAdminEmail} from '@/lib/utils/permissions'
import {
    logRestaurantActivated,
    logRestaurantDeactivated,
} from '@/lib/actions/logs'
import type {
    Restaurant,
    RestaurantUser,
} from '@prisma/client'
import {notFound} from 'next/navigation'
import {RestaurantDetails} from '@/types/restaurant'

// ============================================================
// TYPES
// ============================================================

export interface PlatformStats {
    // Business
    totalRestaurants: number
    activeRestaurants: number
    totalUsers: number
    totalOrders: number
    totalRevenue: number
    ordersToday: number
    activeSubscriptions: number
    trialSubscriptions: number
    expiredSubscriptions: number
    pendingPayments: number
    subscriptionRevenue: number
    monthlySubscriptionRevenue: number

    // Conformité / Vérification
    pendingDocuments: number
    submittedDocuments: number
    verifiedRestaurants: number
    rejectedDocuments: number
    suspendedRestaurants: number
    pendingCircuitSheets: number
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
        data: {user},
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

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [
        totalRestaurants,
        activeRestaurants,
        totalUsers,
        totalOrders,
        totalRevenue,
        ordersToday,
        activeSubscriptions,
        trialSubscriptions,
        expiredSubscriptions,
        pendingPayments,
        subscriptionRevenue,
        monthlySubscriptionRevenue,

        // 🔥 Conformité
        pendingDocuments,
        submittedDocuments,
        verifiedRestaurants,
        rejectedDocuments,
        suspendedRestaurants,
        pendingCircuitSheets,
    ] = await Promise.all([
        // Restaurants
        prisma.restaurant.count(),
        prisma.restaurant.count({where: {isActive: true}}),

        // Utilisateurs
        prisma.restaurantUser.count(),

        // Commandes
        prisma.order.count(),
        prisma.order.aggregate({
            _sum: {totalAmount: true},
            where: {status: {in: ['delivered', 'ready']}},
        }),
        prisma.order.count({
            where: {
                createdAt: {
                    gte: new Date(new Date().setHours(0, 0, 0, 0)),
                },
            },
        }),

        // Abonnements
        prisma.subscription.count({
            where: {status: {in: ['trial', 'active']}},
        }),
        prisma.subscription.count({
            where: {status: 'trial'},
        }),
        prisma.subscription.count({
            where: {status: {in: ['expired', 'cancelled']}},
        }),

        // Paiements
        prisma.subscriptionPayment.count({
            where: {status: 'pending'},
        }),
        prisma.subscriptionPayment.aggregate({
            where: {status: 'confirmed'},
            _sum: {amount: true},
        }),
        prisma.subscriptionPayment.aggregate({
            where: {
                status: 'confirmed',
                createdAt: {gte: startOfMonth},
            },
            _sum: {amount: true},
        }),

        // 🔥 Conformité restaurants
        prisma.restaurant.count({
            where: {verificationStatus: 'pending_documents'},
        }),
        prisma.restaurant.count({
            where: {verificationStatus: 'documents_submitted'},
        }),
        prisma.restaurant.count({
            where: {verificationStatus: 'verified'},
        }),
        prisma.restaurant.count({
            where: {verificationStatus: 'documents_rejected'},
        }),
        prisma.restaurant.count({
            where: {verificationStatus: 'suspended'},
        }),

        // 🔥 Fiches circuit
        prisma.restaurantCircuitSheet.count({
            where: {
                isSubmitted: true,
                isValidated: false,
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
        activeSubscriptions,
        trialSubscriptions,
        expiredSubscriptions,
        pendingPayments,
        subscriptionRevenue: subscriptionRevenue._sum.amount ?? 0,
        monthlySubscriptionRevenue:
            monthlySubscriptionRevenue._sum.amount ?? 0,

        // 🔥 Conformité
        pendingDocuments,
        submittedDocuments,
        verifiedRestaurants,
        rejectedDocuments,
        suspendedRestaurants,
        pendingCircuitSheets,
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
        orderBy: {createdAt: 'desc'},
    })
}

// ============================================================
// DÉTAILS D'UN RESTAURANT
// ============================================================

export async function getRestaurantDetails(
    restaurantId?: string
): Promise<RestaurantDetails> {
    await verifySuperAdmin()

    if (!restaurantId || typeof restaurantId !== 'string') {
        notFound()
    }

    const restaurant = await prisma.restaurant.findUnique({
        where: {id: restaurantId},
        include: {
            users: {
                select: {
                    id: true,
                    userId: true,
                    role: true,
                    createdAt: true,
                },
            },
            singpayConfig: {
                select: {
                    enabled: true,
                    isConfigured: true,
                    walletId: true,
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
        notFound()
    }

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [totalOrders, totalRevenue, ordersThisMonth] = await Promise.all([
        prisma.order.count({where: {restaurantId}}),
        prisma.order.aggregate({
            where: {
                restaurantId,
                status: {in: ['delivered', 'ready']},
            },
            _sum: {totalAmount: true},
        }),
        prisma.order.count({
            where: {
                restaurantId,
                createdAt: {gte: startOfMonth},
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
        where: {id: restaurantId},
        select: {isActive: true, name: true},
    })

    if (!restaurant) {
        return {error: 'Restaurant introuvable'}
    }

    const updatedRestaurant = await prisma.restaurant.update({
        where: {id: restaurantId},
        data: {isActive: !restaurant.isActive},
    })

    if (!updatedRestaurant.isActive) {
        await logRestaurantDeactivated(restaurantId, restaurant.name)
    } else {
        await logRestaurantActivated(restaurantId, restaurant.name)
    }

    return {success: true}
}

// ============================================================
// LISTE UTILISATEURS
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
        orderBy: {createdAt: 'desc'},
    })
}

// ============================================================
// RECHERCHE UTILISATEUR
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
                ...(isUuid ? [{userId: query}] : []),
                {
                    restaurant: {
                        name: {contains: query, mode: 'insensitive'},
                    },
                },
                {
                    restaurant: {
                        slug: {contains: query, mode: 'insensitive'},
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
        orderBy: {createdAt: 'desc'},
        take: 50,
    })
}

// ============================================================
// ACTIVITÉ 7 DERNIERS JOURS
// ============================================================

export async function getActivityStats(): Promise<ActivityDay[]> {
    await verifySuperAdmin()

    const startOfPeriod = new Date()
    startOfPeriod.setDate(startOfPeriod.getDate() - 6)
    startOfPeriod.setHours(0, 0, 0, 0)

    const rows = await prisma.$queryRaw<{
        date: Date
        ordersCount: bigint
        revenue: bigint
    }[]>`
        SELECT
            DATE_TRUNC('day', created_at) AS "date",
            COUNT(*)::bigint AS "ordersCount",
            COALESCE(SUM(CASE WHEN status IN ('delivered', 'ready') THEN total_amount ELSE 0 END), 0)::bigint AS "revenue"
        FROM orders
        WHERE created_at >= ${startOfPeriod}
        GROUP BY DATE_TRUNC('day', created_at)
        ORDER BY DATE_TRUNC('day', created_at) ASC
    `

    const dataByDate = new Map(
        rows.map((r) => [r.date.toISOString().split('T')[0], r])
    )

    // Garantir 7 entrées même si certains jours n'ont aucune commande
    return Array.from({length: 7}, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - (6 - i))
        const key = date.toISOString().split('T')[0]
        const row = dataByDate.get(key)
        return {
            date: key,
            orders: Number(row?.ordersCount ?? 0),
            revenue: Number(row?.revenue ?? 0),
        }
    })
}

// ============================================================
// TOP 5 RESTAURANTS
// ============================================================

export async function getTopRestaurants(): Promise<
    (Restaurant & { _count: { orders: number } })[]
> {
    await verifySuperAdmin()

    return prisma.restaurant.findMany({
        include: {
            _count: {
                select: {orders: true},
            },
        },
        orderBy: {
            orders: {_count: 'desc'},
        },
        take: 5,
    })
}
