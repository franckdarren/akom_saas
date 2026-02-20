// lib/actions/cash/open-session.ts
'use server'

import prisma from '@/lib/prisma'
import {getCurrentUserAndRestaurant} from '@/lib/auth/session'
import {revalidatePath} from 'next/cache'

interface OpenSessionInput {
    sessionDate: string
    openingBalance: number
    notes?: string
}

export async function openCashSession(input: OpenSessionInput) {
    const {userId, restaurantId} = await getCurrentUserAndRestaurant()
    if (!userId || !restaurantId) throw new Error('Non autorisé')

    const today = new Date().toISOString().split('T')[0]
    const isHistorical = input.sessionDate < today

    // On crée la session, puis on la recharge immédiatement avec ses relations.
    // On ne peut pas faire create + include en une seule opération et obtenir
    // des tableaux vides garantis — donc on crée d'abord, puis on findFirst.
    // Cela garantit que la session retournée a toujours manualRevenues: []
    // et expenses: [] même si la session vient d'être créée à l'instant.
    await prisma.cashSession.create({
        data: {
            restaurantId,
            sessionDate: new Date(input.sessionDate),
            openingBalance: input.openingBalance,
            openedBy: userId,
            isHistorical,
            notes: input.notes,
        },
    })

    // On recharge avec les relations pour avoir un objet complet et cohérent
    const session = await prisma.cashSession.findFirst({
        where: {
            restaurantId,
            sessionDate: new Date(input.sessionDate),
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

    if (!session) throw new Error('Erreur lors de la création de la session')

    revalidatePath('/dashboard/caisse')
    return {success: true, session}
}