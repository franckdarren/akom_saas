'use client'

import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'
import type { DailySales, CategorySales, TopProduct, StockAlert } from '@/types/stats'

const RevenueChart = dynamic(
    () => import('./RevenueChart').then(m => ({ default: m.RevenueChart })),
    { ssr: false, loading: () => <Skeleton className="h-64 w-full rounded-xl" /> }
)
const TopProductsChart = dynamic(
    () => import('./TopProductsChart').then(m => ({ default: m.TopProductsChart })),
    { ssr: false, loading: () => <Skeleton className="h-64 w-full rounded-xl" /> }
)
const CategoryRevenueTable = dynamic(
    () => import('./CategoryRevenueTable').then(m => ({ default: m.CategoryRevenueTable })),
    { ssr: false, loading: () => <Skeleton className="h-64 w-full rounded-xl" /> }
)

interface StatsChartsProps {
    dailySales: DailySales[]
    topProducts: TopProduct[]
    categorySales: CategorySales[]
    stockAlerts: StockAlert[]
}

export function StatsCharts({ dailySales, topProducts, categorySales, stockAlerts }: StatsChartsProps) {
    return (
        <>
            <div className="grid gap-6 md:grid-cols-2">
                <RevenueChart data={dailySales} />
                <TopProductsChart data={topProducts} />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <CategoryRevenueTable data={categorySales} />

                {stockAlerts.length > 0 && (
                    <div className="rounded-xl border bg-card p-6 shadow-sm">
                        <h3 className="mb-4 text-base font-semibold">
                            Produits en rupture de stock
                        </h3>
                        <div className="space-y-3">
                            {stockAlerts.map((alert) => (
                                <div
                                    key={alert.productId}
                                    className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/30"
                                >
                                    <div>
                                        <p className="text-sm font-medium">{alert.productName}</p>
                                        {alert.categoryName && (
                                            <p className="text-xs text-muted-foreground">{alert.categoryName}</p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-semibold text-amber-700 dark:text-amber-500">
                                            {alert.currentQuantity} restant(s)
                                        </p>
                                        <p className="text-xs text-muted-foreground">Seuil: {alert.alertThreshold}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </>
    )
}
