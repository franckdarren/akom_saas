'use client'

// components/dashboard/stats/OrderSourceChart.tsx

import { AppCard, CardContent, CardHeader, CardTitle } from '@/components/ui/app-card'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { ORDER_SOURCE_LABELS } from '@/lib/utils/stats-labels'
import type { OrdersBySource } from '@/types/stats'

interface OrderSourceChartProps {
    data: OrdersBySource[]
}

const CHART_COLORS = Array.from({ length: 5 }, (_, i) => `var(--chart-${i + 1})`)

export function OrderSourceChart({ data }: OrderSourceChartProps) {
    const chartData = data
        .filter((d) => d.count > 0)
        .map((d) => ({
            name: ORDER_SOURCE_LABELS[d.source] ?? d.source,
            value: d.count,
            revenue: d.revenue,
        }))

    const total = chartData.reduce((s, d) => s + d.value, 0)

    return (
        <AppCard>
            <CardHeader>
                <CardTitle className="type-card-title">Canaux de commande</CardTitle>
            </CardHeader>
            <CardContent>
                {chartData.length === 0 ? (
                    <div className="layout-empty-state">
                        <p className="type-body-muted">Aucune commande sur la période</p>
                    </div>
                ) : (
                    <div className="flex items-center gap-6">
                        <ResponsiveContainer width="50%" height={200}>
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={55}
                                    outerRadius={75}
                                    paddingAngle={2}
                                    dataKey="value"
                                >
                                    {chartData.map((_, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={CHART_COLORS[index % CHART_COLORS.length]}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    content={({ active, payload }) => {
                                        if (!active || !payload?.length) return null
                                        const pct = total > 0
                                            ? Math.round((payload[0].value as number / total) * 100)
                                            : 0
                                        return (
                                            <div className="rounded-lg border bg-card p-3 shadow-sm">
                                                <p className="type-body font-medium">{payload[0].payload.name}</p>
                                                <p className="mt-1 type-caption text-muted-foreground">
                                                    {payload[0].value as number} commande{(payload[0].value as number) > 1 ? 's' : ''}
                                                </p>
                                                <p className="type-caption text-muted-foreground">{pct}% du total</p>
                                            </div>
                                        )
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>

                        <div className="flex-1 space-y-2">
                            {chartData.map((item, index) => {
                                const pct = total > 0 ? Math.round((item.value / total) * 100) : 0
                                return (
                                    <div key={item.name} className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div
                                                className="h-3 w-3 shrink-0 rounded-sm"
                                                style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                                            />
                                            <span className="type-caption text-muted-foreground truncate">
                                                {item.name}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className="type-caption text-muted-foreground">{pct}%</span>
                                            <span className="type-caption font-medium">{item.value}</span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
            </CardContent>
        </AppCard>
    )
}
