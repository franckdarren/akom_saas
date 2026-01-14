// components/dashboard/stats/TopProductsChart.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { TopProduct } from '@/types/stats'
import { formatPrice } from '@/lib/utils/format'

interface TopProductsChartProps {
    data: TopProduct[]
}

export function TopProductsChart({ data }: TopProductsChartProps) {
    // Limiter les noms de produits pour l'affichage
    const chartData = data.map((product) => ({
        name: product.productName.length > 20
            ? product.productName.substring(0, 17) + '...'
            : product.productName,
        fullName: product.productName,
        quantity: product.quantitySold,
        revenue: product.revenue,
    }))

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base font-semibold">
                    Top 5 produits vendus
                </CardTitle>
            </CardHeader>
            <CardContent>
                {data.length === 0 ? (
                    <div className="flex h-64 items-center justify-center text-sm text-zinc-500">
                        Aucune vente enregistrée
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData} layout="vertical">
                            <XAxis type="number" stroke="#888888" fontSize={12} />
                            <YAxis
                                dataKey="name"
                                type="category"
                                stroke="#888888"
                                fontSize={12}
                                width={120}
                            />
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (!active || !payload?.length) return null

                                    return (
                                        <div className="rounded-lg border bg-white p-3 shadow-lg dark:bg-zinc-900">
                                            <p className="text-sm font-medium">
                                                {payload[0].payload.fullName}
                                            </p>
                                            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                                                Quantité: {payload[0].payload.quantity}
                                            </p>
                                            <p className="text-xs text-zinc-600 dark:text-zinc-400">
                                                CA: {formatPrice(payload[0].payload.revenue)}
                                            </p>
                                        </div>
                                    )
                                }}
                            />
                            <Bar dataKey="quantity" fill="#10b981" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
    )
}