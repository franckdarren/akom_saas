'use client'

// components/dashboard/stats/CashGapChart.tsx

import {
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ReferenceLine,
} from 'recharts'
import { AppCard, CardContent, CardHeader, CardTitle } from '@/components/ui/app-card'
import { formatPrice } from '@/lib/utils/format'
import type { CashSessionStat } from '@/types/stats'

interface CashGapChartProps {
    data: CashSessionStat[]
}

function formatDate(dateStr: string): string {
    const [, month, day] = dateStr.split('-')
    return `${day}/${month}`
}

export function CashGapChart({ data }: CashGapChartProps) {
    // Uniquement les sessions clôturées avec un écart enregistré
    const gapData = data.filter(
        (s) => s.status === 'closed' && s.balanceDifference !== null,
    )

    const hasGaps = gapData.some((s) => Math.abs(s.balanceDifference ?? 0) > 500)

    return (
        <AppCard>
            <CardHeader>
                <CardTitle className="type-card-title">Écarts de caisse</CardTitle>
            </CardHeader>
            <CardContent>
                {gapData.length === 0 ? (
                    <div className="layout-empty-state">
                        <p className="type-body-muted">Aucune session clôturée sur la période</p>
                    </div>
                ) : !hasGaps ? (
                    <div className="layout-empty-state">
                        <p className="type-body-muted">Aucun écart détecté — caisse équilibrée</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart
                            data={gapData}
                            margin={{ top: 4, right: 8, left: 0, bottom: 4 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                            <ReferenceLine y={0} stroke="var(--border)" />
                            <XAxis
                                dataKey="sessionDate"
                                tickFormatter={formatDate}
                                tick={{ fontSize: 11 }}
                                interval="preserveStartEnd"
                            />
                            <YAxis
                                tickFormatter={(v) =>
                                    v === 0 ? '0' : `${v > 0 ? '+' : ''}${Math.round(v / 1000)}k`
                                }
                                tick={{ fontSize: 11 }}
                                width={44}
                            />
                            <Tooltip
                                formatter={(value: number | undefined) => [
                                    value != null ? formatPrice(value) : '—',
                                    (value ?? 0) >= 0 ? 'Surplus' : 'Déficit',
                                ]}
                                labelFormatter={(label) => `Session du ${formatDate(label as string)}`}
                            />
                            <Bar dataKey="balanceDifference" radius={[3, 3, 0, 0]} maxBarSize={40}>
                                {gapData.map((entry, index) => (
                                    <Cell
                                        key={index}
                                        fill={
                                            (entry.balanceDifference ?? 0) >= 0
                                                ? 'var(--success)'
                                                : 'var(--destructive)'
                                        }
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </AppCard>
    )
}
