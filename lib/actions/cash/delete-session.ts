// lib/actions/cash/delete-session.ts
'use server'

import prisma from '@/lib/prisma'
import {getCurrentUserAndRestaurant} from '@/lib/auth/session'
import {revalidatePath} from 'next/cache'

export async function deleteCashSession(sessionId: string) {
    const {userId, restaurantId} = await getCurrentUserAndRestaurant()
    if (!userId || !restaurantId) throw new Error('Non autorisé')

    const session = await prisma.cashSession.findFirst({
        where: {
            id: sessionId,
            restaurantId,
            status: 'open',
        },
        include: {
            manualRevenues: {
                where: {stockMovementId: {not: null}},
                include: {stockMovement: true},
            },
            expenses: {
                where: {stockMovementId: {not: null}},
                include: {stockMovement: true},
            },
        },
    })

    if (!session) {
        throw new Error('Session introuvable ou déjà clôturée — suppression impossible')
    }

    await prisma.$transaction(async (tx) => {

        // ── ÉTAPE 1 : Calcul du delta net par produit ──
        // On additionne tous les mouvements de stock du même produit
        // pour obtenir le delta total à annuler en une seule opération.
        const stockDeltas = new Map<string, number>()

        for (const revenue of session.manualRevenues) {
            if (!revenue.stockMovement) continue
            const {productId, quantity} = revenue.stockMovement
            // quantity est négatif (sortie stock) → on inverse pour restaurer
            stockDeltas.set(productId, (stockDeltas.get(productId) ?? 0) - quantity)
        }

        for (const expense of session.expenses) {
            if (!expense.stockMovement) continue
            const {productId, quantity} = expense.stockMovement
            // quantity est positif (entrée stock) → on inverse pour restaurer
            stockDeltas.set(productId, (stockDeltas.get(productId) ?? 0) - quantity)
        }

        // ── ÉTAPE 2 : Application des deltas de stock ──
        for (const [productId, delta] of stockDeltas.entries()) {
            await tx.stock.updateMany({
                where: {productId, restaurantId},
                data: {quantity: {increment: delta}},
            })
        }

        // ── ÉTAPE 3 : Détacher et supprimer les StockMovements ──
        const movementIds = [
            ...session.manualRevenues
                .map(r => r.stockMovementId)
                .filter((id): id is string => id !== null),
            ...session.expenses
                .map(e => e.stockMovementId)
                .filter((id): id is string => id !== null),
        ]

        if (movementIds.length > 0) {
            await tx.manualRevenue.updateMany({
                where: {sessionId, stockMovementId: {in: movementIds}},
                data: {stockMovementId: null},
            })
            await tx.expense.updateMany({
                where: {sessionId, stockMovementId: {in: movementIds}},
                data: {stockMovementId: null},
            })
            await tx.stockMovement.deleteMany({
                where: {id: {in: movementIds}},
            })
        }

        // ── ÉTAPE 4 : Suppression de la session (cascade revenues + expenses) ──
        await tx.cashSession.delete({
            where: {id: sessionId},
        })
    })

    revalidatePath('/dashboard/caisse')
    return {success: true}
}