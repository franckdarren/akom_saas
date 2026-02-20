// app/(dashboard)/dashboard/page.tsx
'use client'

import {redirect} from 'next/navigation'
import {useEffect, useState} from 'react'
import {createClient} from '@/lib/supabase/client'
import {getUserRole} from '@/lib/actions/auth'
import {Separator} from '@/components/ui/separator'
import {SidebarTrigger} from '@/components/ui/sidebar'
import {KpiCard} from '@/components/stats/kpi-card'
import {RevenueChart} from '@/components/stats/revenue-chart'
import {CategorySalesChart} from '@/components/stats/category-sales-chart'
import {TopProductsChart} from '@/components/stats/top-products-chart'
import {OrdersDistributionChart} from '@/components/stats/orders-distribution-chart'
import {StockAlertsCard} from '@/components/stats/stock-alerts-card'
import {RecentOrdersCard} from '@/components/stats/recent-orders-card'
import {PeriodSelector} from '@/components/stats/period-selector'
import {getDashboardStats, getFinancialOverviewStats} from '@/lib/actions/stats'
import {DollarSign, ShoppingCart, TrendingUp, Users} from 'lucide-react'
import type {DashboardStats, TimePeriod, CustomPeriod} from '@/types/stats'

// On importe le TYPE uniquement pour l'état — jamais la fonction Prisma.
import type {FinancialPeriodStats} from '@/lib/stats/financial-aggregates'
// FinancialOverview ne fait que de l'affichage — pas de Prisma dedans.
import {FinancialOverview} from './_components/FinancialOverview'

