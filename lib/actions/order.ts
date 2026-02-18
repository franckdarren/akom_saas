// lib/actions/order.ts
'use server'

import {revalidatePath} from 'next/cache'
import {createClient} from '@/lib/supabase/server'
import prisma from '@/lib/prisma'

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled'

// ============================================================
// CHANGER LE STATUT D'UNE COMMANDE
// ============================================================

export async function updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus
) {
    const supabase = await createClient()

    const {
        data: {user},
    } = await supabase.auth.getUser()

    if (!user) return {error: 'Non authentifié'}

    // Vérifications via Prisma
    const order = await prisma.order.findUnique({
        where: {id: orderId},
        select: {status: true, restaurantId: true},
    })

    if (!order) return {error: 'Commande introuvable'}

    const hasAccess = await prisma.restaurantUser.findUnique({
        where: {
            userId_restaurantId: {
                userId: user.id,
                restaurantId: order.restaurantId,
            },
        },
    })

    if (!hasAccess) return {error: 'Accès refusé'}

    // Validation transition
    const transitions: Record<OrderStatus, OrderStatus[]> = {
        pending: ['preparing', 'cancelled'],
        preparing: ['ready', 'cancelled'],
        ready: ['delivered', 'cancelled'],
        delivered: [],
        cancelled: [],
    }

    if (!transitions[order.status].includes(newStatus)) {
        return {error: 'Transition invalide'}
    }

    // UPDATE via Supabase pour déclencher le Realtime
    const {error} = await supabase
        .from('orders')
        .update({status: newStatus})
        .eq('id', orderId)

    if (error) {
        console.error(error)
        return {error: 'Erreur mise à jour'}
    }

    // ✅ Revalider les pages SSR après le update
    revalidatePath('/dashboard/orders')

    return {success: true}
}

// ============================================================
// RÉCUPÉRER LES COMMANDES DU RESTAURANT
// ============================================================

export async function getRestaurantOrders(restaurantId: string) {
    const supabase = await createClient()
    const {
        data: {user},
    } = await supabase.auth.getUser()

    if (!user) {
        return {error: 'Non authentifié'}
    }

    const hasAccess = await prisma.restaurantUser.findUnique({
        where: {
            userId_restaurantId: {
                userId: user.id,
                restaurantId: restaurantId,
            },
        },
    })

    if (!hasAccess) {
        return {error: 'Accès refusé'}
    }

    try {
        const orders = await prisma.order.findMany({
            where: {
                restaurantId: restaurantId,
                status: {
                    in: ['pending', 'preparing', 'ready'],
                },
            },
            include: {
                table: {
                    select: {
                        number: true,
                    },
                },
                orderItems: {
                    include: {
                        product: {
                            select: {
                                name: true,
                                imageUrl: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        })

        return {success: true, orders}
    } catch (error) {
        console.error('Erreur récupération commandes:', error)
        return {error: 'Erreur lors de la récupération'}
    }
}

// ============================================================
// Récupérer les commandes actives d'une table
// ============================================================

interface ActiveOrder {
    id: string
    orderNumber: string | null
    status: OrderStatus
    totalAmount: number
    createdAt: Date
}

export async function getActiveOrdersForTable(
    tableId: string
): Promise<ActiveOrder[]> {
    try {
        const supabase = await createClient()
        const {
            data: {user},
        } = await supabase.auth.getUser()

        if (!user) return []

        // ✅ Vérifier que la table appartient au restaurant de l'utilisateur
        const table = await prisma.table.findUnique({
            where: {id: tableId},
            select: {restaurantId: true},
        })

        if (!table) return []

        const hasAccess = await prisma.restaurantUser.findUnique({
            where: {
                userId_restaurantId: {
                    userId: user.id,
                    restaurantId: table.restaurantId,
                },
            },
        })

        if (!hasAccess) return []

        const orders = await prisma.order.findMany({
            where: {
                tableId,
                status: {
                    notIn: ['delivered', 'cancelled'],
                },
            },
            select: {
                id: true,
                orderNumber: true,
                status: true,
                totalAmount: true,
                createdAt: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        })

        return orders as ActiveOrder[]
    } catch (error) {
        console.error('Erreur récupération commandes actives:', error)
        return []
    }
}

// ============================================================
// Récupérer les détails d'une commande spécifique
// ============================================================

export async function getOrderDetails(orderId: string) {
    try {
        const supabase = await createClient()
        const {
            data: {user},
        } = await supabase.auth.getUser()

        if (!user) return null

        // ✅ Vérifier que la commande appartient au restaurant de l'utilisateur
        const order = await prisma.order.findUnique({
            where: {id: orderId},
            select: {restaurantId: true},
        })

        if (!order) return null

        const hasAccess = await prisma.restaurantUser.findUnique({
            where: {
                userId_restaurantId: {
                    userId: user.id,
                    restaurantId: order.restaurantId,
                },
            },
        })

        if (!hasAccess) return null

        const orderDetails = await prisma.order.findUnique({
            where: {id: orderId},
            include: {
                table: {
                    select: {
                        number: true,
                    },
                },
                orderItems: {
                    select: {
                        productName: true,
                        quantity: true,
                        unitPrice: true,
                    },
                },
            },
        })

        return orderDetails
    } catch (error) {
        console.error('Erreur récupération détails commande:', error)
        return null
    }
}