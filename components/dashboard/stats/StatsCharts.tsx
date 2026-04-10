'use client'

import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'
import { AppCard, CardContent, CardHeader, CardTitle } from '@/components/ui/app-card'
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
                    <AppCard>
                        <CardHeader>
                            <CardTitle className="type-card-title">
                                Produits en rupture de stock
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {stockAlerts.map((alert) => (
                                    <div
                                        key={alert.productId}
                                        className="flex items-center justify-between rounded-lg border border-warning bg-warning-subtle p-3"
                                    >
                                        <div>
                                            <p className="type-body font-medium">{alert.productName}</p>
                                            {alert.categoryName && (
                                                <p className="type-caption text-muted-foreground">{alert.categoryName}</p>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <p className="type-body font-semibold text-warning">
                                                {alert.currentQuantity} restant(s)
                                            </p>
                                            <p className="type-caption text-muted-foreground">Seuil : {alert.alertThreshold}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </AppCard>
                )}
            </div>
        </>
    )
}
