'use client'

// components/dashboard/stats/PeakHoursChart.tsx

import { AppCard, CardContent, CardHeader, CardTitle } from '@/components/ui/app-card'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { HourlySales } from '@/types/stats'

interface PeakHoursChartProps {
    data: HourlySales[]
}

export function PeakHoursChart({ data }: PeakHoursChartProps) {
    const hasData = data.some((d) => d.orders > 0)

    const chartData = data.map((d) => ({
        label: `${String(d.hour).padStart(2, '0')}h`,
        orders: d.orders,
        revenue: d.revenue,
    }))

    return (
        <AppCard>
            <CardHeader>
                <CardTitle className="type-card-title">Heures de pointe</CardTitle>
            </CardHeader>
            <CardContent>
                {!hasData ? (
                    <div className="layout-empty-state">
                        <p className="type-body-muted">Aucune commande sur la période</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={chartData} barCategoryGap="20%">
                            <XAxis
                                dataKey="label"
                                tick={{ fontSize: 11 }}
                                stroke="var(--muted-foreground)"
                                tickLine={false}
                                axisLine={false}
                                interval={2}
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
                                fill="var(--chart-1)"
                                radius={[3, 3, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </AppCard>
    )
}
