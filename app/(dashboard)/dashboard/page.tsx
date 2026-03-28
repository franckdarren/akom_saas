// app/(dashboard)/dashboard/page.tsx
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { getUserRole } from '@/lib/actions/auth'
import { getDashboardStats } from '@/lib/actions/stats'
import { getLabels } from '@/lib/config/activity-labels'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { KpiCard } from '@/components/stats/kpi-card'
import { StockAlertsCard } from '@/components/stats/stock-alerts-card'
import { RecentOrdersCard } from '@/components/stats/recent-orders-card'
import { DashboardPeriodSelector } from '@/components/stats/DashboardPeriodSelector'
import { DollarSign, ShoppingCart, TrendingUp, Users } from 'lucide-react'
import { TIME_PERIODS, type TimePeriod, type CustomPeriod } from '@/types/stats'
import { FinancialOverview } from './_components/FinancialOverview'
import { DashboardCharts } from './_components/DashboardCharts'

const VALID_PERIODS = new Set<string>([
    TIME_PERIODS.TODAY,
    TIME_PERIODS.WEEK,
    TIME_PERIODS.MONTH,
    TIME_PERIODS.CUSTOM,
])

interface PageProps {
    searchParams: Promise<{ period?: string; from?: string; to?: string }>
}

export default async function DashboardPage({ searchParams }: PageProps) {
    const { period: rawPeriod, from, to } = await searchParams

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const [role, restaurantUser] = await Promise.all([
        getUserRole(),
        prisma.restaurantUser.findFirst({
            where: { userId: user.id },
            include: { restaurant: { select: { activityType: true } } },
        }),
    ])

    if (role === 'superadmin') redirect('/superadmin')
    if (!restaurantUser) redirect('/onboarding')

    const labels = getLabels(restaurantUser.restaurant.activityType)

    if (role === 'kitchen') {
        return (
            <>
                <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <div className="flex justify-between w-full">
                        <h1 className="text-sm font-medium my-auto">Interface Cuisine</h1>
                    </div>
                </header>
                <div className="flex flex-1 flex-col gap-4 p-4">
                    <p className="text-muted-foreground">
                        Consultez l&apos;écran des {labels.orderNamePlural} pour gérer les préparations en temps réel.
                    </p>
                </div>
            </>
        )
    }

    const period: TimePeriod = VALID_PERIODS.has(rawPeriod ?? '') ? (rawPeriod as TimePeriod) : TIME_PERIODS.WEEK

    let customPeriod: CustomPeriod | undefined
    if (period === TIME_PERIODS.CUSTOM && from && to) {
        const startDate = new Date(from)
        const endDate = new Date(to)
        if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
            customPeriod = { startDate, endDate }
        }
    }

    const effectivePeriod: TimePeriod =
        period === TIME_PERIODS.CUSTOM && !customPeriod ? TIME_PERIODS.WEEK : period

    const stats = await getDashboardStats(effectivePeriod, customPeriod)

    return (
        <>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <div className="flex justify-between w-full items-center">
                    <h1 className="text-sm font-medium">Tableau de bord</h1>
                    <Suspense>
                        <DashboardPeriodSelector value={effectivePeriod} />
                    </Suspense>
                </div>
            </header>

            <div className="flex flex-1 flex-col gap-4 sm:gap-6 p-3 sm:p-4 md:p-6 overflow-auto">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <KpiCard
                        title="Chiffre d'affaires"
                        value={stats.revenue.total}
                        format="currency"
                        trend={{
                            value: stats.revenue.percentChange,
                            isPositive: stats.revenue.percentChange >= 0,
                        }}
                        icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
                    />
                    <KpiCard
                        title={`${labels.orderNameCapital}s totales`}
                        value={stats.orders.total}
                        format="number"
                        description={`${stats.revenue.ordersCount} livrées`}
                        icon={<ShoppingCart className="h-4 w-4 text-muted-foreground" />}
                    />
                    <KpiCard
                        title={`Panier moyen / ${labels.orderName}`}
                        value={stats.orders.averageOrderValue}
                        format="currency"
                        icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
                    />
                    <KpiCard
                        title={`${labels.orderNameCapital}s actives`}
                        value={stats.orders.pending + stats.orders.preparing + stats.orders.ready}
                        format="number"
                        description={`${stats.orders.pending} en attente`}
                        icon={<Users className="h-4 w-4 text-muted-foreground" />}
                    />
                </div>

                {stats.financial && (
                    <FinancialOverview stats={stats.financial} title="Aperçu caisse" />
                )}

                <DashboardCharts
                    dailySales={stats.dailySales}
                    orders={stats.orders}
                    categorySales={stats.categorySales}
                    topProducts={stats.topProducts}
                />

                <div className="grid gap-4 md:grid-cols-2">
                    <StockAlertsCard data={stats.stockAlerts} />
                    <RecentOrdersCard data={stats.recentOrders} />
                </div>
            </div>
        </>
    )
}
