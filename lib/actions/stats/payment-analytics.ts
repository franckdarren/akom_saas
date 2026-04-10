// lib/actions/stats/payment-analytics.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { getPeriodRange } from '@/lib/utils/period'
import type { TimePeriod, CustomPeriod, PaymentAnalytics } from '@/types/stats'

async function getCurrentRestaurantId(): Promise<string> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Non authentifié')

    const restaurantUser = await prisma.restaurantUser.findFirst({
        where: { userId: user.id },
        select: { restaurantId: true },
    })
    if (!restaurantUser) throw new Error('Aucun restaurant trouvé')

    return restaurantUser.restaurantId
}

// ============================================================
// RÉPARTITION PAR STATUT
// ============================================================

async function getPaymentsByStatus(restaurantId: string, startDate: Date, endDate: Date) {
    const rows = await prisma.payment.groupBy({
        by: ['status'],
        where: {
            restaurantId,
            createdAt: { gte: startDate, lte: endDate },
        },
        _count: { id: true },
        _sum: { amount: true },
    })

    return rows.map((r) => ({
        status: r.status as string,
        count: r._count.id,
        amount: r._sum.amount ?? 0,
    }))
}

// ============================================================
// TAUX DE SUCCÈS PAR MÉTHODE
// ============================================================

async function getPaymentSuccessByMethod(restaurantId: string, startDate: Date, endDate: Date) {
    type RawRow = {
        method: string
        paid_count: bigint | number
        failed_count: bigint | number
        total_count: bigint | number
    }

    const rows = await prisma.$queryRaw<RawRow[]>`
        SELECT
            method,
            COUNT(*) FILTER (WHERE status = 'paid')   AS paid_count,
            COUNT(*) FILTER (WHERE status = 'failed')  AS failed_count,
            COUNT(*)                                   AS total_count
        FROM payments
        WHERE restaurant_id = ${restaurantId}::uuid
          AND created_at >= ${startDate}
          AND created_at <= ${endDate}
          AND status IN ('paid', 'failed')
        GROUP BY method
        ORDER BY total_count DESC
    `

    return rows.map((r) => {
        const paidCount = Number(r.paid_count)
        const failedCount = Number(r.failed_count)
        const totalCount = Number(r.total_count)
        const successRate = totalCount > 0 ? Math.round((paidCount / totalCount) * 100) : 0
        return {
            method: r.method,
            paidCount,
            failedCount,
            totalCount,
            successRate,
        }
    })
}

// ============================================================
// POINT D'ENTRÉE PUBLIC
// ============================================================

export async function getPaymentAnalytics(
    period: TimePeriod,
    customPeriod?: CustomPeriod,
): Promise<PaymentAnalytics> {
    const restaurantId = await getCurrentRestaurantId()
    const { startDate, endDate, previousStartDate, previousEndDate } = getPeriodRange(period, customPeriod)

    const [byStatus, byMethod, previousByStatus] = await Promise.all([
        getPaymentsByStatus(restaurantId, startDate, endDate),
        getPaymentSuccessByMethod(restaurantId, startDate, endDate),
        getPaymentsByStatus(restaurantId, previousStartDate, previousEndDate),
    ])

    const totalPayments = byStatus.reduce((s, r) => s + r.count, 0)
    const previousTotalPayments = previousByStatus.reduce((s, r) => s + r.count, 0)
    const paidCount = byStatus.find((r) => r.status === 'paid')?.count ?? 0
    const overallSuccessRate = totalPayments > 0
        ? Math.round((paidCount / totalPayments) * 100)
        : 0

    return { totalPayments, previousTotalPayments, overallSuccessRate, byStatus, byMethod }
}
