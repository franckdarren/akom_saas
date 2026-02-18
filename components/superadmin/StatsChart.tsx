'use client'

import {formatPrice, formatNumber} from '@/lib/utils/format'

interface StatsChartProps {
    data: Array<{
        period: string
        ordersCount: number
        revenue: number
        avgOrderValue: number
    }>
}

export function StatsChart({data}: StatsChartProps) {
    const maxOrders = Math.max(...data.map(d => d.ordersCount), 1)
    const maxRevenue = Math.max(...data.map(d => d.revenue), 1)

    return (
        <div className="space-y-4">
            {/* Légende */}
            <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-primary rounded"/>
                    <span className="text-muted-foreground">Commandes</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-success rounded"/>
                    <span className="text-muted-foreground">Revenu</span>
                </div>
            </div>

            {/* Graphique simple */}
            <div className="space-y-3">
                {data.map((item, index) => {
                    const orderHeight = (item.ordersCount / maxOrders) * 100
                    const revenueHeight = (item.revenue / maxRevenue) * 100

                    return (
                        <div key={index} className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                {/* Période */}
                                <span className="text-muted-foreground w-20">
                  {item.period}
                </span>

                                {/* Barres */}
                                <div className="flex-1 mx-4 flex gap-2 items-end h-12">
                                    {/* Commandes */}
                                    <div
                                        className="bg-primary rounded-t transition-all hover:bg-primary/80 flex-1 relative group"
                                        style={{height: `${orderHeight}%`}}
                                        title={`${formatNumber(item.ordersCount)} commandes`}
                                    >
                                        <div
                                            className="absolute -top-6 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                            {formatNumber(item.ordersCount)} cmd
                                        </div>
                                    </div>

                                    {/* Revenu */}
                                    <div
                                        className="bg-success rounded-t transition-all hover:bg-success/80 flex-1 relative group"
                                        style={{height: `${revenueHeight}%`}}
                                        title={formatPrice(item.revenue)}
                                    >
                                        <div
                                            className="absolute -top-6 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                            {formatPrice(item.revenue)}
                                        </div>
                                    </div>
                                </div>

                                {/* Valeurs */}
                                <div className="text-right text-xs w-24 space-y-1">
                                    <div className="text-primary">{formatNumber(item.ordersCount)}</div>
                                    <div className="text-success">{formatPrice(item.revenue)}</div>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
