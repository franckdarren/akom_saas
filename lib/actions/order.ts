// lib/actions/order.ts
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
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
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) return { error: 'Non authentifié' }

    // 1️⃣ Vérifications via Prisma (OK)
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { status: true, restaurantId: true },
    })

    if (!order) return { error: 'Commande introuvable' }

    const hasAccess = await prisma.restaurantUser.findUnique({
        where: {
            userId_restaurantId: {
                userId: user.id,
                restaurantId: order.restaurantId,
            },
        },
    })

    if (!hasAccess) return { error: 'Accès refusé' }

    // 2️⃣ Validation transition
    const transitions: Record<OrderStatus, OrderStatus[]> = {
        pending: ['preparing', 'cancelled'],
        preparing: ['ready', 'cancelled'],
        ready: ['delivered', 'cancelled'],
        delivered: [],
        cancelled: [],
    }

    if (!transitions[order.status].includes(newStatus)) {
        return { error: 'Transition invalide' }
    }

    // 3️⃣ UPDATE VIA SUPABASE (🔥 clé du Realtime)
    const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId)

    if (error) {
        console.error(error)
        return { error: 'Erreur mise à jour' }
    }

    return { success: true }
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

        return { success: true, orders }
    } catch (error) {
        console.error('Erreur récupération commandes:', error)
        return { error: 'Erreur lors de la récupération' }
    }
}