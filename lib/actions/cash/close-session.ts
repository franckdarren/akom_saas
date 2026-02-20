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

    const session = await prisma.cashSession.update({
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

    revalidatePath('/dashboard/caisse')
    return {success: true, session, balanceData}
}