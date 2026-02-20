// lib/actions/cash/get-session.ts
'use server'

import prisma from '@/lib/prisma'
import {getCurrentUserAndRestaurant} from '@/lib/auth/session'

export async function getCashSession(sessionId: string) {
    const {userId, restaurantId} = await getCurrentUserAndRestaurant()
    if (!userId || !restaurantId) throw new Error('Non autorisé')

    const session = await prisma.cashSession.findFirst({
        where: {
            id: sessionId,
            restaurantId, // RLS applicatif : on s'assure que la session
                          // appartient bien au restaurant de l'utilisateur
        },
        include: {
            manualRevenues: {
                orderBy: {createdAt: 'desc'},
                include: {product: {select: {name: true}}},
            },
            expenses: {
                orderBy: {createdAt: 'desc'},
                include: {product: {select: {name: true}}},
            },
        },
    })

    if (!session) throw new Error('Session introuvable')

    return session
}