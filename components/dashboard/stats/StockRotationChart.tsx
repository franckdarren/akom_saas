'use client'

// components/dashboard/stats/StockRotationChart.tsx
// BarChart horizontal — top 10 produits par sorties sur la période

import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from 'recharts'
import { AppCard, CardContent, CardHeader, CardTitle } from '@/components/ui/app-card'
import type { StockRotationItem } from '@/types/stats'

interface StockRotationChartProps {
    data: StockRotationItem[]
}

export function StockRotationChart({ data }: StockRotationChartProps) {
    // Tronquer les noms longs pour l'axe Y
    const chartData = data.map((item) => ({
        ...item,
        shortName:
            item.productName.length > 18
                ? item.productName.slice(0, 17) + '…'
                : item.productName,
    }))

    return (
        <AppCard>
            <CardHeader>
                <CardTitle className="type-card-title">Rotation des stocks — top sorties</CardTitle>
            </CardHeader>
            <CardContent>
                {data.length === 0 ? (
                    <div className="layout-empty-state">
                        <p className="type-body-muted">Aucun mouvement de stock sur la période</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={Math.max(240, chartData.length * 36)}>
                        <BarChart
                            layout="vertical"
                            data={chartData}
                            margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
                        >
                            <CartesianGrid
                                strokeDasharray="3 3"
                                horizontal={false}
                                className="stroke-border"
                            />
                            <XAxis
                                type="number"
                                tick={{ fontSize: 11 }}
                                allowDecimals={false}
                            />
                            <YAxis
                                type="category"
                                dataKey="shortName"
                                tick={{ fontSize: 11 }}
                                width={110}
                            />
                            <Tooltip
                                formatter={(value: number | undefined) => [
                                    `${value ?? 0} unité${(value ?? 0) > 1 ? 's' : ''}`,
                                    'Sorties',
                                ]}
                                labelFormatter={(label) => label}
                            />
                            <Bar
                                dataKey="outQty"
                                fill="var(--chart-3)"
                                radius={[0, 3, 3, 0]}
                                maxBarSize={24}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </AppCard>
    )
}
