// lib/actions/stats/order-analytics.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { getPeriodRange } from '@/lib/utils/period'
import type { TimePeriod, CustomPeriod, OrderAnalytics, HourlySales, DayOfWeekSales } from '@/types/stats'

// ============================================================
// Auth interne — même pattern que lib/actions/stats.ts
// ============================================================

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
// RÉPARTITION PAR CANAL (source)
// ============================================================

async function getOrdersBySource(
    restaurantId: string,
    startDate: Date,
    endDate: Date,
) {
    const rows = await prisma.order.groupBy({
        by: ['source'],
        where: {
            restaurantId,
            status: { notIn: ['cancelled'] },
            createdAt: { gte: startDate, lte: endDate },
        },
        _count: { id: true },
        _sum: { totalAmount: true },
    })

    return rows.map((r) => ({
        source: r.source as string,
        count: r._count.id,
        revenue: r._sum.totalAmount ?? 0,
    }))
}

// ============================================================
// RÉPARTITION PAR TYPE (sur place / emporter / livraison)
// ============================================================

async function getOrdersByFulfillment(
    restaurantId: string,
    startDate: Date,
    endDate: Date,
) {
    const rows = await prisma.order.groupBy({
        by: ['fulfillmentType'],
        where: {
            restaurantId,
            status: { notIn: ['cancelled'] },
            createdAt: { gte: startDate, lte: endDate },
        },
        _count: { id: true },
        _sum: { totalAmount: true },
    })

    return rows.map((r) => ({
        fulfillmentType: r.fulfillmentType as string | null,
        count: r._count.id,
        revenue: r._sum.totalAmount ?? 0,
    }))
}

// ============================================================
// RÉPARTITION PAR HEURE (0-23)
// ============================================================

async function getOrdersByHour(
    restaurantId: string,
    startDate: Date,
    endDate: Date,
): Promise<HourlySales[]> {
    type RawRow = { hour: number; orders: bigint | number; revenue: bigint | number }

    const rows = await prisma.$queryRaw<RawRow[]>`
        SELECT
            EXTRACT(HOUR FROM created_at AT TIME ZONE 'UTC')::int AS hour,
            COUNT(*)                                               AS orders,
            COALESCE(SUM(total_amount), 0)                        AS revenue
        FROM orders
        WHERE restaurant_id = ${restaurantId}::uuid
          AND status NOT IN ('cancelled')
          AND created_at >= ${startDate}
          AND created_at <= ${endDate}
        GROUP BY EXTRACT(HOUR FROM created_at AT TIME ZONE 'UTC')
        ORDER BY hour
    `

    // Remplir les heures manquantes avec 0
    const byHour = new Map<number, { orders: number; revenue: number }>(
        rows.map((r) => [
            Number(r.hour),
            { orders: Number(r.orders), revenue: Number(r.revenue) },
        ]),
    )

    return Array.from({ length: 24 }, (_, hour) => ({
        hour,
        orders: byHour.get(hour)?.orders ?? 0,
        revenue: byHour.get(hour)?.revenue ?? 0,
    }))
}

// ============================================================
// RÉPARTITION PAR JOUR DE SEMAINE (0=Dim, 6=Sam)
// ============================================================

async function getOrdersByDayOfWeek(
    restaurantId: string,
    startDate: Date,
    endDate: Date,
): Promise<DayOfWeekSales[]> {
    type RawRow = { dayOfWeek: number; orders: bigint | number; revenue: bigint | number }

    const rows = await prisma.$queryRaw<RawRow[]>`
        SELECT
            EXTRACT(DOW FROM created_at AT TIME ZONE 'UTC')::int AS "dayOfWeek",
            COUNT(*)                                              AS orders,
            COALESCE(SUM(total_amount), 0)                       AS revenue
        FROM orders
        WHERE restaurant_id = ${restaurantId}::uuid
          AND status NOT IN ('cancelled')
          AND created_at >= ${startDate}
          AND created_at <= ${endDate}
        GROUP BY EXTRACT(DOW FROM created_at AT TIME ZONE 'UTC')
        ORDER BY "dayOfWeek"
    `

    const byDay = new Map<number, { orders: number; revenue: number }>(
        rows.map((r) => [
            Number(r.dayOfWeek),
            { orders: Number(r.orders), revenue: Number(r.revenue) },
        ]),
    )

    return Array.from({ length: 7 }, (_, i) => ({
        dayOfWeek: i,
        orders: byDay.get(i)?.orders ?? 0,
        revenue: byDay.get(i)?.revenue ?? 0,
    }))
}

// ============================================================
// POINT D'ENTRÉE PUBLIC
// ============================================================

export async function getOrderAnalytics(
    period: TimePeriod,
    customPeriod?: CustomPeriod,
): Promise<OrderAnalytics> {
    const restaurantId = await getCurrentRestaurantId()
    const { startDate, endDate } = getPeriodRange(period, customPeriod)

    const [bySource, byFulfillment, byHour, byDayOfWeek] = await Promise.all([
        getOrdersBySource(restaurantId, startDate, endDate),
        getOrdersByFulfillment(restaurantId, startDate, endDate),
        getOrdersByHour(restaurantId, startDate, endDate),
        getOrdersByDayOfWeek(restaurantId, startDate, endDate),
    ])

    return { bySource, byFulfillment, byHour, byDayOfWeek }
}
