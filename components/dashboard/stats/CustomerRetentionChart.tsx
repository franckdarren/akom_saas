'use client'

// components/dashboard/stats/CustomerRetentionChart.tsx

import { AppCard, CardContent, CardHeader, CardTitle } from '@/components/ui/app-card'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

interface CustomerRetentionChartProps {
    newCustomers: number
    returningCustomers: number
    identifiedCustomers: number
}

const SEGMENTS = [
    {
        key: 'new',
        label: 'Nouveaux',
        color: 'var(--info)',
    },
    {
        key: 'returning',
        label: 'Récurrents',
        color: 'var(--success)',
    },
]

export function CustomerRetentionChart({
    newCustomers,
    returningCustomers,
    identifiedCustomers,
}: CustomerRetentionChartProps) {
    const chartData = [
        { key: 'new', label: 'Nouveaux', value: newCustomers },
        { key: 'returning', label: 'Récurrents', value: returningCustomers },
    ].filter((d) => d.value > 0)

    const retentionRate =
        identifiedCustomers > 0
            ? Math.round((returningCustomers / identifiedCustomers) * 100)
            : 0

    const colorMap = Object.fromEntries(SEGMENTS.map((s) => [s.key, s.color]))

    return (
        <AppCard>
            <CardHeader>
                <CardTitle className="type-card-title">Rétention clients</CardTitle>
            </CardHeader>
            <CardContent>
                {identifiedCustomers === 0 ? (
                    <div className="layout-empty-state">
                        <p className="type-body-muted">Aucun client identifié sur la période</p>
                    </div>
                ) : (
                    <div className="flex items-center gap-6">
                        {/* Donut avec taux de rétention au centre */}
                        <div className="relative shrink-0">
                            <ResponsiveContainer width={160} height={160}>
                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={70}
                                        paddingAngle={2}
                                        dataKey="value"
                                    >
                                        {chartData.map((entry) => (
                                            <Cell
                                                key={entry.key}
                                                fill={colorMap[entry.key] ?? 'var(--muted-foreground)'}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        content={({ active, payload }) => {
                                            if (!active || !payload?.length) return null
                                            const val = payload[0].value as number
                                            const pct = identifiedCustomers > 0
                                                ? Math.round((val / identifiedCustomers) * 100)
                                                : 0
                                            return (
                                                <div className="rounded-lg border bg-card p-3 shadow-sm">
                                                    <p className="type-body font-medium">
                                                        {payload[0].payload.label}
                                                    </p>
                                                    <p className="mt-1 type-caption text-muted-foreground">
                                                        {val} client{val > 1 ? 's' : ''}
                                                    </p>
                                                    <p className="type-caption text-muted-foreground">{pct}%</p>
                                                </div>
                                            )
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            {/* Taux de rétention au centre */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-xl font-bold text-success">{retentionRate}%</span>
                                <span className="type-caption text-muted-foreground">récurrents</span>
                            </div>
                        </div>

                        <div className="flex-1 space-y-2">
                            {SEGMENTS.map((seg) => {
                                const val = seg.key === 'new' ? newCustomers : returningCustomers
                                const pct = identifiedCustomers > 0
                                    ? Math.round((val / identifiedCustomers) * 100)
                                    : 0
                                return (
                                    <div key={seg.key} className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div
                                                className="h-3 w-3 shrink-0 rounded-sm"
                                                style={{ backgroundColor: seg.color }}
                                            />
                                            <span className="type-caption text-muted-foreground truncate">
                                                {seg.label}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className="type-caption text-muted-foreground">{pct}%</span>
                                            <span className="type-caption font-medium">{val}</span>
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
