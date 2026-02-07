'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatPrice } from '@/lib/utils/format'
import type { TopProduct } from '@/types/stats'

interface TopProductsChartProps {
    data: TopProduct[]
}

export function TopProductsChart({ data }: TopProductsChartProps) {
    // Limiter à 10 produits max pour la lisibilité
    const topProducts = data.slice(0, 10)

    return (
        <Card>
            <CardHeader>
                <CardTitle>Produits les plus vendus</CardTitle>
                <CardDescription>
                    Top {topProducts.length} des best-sellers
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={topProducts} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                        <XAxis type="number" className="text-xs" />
                        <YAxis
                            dataKey="productName"
                            type="category"
                            className="text-xs"
                            width={150}
                            tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        />
                        <Tooltip
                            content={({ active, payload }) => {
                                if (!active || !payload?.length) return null
                                const data = payload[0].payload
                                return (
                                    <div className="rounded-lg border bg-background p-3 shadow-sm">
                                        <div className="grid gap-2">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold truncate max-w-[200px]">
                                                    {data.productName}
                                                </span>
                                                {data.categoryName && (
                                                    <span className="text-xs text-muted-foreground">
                                                        {data.categoryName}
                                                    </span>
                                                )}
                                                <span className="text-lg font-bold text-muted-foreground mt-1">
                                                    {formatPrice(data.revenue)}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {data.quantitySold} vente(s)
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            }}
                        />
                        <Bar dataKey="quantitySold" fill="#10b981" radius={[0, 4, 4, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}