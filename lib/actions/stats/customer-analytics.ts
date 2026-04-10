// lib/actions/stats/customer-analytics.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { getPeriodRange } from '@/lib/utils/period'
import type { TimePeriod, CustomPeriod, CustomerAnalytics, CustomerStat } from '@/types/stats'

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
// POINT D'ENTRÉE PUBLIC
// ============================================================

export async function getCustomerAnalytics(
    period: TimePeriod,
    customPeriod?: CustomPeriod,
): Promise<CustomerAnalytics> {
    const restaurantId = await getCurrentRestaurantId()
    const { startDate, endDate, previousStartDate, previousEndDate } = getPeriodRange(period, customPeriod)

    // Toutes les commandes non annulées de la période (on inclut toutes sources)
    const [ordersInPeriod, previousPhoneGroups] = await Promise.all([
        prisma.order.findMany({
            where: {
                restaurantId,
                createdAt: { gte: startDate, lte: endDate },
                status: { not: 'cancelled' },
            },
            select: {
                customerPhone: true,
                customerName: true,
                totalAmount: true,
                createdAt: true,
            },
        }),
        // Clients identifiés (unique par phone) sur la période précédente — pour N-1
        prisma.order.groupBy({
            by: ['customerPhone'],
            where: {
                restaurantId,
                createdAt: { gte: previousStartDate, lte: previousEndDate },
                status: { not: 'cancelled' },
                NOT: { customerPhone: null },
            },
        }),
    ])

    // ——— Segmentation des commandes ———
    // Regrouper par phone (identifiant fiable) ; les commandes sans phone → anonymes
    const phoneMap = new Map<string, { name: string | null; ordersCount: number; totalRevenue: number }>()
    let anonymousOrders = 0

    for (const order of ordersInPeriod) {
        if (order.customerPhone) {
            const existing = phoneMap.get(order.customerPhone)
            if (existing) {
                existing.ordersCount += 1
                existing.totalRevenue += order.totalAmount
            } else {
                phoneMap.set(order.customerPhone, {
                    name: order.customerName,
                    ordersCount: 1,
                    totalRevenue: order.totalAmount,
                })
            }
        } else {
            anonymousOrders += 1
        }
    }

    const identifiedCustomers = phoneMap.size

    // ——— New vs returning ———
    // Un client est "récurrent" si son phone apparaît dans des commandes antérieures à la période
    const phonesInPeriod = Array.from(phoneMap.keys())

    let returningPhoneSet = new Set<string>()
    if (phonesInPeriod.length > 0) {
        const priorOrders = await prisma.order.findMany({
            where: {
                restaurantId,
                customerPhone: { in: phonesInPeriod },
                createdAt: { lt: startDate },
                status: { not: 'cancelled' },
            },
            select: { customerPhone: true },
            distinct: ['customerPhone'],
        })
        returningPhoneSet = new Set(priorOrders.map((o) => o.customerPhone!))
    }

    const returningCustomers = returningPhoneSet.size
    const newCustomers = identifiedCustomers - returningCustomers

    // ——— Moyenne de commandes par client identifié ———
    const totalOrdersIdentified = Array.from(phoneMap.values()).reduce(
        (sum, c) => sum + c.ordersCount,
        0,
    )
    const avgOrdersPerCustomer =
        identifiedCustomers > 0
            ? Math.round((totalOrdersIdentified / identifiedCustomers) * 10) / 10
            : 0

    // ——— Top 10 clients par CA ———
    const topCustomers: CustomerStat[] = Array.from(phoneMap.entries())
        .map(([phone, data]) => ({
            phone,
            name: data.name,
            ordersCount: data.ordersCount,
            totalRevenue: data.totalRevenue,
            isReturning: returningPhoneSet.has(phone),
        }))
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, 10)

    return {
        identifiedCustomers,
        newCustomers,
        returningCustomers,
        anonymousOrders,
        avgOrdersPerCustomer,
        topCustomers,
        previousIdentifiedCustomers: previousPhoneGroups.length,
    }
}
