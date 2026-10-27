// lib/actions/change-due/settle-change-due.ts
'use server'

import prisma from '@/lib/prisma'
import {requireCashAccess} from '@/lib/auth/session'
import {revalidatePath} from 'next/cache'
import {todayBusinessDate} from '@/lib/change-due/business-date'
import type {ActionResult} from '@/types/actions'

interface SettleChangeDueInput {
    changeDueId: string
    notes?: string
}

/**
 * Solde une dette en rendant la monnaie en espèces.
 *
 * La déduction sur un achat (`order_deduction`) n'est pas gérée ici : elle se
 * fait dans la transaction d'encaissement au comptoir, pour que la vente et le
 * règlement de la dette soient atomiques (voir
 * app/(dashboard)/dashboard/pos/_actions/create-pos-order.ts).
 */
export async function settleChangeDue(
    input: SettleChangeDueInput,
): Promise<ActionResult> {
    const {userId, restaurantId} = await requireCashAccess()

    // updateMany avec le statut dans le WHERE : la transition
    // outstanding → settled est donc atomique. Deux caissières qui soldent la
    // même dette en même temps ne peuvent pas la faire sortir deux fois du
    // tiroir — la seconde obtient count = 0.
    const result = await prisma.changeDue.updateMany({
        where: {
            id: input.changeDueId,
            restaurantId,
            status: 'outstanding',
        },
        data: {
            status: 'settled',
            settlementMethod: 'cash',
            settledDate: todayBusinessDate(),
            settledAt: new Date(),
            settledBy: userId,
            notes: input.notes?.trim() || undefined,
        },
    })

    if (result.count === 0) {
        // Soit la dette n'existe pas / appartient à une autre structure, soit
        // elle n'est plus en cours. On ne distingue pas les deux cas : révéler
        // l'existence d'une dette d'une autre structure serait une fuite.
        return {
            success: false,
            error: 'Cette monnaie due n\'est plus en cours — rechargez la page',
        }
    }

    revalidatePath('/dashboard/pos/monnaie-due')
    revalidatePath('/dashboard/caisse')
    return {success: true, message: 'Monnaie rendue au client'}
}
