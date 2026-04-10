// lib/actions/stats/performance-analytics.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { getPeriodRange } from '@/lib/utils/period'
import type { TimePeriod, CustomPeriod, PerformanceAnalytics } from '@/types/stats'

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
// DISTRIBUTION PAR STATUT
// ============================================================

async function getOrderStatusDistribution(restaurantId: string, startDate: Date, endDate: Date) {
    const rows = await prisma.order.groupBy({
        by: ['status'],
        where: {
            restaurantId,
            createdAt: { gte: startDate, lte: endDate },
        },
        _count: { id: true },
    })

    return rows.map((r) => ({
        status: r.status as string,
        count: r._count.id,
    }))
}

// ============================================================
// DÉLAI MOYEN DE TRAITEMENT (commandes livrées)
// ============================================================

async function getAvgFulfillmentTime(
    restaurantId: string,
    startDate: Date,
    endDate: Date,
): Promise<number | null> {
    type RawRow = { avg_minutes: number | null }

    const [row] = await prisma.$queryRaw<RawRow[]>`
        SELECT
            AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 60)::numeric(10, 1) AS avg_minutes
        FROM orders
        WHERE restaurant_id = ${restaurantId}::uuid
          AND status = 'delivered'
          AND created_at >= ${startDate}
          AND created_at <= ${endDate}
    `

    return row?.avg_minutes != null ? Number(row.avg_minutes) : null
}

// ============================================================
// POINT D'ENTRÉE PUBLIC
// ============================================================

export async function getPerformanceAnalytics(
    period: TimePeriod,
    customPeriod?: CustomPeriod,
): Promise<PerformanceAnalytics> {
    const restaurantId = await getCurrentRestaurantId()
    const { startDate, endDate, previousStartDate, previousEndDate } = getPeriodRange(period, customPeriod)

    const [byStatus, avgFulfillmentMinutes, previousByStatus] = await Promise.all([
        getOrderStatusDistribution(restaurantId, startDate, endDate),
        getAvgFulfillmentTime(restaurantId, startDate, endDate),
        getOrderStatusDistribution(restaurantId, previousStartDate, previousEndDate),
    ])

    const totalOrders = byStatus.reduce((s, r) => s + r.count, 0)
    const previousTotalOrders = previousByStatus.reduce((s, r) => s + r.count, 0)
    const cancelledCount = byStatus.find((r) => r.status === 'cancelled')?.count ?? 0
    const cancellationRate = totalOrders > 0
        ? Math.round((cancelledCount / totalOrders) * 100)
        : 0

    return {
        totalOrders,
        previousTotalOrders,
        cancelledCount,
        cancellationRate,
        avgFulfillmentMinutes,
        byStatus,
    }
}
