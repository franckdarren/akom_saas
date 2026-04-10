'use client'

// components/dashboard/stats/StockMovementTypeChart.tsx

import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
} from 'recharts'
import { AppCard, CardContent, CardHeader, CardTitle } from '@/components/ui/app-card'
import { STOCK_MOVEMENT_TYPE_LABELS } from '@/lib/utils/stats-labels'
import type { StockMovementByStat } from '@/types/stats'

interface StockMovementTypeChartProps {
    data: StockMovementByStat[]
}

const MOVEMENT_COLORS: Record<string, string> = {
    manual_in: 'var(--chart-1)',
    purchase: 'var(--chart-2)',
    order_out: 'var(--chart-3)',
    sale_manual: 'var(--chart-4)',
    manual_out: 'var(--chart-5)',
    adjustment: 'var(--muted-foreground)',
}

export function StockMovementTypeChart({ data }: StockMovementTypeChartProps) {
    return (
        <AppCard>
            <CardHeader>
                <CardTitle className="type-card-title">Mouvements par type</CardTitle>
            </CardHeader>
            <CardContent>
                {data.length === 0 ? (
                    <div className="layout-empty-state">
                        <p className="type-body-muted">Aucun mouvement de stock sur la période</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                            <Pie
                                data={data}
                                dataKey="count"
                                nameKey="type"
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={95}
                                paddingAngle={2}
                            >
                                {data.map((entry, index) => (
                                    <Cell
                                        key={index}
                                        fill={MOVEMENT_COLORS[entry.type] ?? 'var(--chart-1)'}
                                    />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value: number | undefined, name: string | undefined) => [
                                    `${value ?? 0} mouvement${(value ?? 0) > 1 ? 's' : ''}`,
                                    STOCK_MOVEMENT_TYPE_LABELS[name ?? ''] ?? name,
                                ]}
                            />
                            <Legend
                                formatter={(value) =>
                                    STOCK_MOVEMENT_TYPE_LABELS[value] ?? value
                                }
                            />
                        </PieChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </AppCard>
    )
}
