// components/dashboard/stats/RevenueChart.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { DailySales } from '@/types/stats'
import { formatPrice } from '@/lib/utils/format'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface RevenueChartProps {
    data: DailySales[]
}

export function RevenueChart({ data }: RevenueChartProps) {
    // Formater les données pour le graphique
    const chartData = data.map((item) => ({
        date: format(new Date(item.date), 'dd MMM', { locale: fr }),
        revenue: item.revenue,
        orders: item.orders,
    }))

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base font-semibold">
                    Évolution du chiffre d'affaires
                </CardTitle>
            </CardHeader>
            <CardContent>
                {data.length === 0 ? (
                    <div className="flex h-64 items-center justify-center text-sm text-zinc-500">
                        Aucune donnée disponible
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData}>
                            <XAxis
                                dataKey="date"
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `${value / 1000}k`}
                            />
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (!active || !payload?.length) return null

                                    return (
                                        <div className="rounded-lg border bg-white p-3 shadow-lg dark:bg-zinc-900">
                                            <p className="text-sm font-medium">
                                                {payload[0].payload.date}
                                            </p>
                                            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                                                CA: {formatPrice(payload[0].value as number)}
                                            </p>
                                            <p className="text-xs text-zinc-600 dark:text-zinc-400">
                                                {payload[0].payload.orders} commande(s)
                                            </p>
                                        </div>
                                    )
                                }}
                            />
                            <Line
                                type="monotone"
                                dataKey="revenue"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                dot={false}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
    )
}