export default function DashboardPage() {
    const [userRole, setUserRole] = useState<string | null>(null)
    const [userEmail, setUserEmail] = useState<string>('')
    const [period, setPeriod] = useState<TimePeriod>('week')
    const [customPeriod, setCustomPeriod] = useState<CustomPeriod | undefined>()
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [loading, setLoading] = useState(true)

    // État pour les stats financières — alimenté par la Server Action
    const [statsToday, setStatsToday] = useState<FinancialPeriodStats | null>(null)
    const [statsMonth, setStatsMonth] = useState<FinancialPeriodStats | null>(null)
    const [loadingFinancial, setLoadingFinancial] = useState(true)

    // Charger les données initiales
    useEffect(() => {
        async function loadInitialData() {
            const supabase = createClient()
            const {data: {user}} = await supabase.auth.getUser()

            if (!user) {
                redirect('/login')
                return
            }

            setUserEmail(user.email || '')

            const role = await getUserRole()
            setUserRole(role)

            if (role === 'superadmin') {
                redirect('/superadmin')
                return
            }

            if (role === 'admin') {
                // On charge les stats dashboard ET les stats financières en parallèle
                await Promise.all([
                    loadStats(),
                    loadFinancialStats(),
                ])
            } else {
                setLoading(false)
                setLoadingFinancial(false)
            }
        }

        loadInitialData()
    }, [])

    // Recharger les stats dashboard quand la période change
    useEffect(() => {
        if (userRole === 'admin') {
            loadStats()
        }
    }, [period, customPeriod, userRole])

    async function loadStats() {
        setLoading(true)
        try {
            const data = await getDashboardStats(period, customPeriod)
            setStats(data)
        } catch (error) {
            console.error('Erreur chargement stats:', error)
        } finally {
            setLoading(false)
        }
    }

    // Les stats financières (caisse) sont indépendantes de la période du dashboard.
    // Elles affichent toujours aujourd'hui et le mois en cours.
    // On les charge une seule fois à l'init, pas à chaque changement de période.
    async function loadFinancialStats() {
        setLoadingFinancial(true)
        try {
            const todayStart = new Date()
            todayStart.setHours(0, 0, 0, 0)
            const todayEnd = new Date()
            todayEnd.setHours(23, 59, 59, 999)
            const monthStart = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1)

            // Les deux appels se font en parallèle via la Server Action
            const [today, month] = await Promise.all([
                getFinancialOverviewStats(todayStart, todayEnd),
                getFinancialOverviewStats(monthStart, todayEnd),
            ])

            setStatsToday(today)
            setStatsMonth(month)
        } catch (error) {
            console.error('Erreur chargement stats financières:', error)
        } finally {
            setLoadingFinancial(false)
        }
    }

    function handlePeriodChange(newPeriod: TimePeriod, newCustomPeriod?: CustomPeriod) {
        setPeriod(newPeriod)
        setCustomPeriod(newCustomPeriod)
    }

    // Interface simplifiée pour la cuisine
    if (userRole === 'kitchen') {
        return (
            <>
                <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                    <SidebarTrigger className="-ml-1"/>
                    <Separator orientation="vertical" className="mr-2 h-4"/>
                    <div className="flex justify-between w-full">
                        <h1 className="text-sm font-medium my-auto">Interface Cuisine</h1>
                    </div>
                </header>
                <div className="flex flex-1 flex-col gap-4 p-4">
                    <p className="text-muted-foreground">
                        Consultez l'écran des commandes pour gérer les préparations en temps réel.
                    </p>
                </div>
            </>
        )
    }

    return (
        <>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1"/>
                <Separator orientation="vertical" className="mr-2 h-4"/>
                <div className="flex justify-between w-full items-center">
                    <h1 className="text-sm font-medium">Tableau de bord</h1>
                    <div className="flex items-center gap-4">
                        <PeriodSelector
                            value={period}
                            onValueChange={handlePeriodChange}
                        />
                    </div>
                </div>
            </header>

            <div className="flex flex-1 flex-col gap-6 p-6 overflow-auto">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-muted-foreground">Chargement des statistiques...</p>
                    </div>
                ) : stats ? (
                    <>
                        {/* KPIs existants — pas de changement */}
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <KpiCard
                                title="Chiffre d'affaires"
                                value={stats.revenue.total}
                                format="currency"
                                trend={{
                                    value: stats.revenue.percentChange,
                                    isPositive: stats.revenue.percentChange >= 0,
                                }}
                                icon={<DollarSign className="h-4 w-4 text-muted-foreground"/>}
                            />
                            <KpiCard
                                title="Commandes totales"
                                value={stats.orders.total}
                                format="number"
                                description={`${stats.revenue.ordersCount} livrées`}
                                icon={<ShoppingCart className="h-4 w-4 text-muted-foreground"/>}
                            />
                            <KpiCard
                                title="Panier moyen"
                                value={stats.orders.averageOrderValue}
                                format="currency"
                                icon={<TrendingUp className="h-4 w-4 text-muted-foreground"/>}
                            />
                            <KpiCard
                                title="Commandes actives"
                                value={stats.orders.pending + stats.orders.preparing + stats.orders.ready}
                                format="number"
                                description={`${stats.orders.pending} en attente`}
                                icon={<Users className="h-4 w-4 text-muted-foreground"/>}
                            />
                        </div>

                        {/* Bloc financier caisse — s'affiche seulement quand les données sont prêtes */}
                        {!loadingFinancial && (
                            <div className="grid gap-4 md:grid-cols-2">
                                {statsToday && (
                                    <FinancialOverview
                                        stats={statsToday}
                                        title="Aperçu financier du jour"
                                    />
                                )}
                                {statsMonth && (
                                    <FinancialOverview
                                        stats={statsMonth}
                                        title="Ce mois-ci"
                                    />
                                )}
                            </div>
                        )}

                        {/* Graphiques principaux */}
                        <div className="grid gap-4 md:grid-cols-2">
                            <RevenueChart data={stats.dailySales}/>
                            <OrdersDistributionChart data={stats.orders}/>
                        </div>

                        {/* Ventes par catégorie et top produits */}
                        <div className="grid gap-4 md:grid-cols-2">
                            <CategorySalesChart data={stats.categorySales}/>
                            <TopProductsChart data={stats.topProducts}/>
                        </div>

                        {/* Alertes et commandes récentes */}
                        <div className="grid gap-4 md:grid-cols-2">
                            <StockAlertsCard data={stats.stockAlerts}/>
                            <RecentOrdersCard data={stats.recentOrders}/>
                        </div>
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-muted-foreground">Aucune donnée disponible</p>
                    </div>
                )}
            </div>
        </>
    )
}