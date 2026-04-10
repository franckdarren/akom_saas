// app/(dashboard)/dashboard/stats/page.tsx
import { Suspense } from 'react'
import { TabsContent } from '@/components/ui/tabs'
import { StatsCard } from '@/components/dashboard/stats/StatsCard'
import { RecentOrdersTable } from '@/components/dashboard/stats/RecentOrdersTable'
import { StatsCharts } from '@/components/dashboard/stats/StatsCharts'
import { StatsPageTabs } from '@/components/dashboard/stats/StatsPageTabs'
import { FinancesTab } from '@/components/dashboard/stats/FinancesTab'
import { OrdersTab } from '@/components/dashboard/stats/OrdersTab'
import { CashTab } from '@/components/dashboard/stats/CashTab'
import { ProductsTab } from '@/components/dashboard/stats/ProductsTab'
import { CustomersTab } from '@/components/dashboard/stats/CustomersTab'
import { getDashboardStats } from '@/lib/actions/stats'
import { getOrderAnalytics } from '@/lib/actions/stats/order-analytics'
import { getPaymentAnalytics } from '@/lib/actions/stats/payment-analytics'
import { getPerformanceAnalytics } from '@/lib/actions/stats/performance-analytics'
import { getCashAnalytics } from '@/lib/actions/stats/cash-analytics'
import { getProductAnalytics } from '@/lib/actions/stats/product-analytics'
import { getCustomerAnalytics } from '@/lib/actions/stats/customer-analytics'
import { TIME_PERIODS, type TimePeriod, type CustomPeriod } from '@/types/stats'
import { DollarSign, ShoppingCart, TrendingUp, Package } from 'lucide-react'
import { formatPrice } from '@/lib/utils/format'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { PageHeader } from '@/components/ui/page-header'
import { DashboardPeriodSelector } from '@/components/stats/DashboardPeriodSelector'

const VALID_PERIODS = new Set<string>([
    TIME_PERIODS.TODAY,
    TIME_PERIODS.WEEK,
    TIME_PERIODS.MONTH,
    TIME_PERIODS.CUSTOM,
])

const VALID_TABS = new Set(['overview', 'finances', 'orders', 'products', 'cash', 'customers'])

interface PageProps {
    searchParams: Promise<{ period?: string; from?: string; to?: string; tab?: string }>
}

export default async function StatsPage({ searchParams }: PageProps) {
    const { period: rawPeriod, from, to, tab: rawTab } = await searchParams

    const period: TimePeriod = VALID_PERIODS.has(rawPeriod ?? '')
        ? (rawPeriod as TimePeriod)
        : TIME_PERIODS.TODAY

    const customPeriod: CustomPeriod | undefined =
        period === TIME_PERIODS.CUSTOM && from && to
            ? { startDate: new Date(from), endDate: new Date(to) }
            : undefined

    const activeTab = VALID_TABS.has(rawTab ?? '') ? (rawTab as string) : 'overview'

    const [stats, orderAnalytics, paymentAnalytics, performanceAnalytics, cashAnalytics, productAnalytics, customerAnalytics] =
        await Promise.all([
            getDashboardStats(period, customPeriod),
            activeTab === 'orders' ? getOrderAnalytics(period, customPeriod) : null,
            activeTab === 'finances' ? getPaymentAnalytics(period, customPeriod) : null,
            activeTab === 'orders' ? getPerformanceAnalytics(period, customPeriod) : null,
            activeTab === 'cash' ? getCashAnalytics(period, customPeriod) : null,
            activeTab === 'products' ? getProductAnalytics(period, customPeriod) : null,
            activeTab === 'customers' ? getCustomerAnalytics(period, customPeriod) : null,
        ])

    if (!stats) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <p className="text-muted-foreground">Erreur lors du chargement des statistiques</p>
            </div>
        )
    }

    return (
        <>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <div className="flex justify-between w-full">
                    <div className="my-auto">
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

            <div className="layout-page">
                <PageHeader
                    title="Statistiques"
                    description="Analysez les performances de votre structure"
                    action={
                        <Suspense>
                            <DashboardPeriodSelector value={period} />
                        </Suspense>
                    }
                />

                <Suspense>
                    <StatsPageTabs activeTab={activeTab}>
                        {/* ——— Vue d'ensemble ——— */}
                        <TabsContent value="overview">
                            <div className="layout-sections pt-2">
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                    <StatsCard
                                        title="Chiffre d'affaires"
                                        value={formatPrice(stats.revenue.total)}
                                        icon={<DollarSign className="h-4 w-4" />}
                                        variant="success"
                                        trend={{
                                            value: stats.revenue.percentChange,
                                            isPositive: stats.revenue.percentChange >= 0,
                                        }}
                                    />
                                    <StatsCard
                                        title="Commandes"
                                        value={stats.orders.total}
                                        icon={<ShoppingCart className="h-4 w-4" />}
                                        variant="default"
                                        description={`${stats.orders.delivered} livrées`}
                                    />
                                    <StatsCard
                                        title="Panier moyen"
                                        value={formatPrice(stats.orders.averageOrderValue)}
                                        icon={<TrendingUp className="h-4 w-4" />}
                                        variant="default"
                                    />
                                    <StatsCard
                                        title="Alertes stock"
                                        value={stats.stockAlerts.length}
                                        icon={<Package className="h-4 w-4" />}
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
                        </TabsContent>

                        {/* ——— Finances ——— */}
                        <TabsContent value="finances">
                            <div className="pt-2">
                                {stats.financial ? (
                                    <FinancesTab
                                        financial={stats.financial}
                                        paymentAnalytics={paymentAnalytics}
                                    />
                                ) : (
                                    <div className="layout-empty-state">
                                        <p className="type-body-muted">
                                            Aucune donnée financière disponible pour cette période
                                        </p>
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        {/* ——— Commandes ——— */}
                        <TabsContent value="orders">
                            <div className="pt-2">
                                {orderAnalytics ? (
                                    <OrdersTab
                                        analytics={orderAnalytics}
                                        performance={performanceAnalytics}
                                    />
                                ) : (
                                    <div className="layout-empty-state">
                                        <p className="type-body-muted">
                                            Aucune donnée de commande disponible pour cette période
                                        </p>
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        {/* ——— Produits & Stock ——— */}
                        <TabsContent value="products">
                            <div className="pt-2">
                                {productAnalytics ? (
                                    <ProductsTab analytics={productAnalytics} />
                                ) : (
                                    <div className="layout-empty-state">
                                        <p className="type-body-muted">
                                            Aucune donnée produit disponible pour cette période
                                        </p>
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        {/* ——— Caisse & Équipe ——— */}
                        <TabsContent value="cash">
                            <div className="pt-2">
                                {cashAnalytics ? (
                                    <CashTab analytics={cashAnalytics} />
                                ) : (
                                    <div className="layout-empty-state">
                                        <p className="type-body-muted">
                                            Aucune donnée de caisse disponible pour cette période
                                        </p>
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        {/* ——— Clients ——— */}
                        <TabsContent value="customers">
                            <div className="pt-2">
                                {customerAnalytics ? (
                                    <CustomersTab analytics={customerAnalytics} />
                                ) : (
                                    <div className="layout-empty-state">
                                        <p className="type-body-muted">
                                            Aucune donnée client disponible pour cette période
                                        </p>
                                    </div>
                                )}
                            </div>
                        </TabsContent>
                    </StatsPageTabs>
                </Suspense>
            </div>
        </>
    )
}
