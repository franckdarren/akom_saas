// app/(dashboard)/dashboard/stats/page.tsx
import { Suspense } from 'react'
import { StatsCard } from '@/components/dashboard/stats/StatsCard'
import { RecentOrdersTable } from '@/components/dashboard/stats/RecentOrdersTable'
import { PeriodFilterNav } from '@/components/dashboard/stats/PeriodFilterNav'
import { StatsCharts } from '@/components/dashboard/stats/StatsCharts'
import { getDashboardStats } from '@/lib/actions/stats'
import { TIME_PERIODS, type TimePeriod } from '@/types/stats'
import { DollarSign, ShoppingCart, TrendingUp, Package } from 'lucide-react'
import { formatPrice } from '@/lib/utils/format'
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

const VALID_PERIODS = new Set<string>([TIME_PERIODS.TODAY, TIME_PERIODS.WEEK, TIME_PERIODS.MONTH])

interface PageProps {
    searchParams: Promise<{period?: string}>
}

export default async function StatsPage({ searchParams }: PageProps) {
    const { period: rawPeriod } = await searchParams
    const period: TimePeriod = VALID_PERIODS.has(rawPeriod ?? '') ? (rawPeriod as TimePeriod) : TIME_PERIODS.TODAY

    const stats = await getDashboardStats(period)

    if (!stats) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <p className="text-zinc-500">Erreur lors du chargement des statistiques</p>
            </div>
        )
    }

    return (
        <>
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
                                <BreadcrumbPage>Statistiques</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </div>
                </div>
            </header>

            <div className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Statistiques</h1>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                            Analysez les performances de votre structure
                        </p>
                    </div>
                    <Suspense>
                        <PeriodFilterNav value={period} />
                    </Suspense>
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

                <StatsCharts
                    dailySales={stats.dailySales}
                    topProducts={stats.topProducts}
                    categorySales={stats.categorySales}
                    stockAlerts={stats.stockAlerts}
                />

                <RecentOrdersTable data={stats.recentOrders} />
            </div>
        </>
    )
}
