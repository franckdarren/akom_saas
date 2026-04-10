'use client'

// components/dashboard/stats/PaymentStatusChart.tsx

import { AppCard, CardContent, CardHeader, CardTitle } from '@/components/ui/app-card'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { PaymentByStatus } from '@/types/stats'

interface PaymentStatusChartProps {
    data: PaymentByStatus[]
    totalPayments: number
    overallSuccessRate: number
}

const PAYMENT_STATUS_LABELS: Record<string, string> = {
    paid: 'Payé',
    failed: 'Échoué',
    refunded: 'Remboursé',
    pending: 'En attente',
}

// Couleurs sémantiques par statut
const STATUS_COLORS: Record<string, string> = {
    paid: 'var(--success)',
    failed: 'var(--destructive)',
    refunded: 'var(--warning)',
    pending: 'var(--chart-4)',
}

const FALLBACK_COLOR = 'var(--muted-foreground)'

export function PaymentStatusChart({ data, totalPayments, overallSuccessRate }: PaymentStatusChartProps) {
    const chartData = data
        .filter((d) => d.count > 0)
        .map((d) => ({
            name: PAYMENT_STATUS_LABELS[d.status] ?? d.status,
            status: d.status,
            value: d.count,
        }))

    return (
        <AppCard>
            <CardHeader>
                <CardTitle className="type-card-title">Statuts de paiement</CardTitle>
            </CardHeader>
            <CardContent>
                {chartData.length === 0 ? (
                    <div className="layout-empty-state">
                        <p className="type-body-muted">Aucun paiement sur la période</p>
                    </div>
                ) : (
                    <div className="flex items-center gap-6">
                        {/* Donut avec taux de succès au centre */}
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
                                                key={entry.status}
                                                fill={STATUS_COLORS[entry.status] ?? FALLBACK_COLOR}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        content={({ active, payload }) => {
                                            if (!active || !payload?.length) return null
                                            const pct = totalPayments > 0
                                                ? Math.round((payload[0].value as number / totalPayments) * 100)
                                                : 0
                                            return (
                                                <div className="rounded-lg border bg-card p-3 shadow-sm">
                                                    <p className="type-body font-medium">{payload[0].payload.name}</p>
                                                    <p className="mt-1 type-caption text-muted-foreground">
                                                        {payload[0].value as number} paiement{(payload[0].value as number) > 1 ? 's' : ''}
                                                    </p>
                                                    <p className="type-caption text-muted-foreground">{pct}%</p>
                                                </div>
                                            )
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            {/* Taux de succès au centre du donut */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-xl font-bold text-success">{overallSuccessRate}%</span>
                                <span className="type-caption text-muted-foreground">succès</span>
                            </div>
                        </div>

                        <div className="flex-1 space-y-2">
                            {chartData.map((item) => {
                                const pct = totalPayments > 0
                                    ? Math.round((item.value / totalPayments) * 100)
                                    : 0
                                return (
                                    <div key={item.status} className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div
                                                className="h-3 w-3 shrink-0 rounded-sm"
                                                style={{ backgroundColor: STATUS_COLORS[item.status] ?? FALLBACK_COLOR }}
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
