'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from 'recharts'
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
    const topCategories = data.slice(0, 8)

    // Si on a plus de 8 catégories, regrouper le reste dans "Autres"
    if (data.length > 8) {
        const othersRevenue = data.slice(8).reduce((sum, cat) => sum + cat.revenue, 0)
        const othersCount = data.slice(8).reduce((sum, cat) => sum + cat.ordersCount, 0)
        topCategories.push({
            categoryId: null,
            categoryName: 'Autres',
            revenue: othersRevenue,
            ordersCount: othersCount,
            percentage: Math.round((othersRevenue / data.reduce((sum, cat) => sum + cat.revenue, 0)) * 100)
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
                            labelLine={false}
                            label={({ categoryName, percentage }) => `${categoryName} (${percentage}%)`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="revenue"
                        >
                            {topCategories.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            content={({ active, payload }) => {
                                if (!active || !payload?.length) return null
                                const data = payload[0].payload
                                return (
                                    <div className="rounded-lg border bg-background p-3 shadow-sm">
                                        <div className="grid gap-2">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold">
                                                    {data.categoryName}
                                                </span>
                                                <span className="text-lg font-bold text-muted-foreground">
                                                    {formatPrice(data.revenue)}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {data.ordersCount} commande(s)
                                                </span>
                                                <span className="text-xs text-muted-foreground font-medium">
                                                    {data.percentage}% du CA
                                                </span>
                                            </div>
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