'use client'

// components/dashboard/stats/OrdersTab.tsx

import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'
import { PerformanceKpis } from './PerformanceKpis'
import type { OrderAnalytics, PerformanceAnalytics } from '@/types/stats'

const OrderSourceChart = dynamic(
    () => import('./OrderSourceChart').then((m) => ({ default: m.OrderSourceChart })),
    { ssr: false, loading: () => <Skeleton className="h-[280px] w-full rounded-xl" /> },
)

const FulfillmentTypeChart = dynamic(
    () => import('./FulfillmentTypeChart').then((m) => ({ default: m.FulfillmentTypeChart })),
    { ssr: false, loading: () => <Skeleton className="h-[280px] w-full rounded-xl" /> },
)

const PeakHoursChart = dynamic(
    () => import('./PeakHoursChart').then((m) => ({ default: m.PeakHoursChart })),
    { ssr: false, loading: () => <Skeleton className="h-[280px] w-full rounded-xl" /> },
)

const BusiestDaysChart = dynamic(
    () => import('./BusiestDaysChart').then((m) => ({ default: m.BusiestDaysChart })),
    { ssr: false, loading: () => <Skeleton className="h-[280px] w-full rounded-xl" /> },
)

interface OrdersTabProps {
    analytics: OrderAnalytics
    performance: PerformanceAnalytics | null
}

export function OrdersTab({ analytics, performance }: OrdersTabProps) {
    return (
        <div className="layout-sections">
            {/* Performance opérationnelle */}
            {performance && <PerformanceKpis performance={performance} />}

            {/* Canaux & types */}
            <div className="grid gap-6 md:grid-cols-2">
                <OrderSourceChart data={analytics.bySource} />
                <FulfillmentTypeChart data={analytics.byFulfillment} />
            </div>

            {/* Temporalité */}
            <div className="grid gap-6 md:grid-cols-2">
                <PeakHoursChart data={analytics.byHour} />
                <BusiestDaysChart data={analytics.byDayOfWeek} />
            </div>
        </div>
    )
}
