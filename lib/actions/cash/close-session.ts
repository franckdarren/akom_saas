// lib/actions/cash/close-session.ts
'use server'

import prisma from '@/lib/prisma'
import {getCurrentUserAndRestaurant} from '@/lib/auth/session'
import {getSessionBalance} from './get-session-balance'
import {revalidatePath} from 'next/cache'

interface CloseSessionInput {
    sessionId: string
    closingBalance: number
    notes?: string
}

export async function closeCashSession(input: CloseSessionInput) {
    const {userId, restaurantId} = await getCurrentUserAndRestaurant()
    if (!userId || !restaurantId) throw new Error('Non autorisé')

    const balanceData = await getSessionBalance(input.sessionId, restaurantId)

    // On sépare update et findFirst car prisma.update ne supporte pas include
    // sur les relations qui ne sont pas des clés étrangères directes.
    await prisma.cashSession.update({
        where: {id: input.sessionId},
        data: {
            status: 'closed',
            closingBalance: input.closingBalance,
            theoreticalBalance: balanceData.balance.theoretical,
            balanceDifference: input.closingBalance - balanceData.balance.theoretical,
            closedAt: new Date(),
            closedBy: userId,
            notes: input.notes,
        },
    })

    // Recharge avec les relations complètes pour que SessionSummary
    // ait accès à manualRevenues et expenses sans crash.
    const session = await prisma.cashSession.findFirst({
        where: {id: input.sessionId},
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

    if (!session) throw new Error('Session introuvable après clôture')

    revalidatePath('/dashboard/caisse')
    return {success: true, session, balanceData}
}