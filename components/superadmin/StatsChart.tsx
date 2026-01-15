'use client'

import { formatPrice, formatNumber } from '@/lib/utils/format'

interface StatsChartProps {
    data: Array<{
        period: string
        ordersCount: number
        revenue: number
        avgOrderValue: number
    }>
}

export function StatsChart({ data }: StatsChartProps) {
    // Trouver les valeurs max pour la mise à l'échelle
    const maxOrders = Math.max(...data.map(d => d.ordersCount), 1)
    const maxRevenue = Math.max(...data.map(d => d.revenue), 1)

    return (
        <div className="space-y-4">
            {/* Légende */}
            <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded" />
                    <span className="text-zinc-600 dark:text-zinc-400">
                        Commandes
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded" />
                    <span className="text-zinc-600 dark:text-zinc-400">
                        Revenu
                    </span>
                </div>
            </div>

            {/* Graphique simple en barres */}
            <div className="space-y-3">
                {data.map((item, index) => {
                    const orderHeight = (item.ordersCount / maxOrders) * 100
                    const revenueHeight = (item.revenue / maxRevenue) * 100

                    return (
                        <div key={index} className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-zinc-600 dark:text-zinc-400 w-20">
                                    {item.period}
                                </span>
                                <div className="flex-1 mx-4 flex gap-2 items-end h-12">
                                    {/* Barre commandes */}
                                    <div
                                        className="bg-blue-500 rounded-t transition-all hover:bg-blue-600 flex-1 relative group"
                                        style={{ height: `${orderHeight}%` }}
                                        title={`${formatNumber(item.ordersCount)} commandes`}
                                    >
                                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                            {formatNumber(item.ordersCount)} cmd
                                        </div>
                                    </div>
                                    
                                    {/* Barre revenu */}
                                    <div
                                        className="bg-green-500 rounded-t transition-all hover:bg-green-600 flex-1 relative group"
                                        style={{ height: `${revenueHeight}%` }}
                                        title={formatPrice(item.revenue)}
                                    >
                                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                            {formatPrice(item.revenue)}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right text-xs w-24 space-y-1">
                                    <div className="text-blue-600 dark:text-blue-400">
                                        {formatNumber(item.ordersCount)}
                                    </div>
                                    <div className="text-green-600 dark:text-green-400">
                                        {formatPrice(item.revenue)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}