// app/(dashboard)/dashboard/stats/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { StatsCard } from '@/components/dashboard/stats/StatsCard'
import { RevenueChart } from '@/components/dashboard/stats/RevenueChart'
import { TopProductsChart } from '@/components/dashboard/stats/TopProductsChart'
import { CategoryPieChart } from '@/components/dashboard/stats/CategoryPieChart'
import { RecentOrdersTable } from '@/components/dashboard/stats/RecentOrdersTable'
import { PeriodFilter } from '@/components/dashboard/stats/PeriodFilter'
import { getDashboardStats } from '@/lib/actions/stats'
import { TIME_PERIODS, type TimePeriod, type DashboardStats } from '@/types/stats'
import { DollarSign, ShoppingCart, TrendingUp, Package } from 'lucide-react'
import { formatPrice } from '@/lib/utils/format'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

export default function StatsPage() {
    const [period, setPeriod] = useState<TimePeriod>(TIME_PERIODS.TODAY)
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [loading, setLoading] = useState(true)

    // Charger les stats
    useEffect(() => {
        async function loadStats() {
            setLoading(true)
            try {
                const data = await getDashboardStats(period)
                setStats(data)
            } catch (error) {
                console.error('Erreur chargement stats:', error)
            } finally {
                setLoading(false)
            }
        }

        loadStats()
    }, [period])

    if (loading) {
        return (
            <div className="space-y-6 p-6">
                {/* Header Skeleton */}
                <div className="flex items-center justify-between">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-10 w-40" />
                </div>

                {/* KPI Cards Skeleton */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-32" />
                    ))}
                </div>

                {/* Charts Skeleton */}
                <div className="grid gap-6 md:grid-cols-2">
                    <Skeleton className="h-80" />
                    <Skeleton className="h-80" />
                </div>
            </div>
        )
    }

    if (!stats) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <p className="text-zinc-500">Erreur lors du chargement des statistiques</p>
            </div>
        )
    }

    return (
        <>
            {/* Header avec breadcrumb */}
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <div className="flex justify-between w-full">
                    <div className='my-auto'>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/dashboard">Analyse</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Paramètres</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </div>
                    {/* <div className="border-black text-right leading-tight text-sm">
                                {
                                    userRole === "admin" && <p className="truncate font-medium">Administrateur</p>
                                }
                                {
                                    userRole === "kitchen" && <p className="truncate font-medium">Cuisine</p>
                                }
                                <p className="text-muted-foreground truncate text-xs">{user.email}</p>
                            </div> */}
                </div>

            </header >

            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Statistiques</h1>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                            Analysez les performances de votre structure
                        </p>
                    </div>
                    <PeriodFilter value={period} onChange={setPeriod} />
                </div>

                {/* KPI Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatsCard
                        title="Chiffre d'affaires"
                        value={formatPrice(stats.revenue.total)}
                        icon={DollarSign}
                        variant="success"
                        trend={{
                            value: stats.revenue.percentChange,
                            isPositive: stats.revenue.percentChange >= 0,
                        }}
                    />
                    <StatsCard
                        title="Commandes"
                        value={stats.orders.total}
                        icon={ShoppingCart}
                        variant="default"
                        description={`${stats.orders.delivered} livrées`}
                    />
                    <StatsCard
                        title="Panier moyen"
                        value={formatPrice(stats.orders.averageOrderValue)}
                        icon={TrendingUp}
                        variant="default"
                    />
                    <StatsCard
                        title="Alertes stock"
                        value={stats.stockAlerts.length}
                        icon={Package}
                        variant={stats.stockAlerts.length > 0 ? 'warning' : 'success'}
                        description={
                            stats.stockAlerts.length > 0
                                ? `${stats.stockAlerts.length} produit(s) en rupture`
                                : 'Tous les stocks OK'
                        }
                    />
                </div>

                {/* Charts Row 1 */}
                <div className="grid gap-6 md:grid-cols-2">
                    <RevenueChart data={stats.dailySales} />
                    <TopProductsChart data={stats.topProducts} />
                </div>

                {/* Charts Row 2 */}
                <div className="grid gap-6 md:grid-cols-2">
                    <CategoryPieChart data={stats.categorySales} />

                    {/* Stock Alerts */}
                    {stats.stockAlerts.length > 0 && (
                        <div className="rounded-xl border bg-white p-6 shadow-sm dark:bg-zinc-900">
                            <h3 className="mb-4 text-base font-semibold">
                                Produits en rupture de stock
                            </h3>
                            <div className="space-y-3">
                                {stats.stockAlerts.map((alert) => (
                                    <div
                                        key={alert.productId}
                                        className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/30"
                                    >
                                        <div>
                                            <p className="text-sm font-medium">
                                                {alert.productName}
                                            </p>
                                            {alert.categoryName && (
                                                <p className="text-xs text-zinc-500">
                                                    {alert.categoryName}
                                                </p>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-semibold text-amber-700 dark:text-amber-500">
                                                {alert.currentQuantity} restant(s)
                                            </p>
                                            <p className="text-xs text-zinc-500">
                                                Seuil: {alert.alertThreshold}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Recent Orders Table */}
                <RecentOrdersTable data={stats.recentOrders} />
            </div>
        </>
    )
}