// lib/actions/change-due/cancel-change-due.ts
'use server'

import prisma from '@/lib/prisma'
import {requireCashAccess} from '@/lib/auth/session'
import {revalidatePath} from 'next/cache'
import type {ActionResult} from '@/types/actions'

interface CancelChangeDueInput {
    changeDueId: string
    reason: string
}

/**
 * Abandonne une dette : le client ne reviendra jamais chercher sa monnaie.
 *
 * Réservé à l'admin. Une caissière pourrait sinon encaisser une monnaie due,
 * garder l'argent, puis annuler la dette pour effacer la trace.
 *
 * Aucun impact sur la balance de caisse : l'argent est déjà dans le tiroir et
 * y reste. Seul le passif envers les clients diminue.
 */
export async function cancelChangeDue(
    input: CancelChangeDueInput,
): Promise<ActionResult> {
    const {userId, restaurantId} = await requireCashAccess()

    // Même lecture du rôle que requireCashAccess (lib/auth/session.ts) :
    // le slug du rôle personnalisé prime sur le rôle système hérité.
    const member = await prisma.restaurantUser.findUnique({
        where: {userId_restaurantId: {userId, restaurantId}},
        select: {role: true, customRole: {select: {slug: true}}},
    })
    const slug = member?.customRole?.slug ?? member?.role ?? null

    if (slug !== 'admin') {
        return {
            success: false,
            error: 'Seul un administrateur peut annuler une monnaie due',
        }
    }

    const reason = input.reason.trim()
    if (!reason) {
        return {success: false, error: 'Le motif d\'annulation est obligatoire'}
    }

    // Statut dans le WHERE : transition atomique depuis `outstanding` seulement.
    const result = await prisma.changeDue.updateMany({
        where: {
            id: input.changeDueId,
            restaurantId,
            status: 'outstanding',
        },
        data: {
            status: 'cancelled',
            cancelReason: reason,
            settledAt: new Date(),
            settledBy: userId,
        },
    })

    if (result.count === 0) {
        return {
            success: false,
            error: 'Cette monnaie due n\'est plus en cours — rechargez la page',
        }
    }

    revalidatePath('/dashboard/pos/monnaie-due')
    revalidatePath('/dashboard/caisse')
    return {success: true, message: 'Monnaie due annulée'}
}
