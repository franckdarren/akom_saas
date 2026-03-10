// lib/stats/financial-aggregates.ts

import prisma from '@/lib/prisma'
import {PaymentStatus} from '@prisma/client'

export interface FinancialPeriodStats {
    akomRevenue: number
    manualRevenue: number
    totalRevenue: number
    totalExpenses: number
    expensesByCategory: { category: string; total: number }[]
    netResult: number
    revenueByMethod: { method: string; total: number }[]
    sessionsCount: number
    sessionsWithGap: number
}

export async function getFinancialStats(
    restaurantId: string,
    startDate: Date,
    endDate: Date,
): Promise<FinancialPeriodStats> {

    // @db.Date stocke une date pure (ex: "2026-03-02") sans fuseau.
    // new Date('2026-03-02') est garanti UTC minuit par la spec JS.
    // new Date(2026, 2, 2) utilise l'heure locale → décalage possible → à éviter.
    const startISO = startDate.toISOString().slice(0, 10) // "2026-03-02"
    const endISO = endDate.toISOString().slice(0, 10)     // "2026-03-02"

    const dateStart = new Date(startISO)                        // 2026-03-02T00:00:00.000Z
    const dateEnd = new Date(endISO + 'T23:59:59.999Z')         // 2026-03-02T23:59:59.999Z

    const [
        akomPayments,
        manualRevenues,
        expenses,
        sessions,
    ] = await Promise.all([

        // Paiements POS — timestamp, pas de date pure, on garde startDate/endDate
        prisma.payment.groupBy({
            by: ['method'],
            where: {
                restaurantId,
                status: PaymentStatus.paid,
                createdAt: {gte: startDate, lte: endDate},
            },
            _sum: {amount: true},
        }),

        // Recettes manuelles — revenueDate est @db.Date, on utilise les dates UTC normalisées
        prisma.manualRevenue.aggregate({
            where: {
                restaurantId,
                revenueDate: {gte: dateStart, lte: dateEnd},
            },
            _sum: {totalAmount: true},
        }),

        // Dépenses — même logique que manualRevenue
        prisma.expense.groupBy({
            by: ['category'],
            where: {
                restaurantId,
                expenseDate: {gte: dateStart, lte: dateEnd},
            },
            _sum: {amount: true},
        }),

        // Sessions — sessionDate est aussi @db.Date
        prisma.cashSession.findMany({
            where: {
                restaurantId,
                sessionDate: {gte: dateStart, lte: dateEnd},
            },
            select: {
                status: true,
                balanceDifference: true,
            },
        }),
    ])

    const akomRevenue = akomPayments.reduce(
        (s: number, p: typeof akomPayments[number]) => s + (p._sum?.amount ?? 0), 0
    )
    const manualRev = manualRevenues._sum.totalAmount ?? 0
    const totalRevenue = akomRevenue + manualRev
    const totalExpenses = expenses.reduce(
        (s: number, e: typeof expenses[number]) => s + (e._sum?.amount ?? 0), 0
    )

    return {
        akomRevenue,
        manualRevenue: manualRev,
        totalRevenue,
        totalExpenses,
        expensesByCategory: expenses.map((e: typeof expenses[number]) => ({
            category: e.category,
            total: e._sum?.amount ?? 0,
        })),
        netResult: totalRevenue - totalExpenses,
        revenueByMethod: akomPayments.map((p: typeof akomPayments[number]) => ({
            method: p.method,
            total: p._sum?.amount ?? 0,
        })),
        sessionsCount: sessions.length,
        // sessionsWithGap : uniquement les sessions clôturées avec écart > 500 FCFA
        sessionsWithGap: sessions.filter(
            (s: typeof sessions[number]) =>
                s.status === 'closed' &&
                s.balanceDifference !== null &&
                Math.abs(s.balanceDifference) > 500
        ).length,
    }
}