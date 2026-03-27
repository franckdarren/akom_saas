'use client'

import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'

type StatsPeriod = Array<{
    period: string
    ordersCount: number
    revenue: number
    avgOrderValue: number
}>

const StatsChart = dynamic(
    () => import('./StatsChart').then(m => ({ default: m.StatsChart })),
    { ssr: false, loading: () => <Skeleton className="h-64 w-full rounded-xl" /> }
)

const ExportStatsButton = dynamic(
    () => import('./ExportStatsButton').then(m => ({ default: m.ExportStatsButton })),
    { ssr: false }
)

interface SuperadminStatsChartsProps {
    data: StatsPeriod
}

export function SuperadminStatsCharts({ data }: SuperadminStatsChartsProps) {
    return <StatsChart data={data} />
}

export function SuperadminExportButton({ period }: { period: string }) {
    return <ExportStatsButton period={period} />
}
