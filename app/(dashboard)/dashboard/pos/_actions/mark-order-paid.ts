// app/(dashboard)/dashboard/pos/_actions/mark-order-paid.ts
'use server'

import prisma from '@/lib/prisma'
import {getCurrentUserAndRestaurant} from '@/lib/auth/session'
import {revalidatePath} from 'next/cache'
import {PaymentStatus, PaymentMethod} from '@prisma/client'

export async function markOrderPaid(orderId: string, method: PaymentMethod) {
    const {userId, restaurantId} = await getCurrentUserAndRestaurant()
    if (!userId || !restaurantId) return {error: 'Non autorisé'}

    // Vérifier que la commande appartient bien à ce restaurant
    const order = await prisma.order.findUnique({
        where: {id: orderId},
        select: {
            id: true,
            restaurantId: true,
            totalAmount: true,
            payments: {select: {id: true, status: true}},
        },
    })

    if (!order || order.restaurantId !== restaurantId) {
        return {error: 'Commande introuvable'}
    }

    // Chercher un paiement en attente existant
    const pendingPayment = order.payments.find(p => p.status === PaymentStatus.pending)

    if (pendingPayment) {
        // Mettre à jour le paiement existant
        await prisma.payment.update({
            where: {id: pendingPayment.id},
            data: {
                status: PaymentStatus.paid,
                method,
            },
        })
    } else {
        // Aucun paiement n'existe encore → en créer un
        await prisma.payment.create({
            data: {
                orderId,
                restaurantId,
                amount: order.totalAmount,
                method,
                status: PaymentStatus.paid,
                timing: 'after_meal',
            },
        })
    }

    revalidatePath('/dashboard/pos/orders')
    return {success: true}
}