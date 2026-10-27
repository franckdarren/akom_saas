// lib/actions/change-due/get-change-due-totals.ts
'use server'

import {requireCashAccess} from '@/lib/auth/session'
import {getChangeDueTotals as aggregate, type ChangeDueTotals} from '@/lib/change-due/totals'
import type {ActionResult} from '@/types/actions'

/**
 * Totaux de monnaie due pour une date de session (format 'YYYY-MM-DD').
 * Utilisé par la clôture de caisse pour signaler la part du tiroir qui
 * n'appartient pas au commerce.
 */
export async function getChangeDueTotals(
    sessionDate: string,
): Promise<ActionResult<ChangeDueTotals>> {
    const {restaurantId} = await requireCashAccess()

    // Même convention de date que le module caisse : minuit UTC.
    const date = new Date(sessionDate.split('T')[0])
    if (Number.isNaN(date.getTime())) {
        return {success: false, error: 'Date de session invalide'}
    }

    return {success: true, data: await aggregate(restaurantId, date)}
}
