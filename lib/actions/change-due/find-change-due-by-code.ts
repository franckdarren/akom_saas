// lib/actions/change-due/find-change-due-by-code.ts
'use server'

import prisma from '@/lib/prisma'
import {requireCashAccess} from '@/lib/auth/session'
import {normalizeChangeDueCode} from '@/lib/change-due/code'
import type {ActionResult} from '@/types/actions'
import type {ChangeDueLookup} from '@/types/change-due'

/**
 * Recherche une dette encore en cours par son code de retrait, pour
 * l'appliquer en déduction d'un achat au comptoir.
 *
 * Le filtre `restaurantId` est indispensable : sans lui, un code valide dans
 * une structure serait utilisable dans une autre.
 */
export async function findChangeDueByCode(
    rawCode: string,
): Promise<ActionResult<ChangeDueLookup>> {
    const {restaurantId} = await requireCashAccess()

    const code = normalizeChangeDueCode(rawCode)
    if (!code) {
        return {success: false, error: 'Saisissez un code de retrait'}
    }

    const changeDue = await prisma.changeDue.findUnique({
        where: {restaurantId_code: {restaurantId, code}},
        select: {
            id: true,
            code: true,
            amount: true,
            status: true,
            customerName: true,
            customerPhone: true,
            dueDate: true,
        },
    })

    if (!changeDue) {
        return {success: false, error: `Aucune monnaie due pour le code ${code}`}
    }

    if (changeDue.status === 'settled') {
        return {success: false, error: `Le code ${code} a déjà été utilisé`}
    }

    if (changeDue.status === 'cancelled') {
        return {success: false, error: `Le code ${code} a été annulé`}
    }

    return {
        success: true,
        data: {
            id: changeDue.id,
            code: changeDue.code,
            amount: changeDue.amount,
            customerName: changeDue.customerName,
            customerPhone: changeDue.customerPhone,
            dueDate: changeDue.dueDate.toISOString(),
        },
    }
}
