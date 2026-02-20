// lib/actions/cash/get-session-balance.ts
'use server'

import prisma from '@/lib/prisma'

// Cette fonction est le cœur du module caisse.
// Elle agrège les trois sources financières et retourne
// une balance complète, décomposée par mode de paiement.
export async function getSessionBalance(
    sessionId: string,
    restaurantId: string,
) {
    const session = await prisma.cashSession.findFirst({
        where: {id: sessionId, restaurantId},
    })
    if (!session) throw new Error('Session introuvable')

    // SOURCE 1 : Recettes manuelles — groupées par mode de paiement
    const manualRevsByMethod = await prisma.manualRevenue.groupBy({
        by: ['paymentMethod'],
        where: {sessionId, restaurantId},
        _sum: {totalAmount: true},
    })

    // SOURCE 2 : Paiements Akôm du même jour.
    // On filtre par la date de session (début et fin de journée)
    // pour capturer automatiquement les commandes passées via l'app.
    const dayStart = new Date(session.sessionDate)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(session.sessionDate)
    dayEnd.setHours(23, 59, 59, 999)

    const akomPaymentsByMethod = await prisma.payment.groupBy({
        by: ['method'],
        where: {
            restaurantId,
            status: 'paid',
            createdAt: {gte: dayStart, lte: dayEnd},
        },
        _sum: {amount: true},
    })

    // SOURCE 3 : Dépenses — groupées par mode de paiement et par catégorie
    const expensesByMethod = await prisma.expense.groupBy({
        by: ['paymentMethod'],
        where: {sessionId, restaurantId},
        _sum: {amount: true},
    })

    const expensesByCategory = await prisma.expense.groupBy({
        by: ['category'],
        where: {sessionId, restaurantId},
        _sum: {amount: true},
    })

    // CALCUL DES TOTAUX
    const totalManual = manualRevsByMethod.reduce(
        (s, r) => s + (r._sum.totalAmount ?? 0), 0
    )
    const totalAkom = akomPaymentsByMethod.reduce(
        (s, p) => s + (p._sum.amount ?? 0), 0
    )
    const totalRevenue = totalManual + totalAkom
    const totalExpenses = expensesByMethod.reduce(
        (s, e) => s + (e._sum.amount ?? 0), 0
    )

    // BALANCE CASH (argent physique dans le tiroir)
    // On exclut les paiements mobile money qui n'entrent pas dans le tiroir.
    const cashMethods = ['cash']

    const cashIn = [
        ...manualRevsByMethod
            .filter(r => cashMethods.includes(r.paymentMethod))
            .map(r => r._sum.totalAmount ?? 0),
        ...akomPaymentsByMethod
            .filter(p => cashMethods.includes(p.method))
            .map(p => p._sum.amount ?? 0),
    ].reduce((s, v) => s + v, 0)

    const cashOut = expensesByMethod
        .filter(e => cashMethods.includes(e.paymentMethod))
        .reduce((s, e) => s + (e._sum.amount ?? 0), 0)

    const theoreticalBalance = session.openingBalance + totalRevenue - totalExpenses
    const theoreticalCashBalance = session.openingBalance + cashIn - cashOut

    return {
        session,
        revenues: {
            manual: totalManual,
            akom: totalAkom,
            total: totalRevenue,
            byMethod: manualRevsByMethod,
        },
        expenses: {
            total: totalExpenses,
            byMethod: expensesByMethod,
            byCategory: expensesByCategory,
        },
        balance: {
            opening: session.openingBalance,
            theoretical: theoreticalBalance,
            theoreticalCash: theoreticalCashBalance,
            actual: session.closingBalance ?? null,
            difference: session.closingBalance != null
                ? session.closingBalance - theoreticalBalance
                : null,
        },
    }
}