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

    const [
        akomPayments,
        manualRevenues,
        expenses,
        sessions,
    ] = await Promise.all([

        // Erreur 1 corrigée : on utilise l'enum Prisma PaymentStatus.completed
        // au lieu de la string littérale 'completed' que TypeScript refuse.
        prisma.payment.groupBy({
            by: ['method'],
            where: {
                restaurantId,
                status: PaymentStatus.paid,
                createdAt: {gte: startDate, lte: endDate},
            },
            _sum: {amount: true},
        }),

        prisma.manualRevenue.aggregate({
            where: {
                restaurantId,
                createdAt: {gte: startDate, lte: endDate},
            },
            _sum: {totalAmount: true},
        }),

        prisma.expense.groupBy({
            by: ['category'],
            where: {
                restaurantId,
                createdAt: {gte: startDate, lte: endDate},
            },
            _sum: {amount: true},
        }),

        prisma.cashSession.findMany({
            where: {
                restaurantId,
                sessionDate: {gte: startDate, lte: endDate},
                status: 'closed',
            },
            select: {balanceDifference: true},
        }),
    ])

    const akomRevenue = akomPayments.reduce(
        // Erreurs 2 et 3 corrigées : _sum peut être undefined selon Prisma,
        // on ajoute une vérification explicite avant d'accéder à .amount
        (s, p) => s + (p._sum?.amount ?? 0), 0
    )

    const manualRev = manualRevenues._sum.totalAmount ?? 0
    const totalRevenue = akomRevenue + manualRev

    const totalExpenses = expenses.reduce(
        (s, e) => s + (e._sum?.amount ?? 0), 0
    )

    const revenueByMethod = akomPayments.map(p => ({
        method: p.method,
        total: p._sum?.amount ?? 0,
    }))

    const expensesByCategory = expenses.map(e => ({
        category: e.category,
        total: e._sum?.amount ?? 0,
    }))

    return {
        akomRevenue,
        manualRevenue: manualRev,
        totalRevenue,
        totalExpenses,
        expensesByCategory,
        netResult: totalRevenue - totalExpenses,
        revenueByMethod,
        sessionsCount: sessions.length,
        sessionsWithGap: sessions.filter(
            s => Math.abs(s.balanceDifference ?? 0) > 500
        ).length,
    }
}