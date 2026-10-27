// lib/actions/change-due/list-change-dues.ts
'use server'

import prisma from '@/lib/prisma'
import {requireCashAccess} from '@/lib/auth/session'
import {supabaseAdmin} from '@/lib/supabase/admin'
import {normalizeChangeDueCode} from '@/lib/change-due/code'
import type {ActionResult} from '@/types/actions'
import type {ChangeDueListResult, ChangeDueRow, ChangeDueStatus} from '@/types/change-due'

interface ListChangeDuesInput {
    status?: ChangeDueStatus
    /** Recherche libre : code de retrait, téléphone ou nom du client. */
    search?: string
}

export async function listChangeDues(
    input: ListChangeDuesInput = {},
): Promise<ActionResult<ChangeDueListResult>> {
    const {restaurantId} = await requireCashAccess()

    const search = input.search?.trim()

    const rows = await prisma.changeDue.findMany({
        where: {
            restaurantId,
            ...(input.status ? {status: input.status} : {}),
            ...(search
                ? {
                    OR: [
                        // Le code est stocké en majuscules : on normalise la saisie
                        // plutôt que d'utiliser un `contains` insensible à la casse,
                        // pour profiter de l'index unique (restaurant_id, code).
                        {code: normalizeChangeDueCode(search)},
                        {customerPhone: {contains: search, mode: 'insensitive'}},
                        {customerName: {contains: search, mode: 'insensitive'}},
                    ],
                }
                : {}),
        },
        orderBy: [{status: 'asc'}, {dueDate: 'desc'}, {createdAt: 'desc'}],
        include: {
            order: {select: {orderNumber: true}},
            settledOrder: {select: {orderNumber: true}},
        },
        take: 200,
    })

    // Total dû : calculé sur l'ensemble des dettes en cours de la structure,
    // indépendamment des filtres d'affichage — c'est un indicateur de passif,
    // pas un total de la liste visible.
    const outstanding = await prisma.changeDue.aggregate({
        where: {restaurantId, status: 'outstanding'},
        _sum: {amount: true},
        _count: {_all: true},
    })

    // Résolution des emails des opérateurs en un seul appel batch,
    // même pattern que lib/actions/stats/cash-analytics.ts.
    const userIds = new Set<string>()
    for (const row of rows) {
        userIds.add(row.createdBy)
        if (row.settledBy) userIds.add(row.settledBy)
    }

    const emailMap = new Map<string, string>()
    if (userIds.size > 0) {
        const {data: usersData} = await supabaseAdmin.auth.admin.listUsers()
        for (const user of usersData?.users ?? []) {
            if (user.email) emailMap.set(user.id, user.email)
        }
    }

    const serialized: ChangeDueRow[] = rows.map((row) => ({
        id: row.id,
        code: row.code,
        amount: row.amount,
        status: row.status,
        customerName: row.customerName,
        customerPhone: row.customerPhone,
        dueDate: row.dueDate.toISOString(),
        createdAt: row.createdAt.toISOString(),
        settlementMethod: row.settlementMethod,
        settledDate: row.settledDate?.toISOString() ?? null,
        settledAt: row.settledAt?.toISOString() ?? null,
        cancelReason: row.cancelReason,
        notes: row.notes,
        orderNumber: row.order?.orderNumber ?? null,
        settledOrderNumber: row.settledOrder?.orderNumber ?? null,
        createdByEmail: emailMap.get(row.createdBy) ?? null,
        settledByEmail: row.settledBy ? emailMap.get(row.settledBy) ?? null : null,
    }))

    return {
        success: true,
        data: {
            rows: serialized,
            outstandingTotal: outstanding._sum.amount ?? 0,
            outstandingCount: outstanding._count._all,
        },
    }
}
