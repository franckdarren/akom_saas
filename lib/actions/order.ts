// lib/actions/order.ts
'use server'

import {revalidatePath} from 'next/cache'
import {createClient} from '@/lib/supabase/server'
import prisma from '@/lib/prisma'

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled'

// Flux séquentiel — cuisine (qr_table, public_link, dashboard)
const SEQUENTIAL: Record<OrderStatus, OrderStatus[]> = {
    pending: ['preparing', 'cancelled'],
    preparing: ['ready', 'cancelled'],
    ready: ['delivered', 'cancelled'],
    delivered: [],
    cancelled: [],
}

// Flux libre — comptoir (counter)
// Sauts d'étapes autorisés, jamais de retour en arrière
const FREE: Record<OrderStatus, OrderStatus[]> = {
    pending: ['preparing', 'ready', 'delivered', 'cancelled'],
    preparing: ['ready', 'delivered', 'cancelled'],
    ready: ['delivered', 'cancelled'],
    delivered: [],
    cancelled: [],
}

export async function updateOrderStatus(orderId: string, newStatus: OrderStatus) {
    const supabase = await createClient()
    const {data: {user}} = await supabase.auth.getUser()
    if (!user) return {error: 'Non authentifié'}

    const order = await prisma.order.findUnique({
        where: {id: orderId},
        select: {status: true, restaurantId: true, source: true},
    })
    if (!order) return {error: 'Commande introuvable'}

    const hasAccess = await prisma.restaurantUser.findUnique({
        where: {userId_restaurantId: {userId: user.id, restaurantId: order.restaurantId}},
    })
    if (!hasAccess) return {error: 'Accès refusé'}

    const isCounter = order.source === 'counter'
    const allowed = isCounter ? FREE[order.status] : SEQUENTIAL[order.status]

    if (!allowed.includes(newStatus)) {
        return {error: `Transition invalide : ${order.status} → ${newStatus}`}
    }

    // UPDATE via Supabase pour déclencher le Realtime ET le trigger SQL
    const {error} = await supabase
        .from('orders')
        .update({status: newStatus})
        .eq('id', orderId)

    if (error) return {error: 'Erreur mise à jour'}

    revalidatePath('/dashboard/pos/orders')
    revalidatePath('/dashboard/orders')

    return {success: true}
}

export async function getRestaurantOrders(restaurantId: string) {
    return prisma.order.findMany({
        where: {restaurantId},
        include: {
            table: {select: {number: true}},
            orderItems: {select: {productName: true, quantity: true, unitPrice: true}},
            payments: {select: {method: true, status: true, amount: true}},
        },
        orderBy: {createdAt: 'desc'},
    })
}

interface ActiveOrder {
    id: string;
    orderNumber: string | null
    status: OrderStatus;
    totalAmount: number;
    createdAt: Date
}

export async function getActiveOrdersForTable(tableId: string): Promise<ActiveOrder[]> {
    try {
        return await prisma.order.findMany({
            where: {tableId, status: {notIn: ['delivered', 'cancelled']}},
            select: {id: true, orderNumber: true, status: true, totalAmount: true, createdAt: true},
            orderBy: {createdAt: 'desc'},
        })
    } catch {
        return []
    }
}

export async function getOrderDetails(orderId: string) {
    try {
        return await prisma.order.findUnique({
            where: {id: orderId},
            include: {
                table: {select: {number: true}},
                orderItems: {select: {productName: true, quantity: true, unitPrice: true}},
            },
        })
    } catch {
        return null
    }
}