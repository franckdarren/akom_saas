// components/dashboard/stats/CategoryPieChart.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { CategorySales } from '@/types/stats'
import { formatPrice } from '@/lib/utils/format'

interface CategoryPieChartProps {
    data: CategorySales[]
}

const COLORS = [
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // violet
    '#ec4899', // pink
]

export function CategoryPieChart({ data }: CategoryPieChartProps) {
    const chartData = data.map((cat) => ({
        name: cat.categoryName,
        value: cat.revenue,
        percentage: cat.percentage,
    }))

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base font-semibold">
                    Ventes par catégorie
                </CardTitle>
            </CardHeader>
            <CardContent>
                {data.length === 0 ? (
                    <div className="flex h-64 items-center justify-center text-sm text-zinc-500">
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
                                            fill={COLORS[index % COLORS.length]}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    content={({ active, payload }) => {
                                        if (!active || !payload?.length) return null

                                        return (
                                            <div className="rounded-lg border bg-white p-3 shadow-lg dark:bg-zinc-900">
                                                <p className="text-sm font-medium">
                                                    {payload[0].payload.name}
                                                </p>
                                                <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                                                    {formatPrice(payload[0].value as number)}
                                                </p>
                                                <p className="text-xs text-zinc-600 dark:text-zinc-400">
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
                                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                        />
                                        <span className="text-xs text-zinc-600 dark:text-zinc-400 truncate">
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
        </Card>
    )
}