'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatPrice } from '@/lib/utils/format'
import type { DailySales } from '@/types/stats'

interface RevenueChartProps {
    data: DailySales[]
}

export function RevenueChart({ data }: RevenueChartProps) {
    // Formater les dates pour l'affichage (ex: "15 Jan")
    const formattedData = data.map((item) => ({
        ...item,
        displayDate: new Date(item.date).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
        }),
    }))

    return (
        <Card>
            <CardHeader>
                <CardTitle>Évolution du chiffre d'affaires</CardTitle>
                <CardDescription>
                    Revenus quotidiens sur la période sélectionnée
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={formattedData}>
                        <defs>
                            {/* Gradient pour rendre le graphique plus attrayant */}
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                            dataKey="displayDate"
                            className="text-xs"
                            tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        />
                        <YAxis
                            className="text-xs"
                            tick={{ fill: 'hsl(var(--muted-foreground))' }}
                            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                        />
                        <Tooltip
                            content={({ active, payload }) => {
                                if (!active || !payload?.length) return null
                                const data = payload[0].payload
                                return (
                                    <div className="rounded-lg border bg-background p-2 shadow-sm">
                                        <div className="grid gap-2">
                                            <div className="flex flex-col">
                                                <span className="text-[0.70rem] uppercase text-muted-foreground">
                                                    {data.displayDate}
                                                </span>
                                                <span className="font-bold text-muted-foreground">
                                                    {formatPrice(data.revenue)}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {data.orders} commande(s)
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            }}
                        />
                        <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke="#3b82f6"
                            fillOpacity={1}
                            fill="url(#colorRevenue)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}