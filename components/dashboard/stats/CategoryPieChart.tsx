// components/dashboard/stats/CategoryPieChart.tsx
'use client'

import { AppCard, CardContent, CardHeader, CardTitle } from '@/components/ui/app-card'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { CategorySales } from '@/types/stats'
import { formatPrice } from '@/lib/utils/format'

interface CategoryPieChartProps {
    data: CategorySales[]
}

// Utilise les variables CSS --chart-1 à --chart-5 définies dans globals.css
const CHART_COLORS = Array.from({ length: 5 }, (_, i) => `var(--chart-${i + 1})`)

export function CategoryPieChart({ data }: CategoryPieChartProps) {
    const chartData = data.map((cat) => ({
        name: cat.categoryName,
        value: cat.revenue,
        percentage: cat.percentage,
    }))

    return (
        <AppCard>
            <CardHeader>
                <CardTitle className="text-base font-semibold">
                    Ventes par catégorie
                </CardTitle>
            </CardHeader>
            <CardContent>
                {data.length === 0 ? (
                    <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
                        Aucune catégorie trouvée
                    </div>
                ) : (
                    <div className="flex items-center gap-8">
                        {/* Graphique */}
                        <ResponsiveContainer width="50%" height={250}>
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={2}
                                    dataKey="value"
                                >
                                    {chartData.map((_, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={CHART_COLORS[index % CHART_COLORS.length]}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    content={({ active, payload }) => {
                                        if (!active || !payload?.length) return null

                                        return (
                                            <div className="rounded-lg border bg-card p-3 shadow-sm">
                                                <p className="text-sm font-medium">
                                                    {payload[0].payload.name}
                                                </p>
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    {formatPrice(payload[0].value as number)}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {payload[0].payload.percentage}% du total
                                                </p>
                                            </div>
                                        )
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>

                        {/* Légende */}
                        <div className="flex-1 space-y-2">
                            {data.map((cat, index) => (
                                <div key={cat.categoryId || 'uncategorized'} className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="h-3 w-3 rounded-sm"
                                            style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                                        />
                                        <span className="text-xs text-muted-foreground truncate">
                                            {cat.categoryName}
                                        </span>
                                    </div>
                                    <span className="text-xs font-medium">{cat.percentage}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </AppCard>
    )
}