'use client'

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import {
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
} from 'recharts'
import { formatPrice } from '@/lib/utils/format'
import type { CategorySales } from '@/types/stats'

interface CategorySalesChartProps {
    data: CategorySales[]
}

// Palette de couleurs cohérente et agréable à l'œil
const COLORS = [
    '#3b82f6', // Bleu
    '#10b981', // Vert
    '#f59e0b', // Orange
    '#8b5cf6', // Violet
    '#ef4444', // Rouge
    '#06b6d4', // Cyan
    '#ec4899', // Rose
    '#6366f1', // Indigo
]

export function CategorySalesChart({ data }: CategorySalesChartProps) {
    // Prendre seulement les 8 catégories les plus importantes
    const topCategories: CategorySales[] = data.slice(0, 8)

    // Si on a plus de 8 catégories, regrouper le reste dans "Autres"
    if (data.length > 8) {
        const others = data.slice(8)

        const othersRevenue = others.reduce(
            (sum, cat) => sum + cat.revenue,
            0
        )

        const othersCount = others.reduce(
            (sum, cat) => sum + cat.ordersCount,
            0
        )

        const totalRevenue = data.reduce(
            (sum, cat) => sum + cat.revenue,
            0
        )

        topCategories.push({
            categoryId: null,
            categoryName: 'Autres',
            revenue: othersRevenue,
            ordersCount: othersCount,
            percentage: Math.round((othersRevenue / totalRevenue) * 100),
        })
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Ventes par catégorie</CardTitle>
                <CardDescription>
                    Répartition du chiffre d'affaires par type de produit
                </CardDescription>
            </CardHeader>

            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie
                            data={topCategories}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            dataKey="revenue"
                            labelLine={false}
                            label={({ payload }) =>
                                `${payload.categoryName} (${payload.percentage}%)`
                            }
                        >
                            {topCategories.map((_, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={COLORS[index % COLORS.length]}
                                />
                            ))}
                        </Pie>

                        <Tooltip
                            content={({ active, payload }) => {
                                if (!active || !payload?.length) return null

                                const data =
                                    payload[0].payload as CategorySales

                                return (
                                    <div className="rounded-lg border bg-background p-3 shadow-sm">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-sm font-semibold">
                                                {data.categoryName}
                                            </span>

                                            <span className="text-lg font-bold text-muted-foreground">
                                                {formatPrice(data.revenue)}
                                            </span>

                                            <span className="text-xs text-muted-foreground">
                                                {data.ordersCount} commande(s)
                                            </span>

                                            <span className="text-xs font-medium text-muted-foreground">
                                                {data.percentage}% du CA
                                            </span>
                                        </div>
                                    </div>
                                )
                            }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}
