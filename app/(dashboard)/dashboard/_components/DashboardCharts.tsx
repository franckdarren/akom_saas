'use client'

import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'
import type { DailySales, CategorySales, TopProduct, OrdersStats } from '@/types/stats'

const RevenueChart = dynamic(
    () => import('@/components/stats/revenue-chart').then(m => ({ default: m.RevenueChart })),
    { ssr: false, loading: () => <Skeleton className="h-64 w-full rounded-xl" /> }
)
const CategorySalesChart = dynamic(
    () => import('@/components/stats/category-sales-chart').then(m => ({ default: m.CategorySalesChart })),
    { ssr: false, loading: () => <Skeleton className="h-64 w-full rounded-xl" /> }
)
const TopProductsChart = dynamic(
    () => import('@/components/stats/top-products-chart').then(m => ({ default: m.TopProductsChart })),
    { ssr: false, loading: () => <Skeleton className="h-64 w-full rounded-xl" /> }
)
const OrdersDistributionChart = dynamic(
    () => import('@/components/stats/orders-distribution-chart').then(m => ({ default: m.OrdersDistributionChart })),
    { ssr: false, loading: () => <Skeleton className="h-64 w-full rounded-xl" /> }
)

interface DashboardChartsProps {
    dailySales: DailySales[]
    orders: OrdersStats
    categorySales: CategorySales[]
    topProducts: TopProduct[]
}

export function DashboardCharts({ dailySales, orders, categorySales, topProducts }: DashboardChartsProps) {
    return (
        <>
            <div className="grid gap-4 md:grid-cols-2">
                <RevenueChart data={dailySales} />
                <OrdersDistributionChart data={orders} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <CategorySalesChart data={categorySales} />
                <TopProductsChart data={topProducts} />
            </div>
        </>
    )
}
