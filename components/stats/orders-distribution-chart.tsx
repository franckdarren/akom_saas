'use client'

import { AppCard, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/app-card'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { OrdersStats } from '@/types/stats'
import { useActivityLabels } from '@/lib/hooks/use-activity-labels'

interface OrdersDistributionChartProps {
    data: OrdersStats
}

const STATUS_COLORS = {
    pending: 'var(--status-pending)',
    preparing: 'var(--status-preparing)',
    ready: 'var(--status-ready)',
    delivered: 'var(--status-delivered)',
    cancelled: 'var(--status-cancelled)',
}

export function OrdersDistributionChart({ data }: OrdersDistributionChartProps) {
    const labels = useActivityLabels()
    const s = labels.orderStatuses

    // Transformer les données pour le graphique
    const chartData = [
        { name: s.pending.filterLabel, value: data.pending, color: STATUS_COLORS.pending },
        { name: s.preparing.filterLabel, value: data.preparing, color: STATUS_COLORS.preparing },
        { name: s.ready.filterLabel, value: data.ready, color: STATUS_COLORS.ready },
        { name: s.delivered.filterLabel, value: data.delivered, color: STATUS_COLORS.delivered },
        { name: s.cancelled.filterLabel, value: data.cancelled, color: STATUS_COLORS.cancelled },
    ].filter((item) => item.value > 0)

    const totalActive = data.pending + data.preparing + data.ready

    return (
        <AppCard>
            <CardHeader>
                <CardTitle>Répartition des commandes</CardTitle>
                <CardDescription>
                    {totalActive} commande(s) active(s) sur {data.total} au total
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between">
                    {/* Graphique circulaire */}
                    <ResponsiveContainer width="65%" height={200}>
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={80}
                                fill="var(--chart-1)"
                                paddingAngle={2}
                                dataKey="value"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (!active || !payload?.length) return null
                                    const data = payload[0]
                                    return (
                                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold">
                                                    {data.name}
                                                </span>
                                                <span className="text-lg font-bold text-muted-foreground">
                                                    {data.value} commande(s)
                                                </span>
                                            </div>
                                        </div>
                                    )
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>

                    {/* Légende avec statistiques */}
                    <div className="flex flex-col gap-2 flex-1">
                        {chartData.map((item) => (
                            <div key={item.name} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div
                                        className="h-3 w-3 rounded-sm"
                                        style={{ backgroundColor: item.color }}
                                    />
                                    <span className="text-sm text-muted-foreground">{item.name}</span>
                                </div>
                                <span className="text-sm font-semibold">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </AppCard>
    )
}