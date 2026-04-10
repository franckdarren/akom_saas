'use client'

// components/dashboard/stats/BusiestDaysChart.tsx

import { AppCard, CardContent, CardHeader, CardTitle } from '@/components/ui/app-card'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { DAY_OF_WEEK_LABELS } from '@/lib/utils/stats-labels'
import type { DayOfWeekSales } from '@/types/stats'

interface BusiestDaysChartProps {
    data: DayOfWeekSales[]
}

// Réordonner pour commencer lundi (1) → dimanche (0)
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]

export function BusiestDaysChart({ data }: BusiestDaysChartProps) {
    const hasData = data.some((d) => d.orders > 0)

    const byDay = new Map(data.map((d) => [d.dayOfWeek, d]))

    const chartData = DAY_ORDER.map((dow) => {
        const d = byDay.get(dow)
        return {
            label: DAY_OF_WEEK_LABELS[dow] ?? String(dow),
            orders: d?.orders ?? 0,
            revenue: d?.revenue ?? 0,
        }
    })

    return (
        <AppCard>
            <CardHeader>
                <CardTitle className="type-card-title">Jours les plus actifs</CardTitle>
            </CardHeader>
            <CardContent>
                {!hasData ? (
                    <div className="layout-empty-state">
                        <p className="type-body-muted">Aucune commande sur la période</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={chartData} barCategoryGap="30%">
                            <XAxis
                                dataKey="label"
                                tick={{ fontSize: 12 }}
                                stroke="var(--muted-foreground)"
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                allowDecimals={false}
                                tick={{ fontSize: 11 }}
                                stroke="var(--muted-foreground)"
                                tickLine={false}
                                axisLine={false}
                                width={24}
                            />
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (!active || !payload?.length) return null
                                    return (
                                        <div className="rounded-lg border bg-card p-3 shadow-sm">
                                            <p className="type-body font-medium">{payload[0].payload.label}</p>
                                            <p className="mt-1 type-caption text-muted-foreground">
                                                {payload[0].value as number} commande{(payload[0].value as number) > 1 ? 's' : ''}
                                            </p>
                                        </div>
                                    )
                                }}
                            />
                            <Bar
                                dataKey="orders"
                                fill="var(--chart-2)"
                                radius={[3, 3, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </AppCard>
    )
}
