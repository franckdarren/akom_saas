// lib/actions/order.ts
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'

type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled'

// ============================================================
// CHANGER LE STATUT D'UNE COMMANDE
// ============================================================

export async function updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus
) {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Non authentifié' }
    }

    try {
        // Récupérer la commande avec vérification d'accès
        const order = await prisma.order.findFirst({
            where: {
                id: orderId,
                restaurant: {
                    users: {
                        some: {
                            userId: user.id,
                        },
                    },
                },
            },
            select: {
                id: true,
                status: true,
                restaurantId: true,
            },
        })

        if (!order) {
            return { error: 'Commande introuvable' }
        }

        // Valider la transition de statut
        const validTransitions: Record<OrderStatus, OrderStatus[]> = {
            pending: ['preparing', 'cancelled'],
            preparing: ['ready', 'cancelled'],
            ready: ['delivered', 'cancelled'],
            delivered: [], // Statut final
            cancelled: [], // Statut final
        }

        const allowedStatuses = validTransitions[order.status as OrderStatus]
        if (!allowedStatuses.includes(newStatus)) {
            return {
                error: `Transition invalide : ${order.status} → ${newStatus}`,
            }
        }

        // Mettre à jour le statut
        await prisma.order.update({
            where: { id: orderId },
            data: { status: newStatus },
        })

        revalidatePath('/dashboard/orders')
        return { success: true }
    } catch (error) {
        console.error('Erreur changement statut:', error)
        return { error: 'Erreur lors du changement de statut' }
    }
}

// ============================================================
// RÉCUPÉRER LES COMMANDES DU RESTAURANT
// ============================================================

export async function getRestaurantOrders(restaurantId: string) {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Non authentifié' }
    }

    // Vérifier l'accès au restaurant
    const hasAccess = await prisma.restaurantUser.findUnique({
        where: {
            userId_restaurantId: {
                userId: user.id,
                restaurantId: restaurantId,
            },
        },
    })

    if (!hasAccess) {
        return { error: 'Accès refusé' }
    }

    try {
        const orders = await prisma.order.findMany({
            where: {
                restaurantId: restaurantId,
                status: {
                    in: ['pending', 'preparing', 'ready'], // Exclure delivered et cancelled
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

        return { success: true, orders }
    } catch (error) {
        console.error('Erreur récupération commandes:', error)
        return { error: 'Erreur lors de la récupération' }
    }
}