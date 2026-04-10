'use client'

// components/dashboard/stats/ExpensesByCategoryChart.tsx

import { AppCard, CardContent, CardHeader, CardTitle } from '@/components/ui/app-card'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatPrice } from '@/lib/utils/format'
import { EXPENSE_CATEGORY_LABELS } from '@/lib/utils/stats-labels'

interface ExpensesByCategoryChartProps {
    data: { category: string; total: number }[]
}

export function ExpensesByCategoryChart({ data }: ExpensesByCategoryChartProps) {
    const chartData = data
        .filter((e) => e.total > 0)
        .sort((a, b) => b.total - a.total)
        .map((e) => ({
            name: EXPENSE_CATEGORY_LABELS[e.category] ?? e.category,
            total: e.total,
        }))

    return (
        <AppCard>
            <CardHeader>
                <CardTitle className="type-card-title">Dépenses par catégorie</CardTitle>
            </CardHeader>
            <CardContent>
                {chartData.length === 0 ? (
                    <div className="layout-empty-state">
                        <p className="type-body-muted">Aucune dépense sur la période</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={chartData} layout="vertical">
                            <XAxis
                                type="number"
                                stroke="#888888"
                                fontSize={12}
                                tickFormatter={(v: number) =>
                                    v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                                }
                            />
                            <YAxis
                                dataKey="name"
                                type="category"
                                stroke="#888888"
                                fontSize={12}
                                width={140}
                            />
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (!active || !payload?.length) return null
                                    return (
                                        <div className="rounded-lg border bg-card p-3 shadow-sm">
                                            <p className="text-sm font-medium">{payload[0].payload.name}</p>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                {formatPrice(payload[0].value as number)}
                                            </p>
                                        </div>
                                    )
                                }}
                            />
                            <Bar dataKey="total" fill="var(--destructive)" radius={[0, 4, 4, 0]} opacity={0.75} />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </AppCard>
    )
}
