'use client'

import { AppCard, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/app-card'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { OrdersStats } from '@/types/stats'

interface OrdersDistributionChartProps {
    data: OrdersStats
}

// Utilise les variables CSS de statuts définies dans globals.css
const STATUS_CONFIG = {
    pending: { color: 'var(--status-pending)', label: 'En attente' },
    preparing: { color: 'var(--status-preparing)', label: 'En préparation' },
    ready: { color: 'var(--status-ready)', label: 'Prêtes' },
    delivered: { color: 'var(--status-delivered)', label: 'Livrées' },
    cancelled: { color: 'var(--status-cancelled)', label: 'Annulées' },
}

export function OrdersDistributionChart({ data }: OrdersDistributionChartProps) {
    // Transformer les données pour le graphique
    const chartData = [
        { name: 'En attente', value: data.pending, color: STATUS_CONFIG.pending.color },
        { name: 'En préparation', value: data.preparing, color: STATUS_CONFIG.preparing.color },
        { name: 'Prêtes', value: data.ready, color: STATUS_CONFIG.ready.color },
        { name: 'Livrées', value: data.delivered, color: STATUS_CONFIG.delivered.color },
        { name: 'Annulées', value: data.cancelled, color: STATUS_CONFIG.cancelled.color },
    ].filter((item) => item.value > 0) // Supprimer les statuts à 0

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