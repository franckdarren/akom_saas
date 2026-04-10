'use client'

// components/dashboard/stats/CashBalanceChart.tsx

import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from 'recharts'
import { AppCard, CardContent, CardHeader, CardTitle } from '@/components/ui/app-card'
import { formatPrice } from '@/lib/utils/format'
import type { CashSessionStat } from '@/types/stats'

interface CashBalanceChartProps {
    data: CashSessionStat[]
}

function formatDate(dateStr: string): string {
    // "YYYY-MM-DD" → "DD/MM"
    const [, month, day] = dateStr.split('-')
    return `${day}/${month}`
}

export function CashBalanceChart({ data }: CashBalanceChartProps) {
    const closedData = data.filter((s) => s.status === 'closed' && s.closingBalance !== null)

    return (
        <AppCard>
            <CardHeader>
                <CardTitle className="type-card-title">Évolution des soldes</CardTitle>
            </CardHeader>
            <CardContent>
                {closedData.length === 0 ? (
                    <div className="layout-empty-state">
                        <p className="type-body-muted">Aucune session clôturée sur la période</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={280}>
                        <LineChart data={closedData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                            <XAxis
                                dataKey="sessionDate"
                                tickFormatter={formatDate}
                                tick={{ fontSize: 11 }}
                                interval="preserveStartEnd"
                            />
                            <YAxis
                                tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                                tick={{ fontSize: 11 }}
                                width={40}
                            />
                            <Tooltip
                                formatter={(value: number | undefined, name: string | undefined) => [
                                    value != null ? formatPrice(value) : '—',
                                    name === 'openingBalance' ? 'Solde ouverture' : 'Solde fermeture',
                                ]}
                                labelFormatter={(label) => `Session du ${formatDate(label as string)}`}
                            />
                            <Legend
                                formatter={(value) =>
                                    value === 'openingBalance' ? 'Ouverture' : 'Fermeture'
                                }
                            />
                            <Line
                                type="monotone"
                                dataKey="openingBalance"
                                stroke="var(--chart-2)"
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 4 }}
                            />
                            <Line
                                type="monotone"
                                dataKey="closingBalance"
                                stroke="var(--chart-1)"
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 4 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </AppCard>
    )
}
