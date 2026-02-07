'use client'

import { redirect } from "next/navigation"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { getUserRole } from "@/lib/actions/auth"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { KpiCard } from "@/components/stats/kpi-card"
import { RevenueChart } from "@/components/stats/revenue-chart"
import { CategorySalesChart } from "@/components/stats/category-sales-chart"
import { TopProductsChart } from "@/components/stats/top-products-chart"
import { OrdersDistributionChart } from "@/components/stats/orders-distribution-chart"
import { StockAlertsCard } from "@/components/stats/stock-alerts-card"
import { RecentOrdersCard } from "@/components/stats/recent-orders-card"
import { PeriodSelector } from "@/components/stats/period-selector"
import { getDashboardStats } from "@/lib/actions/stats"
import { DollarSign, ShoppingCart, TrendingUp, Users } from "lucide-react"
import type { DashboardStats, TimePeriod } from "@/types/stats"

export default function DashboardPage() {
    const [userRole, setUserRole] = useState<string | null>(null)
    const [userEmail, setUserEmail] = useState<string>("")
    const [period, setPeriod] = useState<TimePeriod>('week')
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [loading, setLoading] = useState(true)

    // Charger les données initiales
    useEffect(() => {
        async function loadInitialData() {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                redirect("/login")
                return
            }

            setUserEmail(user.email || "")

            const role = await getUserRole()
            setUserRole(role)

            // Si SuperAdmin, rediriger
            if (role === "superadmin") {
                redirect("/superadmin")
                return
            }

            // Charger les stats uniquement pour admin
            if (role === "admin") {
                loadStats()
            } else {
                setLoading(false)
            }
        }

        loadInitialData()
    }, [])

    // Charger les stats quand la période change
    useEffect(() => {
        if (userRole === "admin") {
            loadStats()
        }
    }, [period, userRole])

    async function loadStats() {
        setLoading(true)
        try {
            const data = await getDashboardStats(period)
            setStats(data)
        } catch (error) {
            console.error("Erreur chargement stats:", error)
        } finally {
            setLoading(false)
        }
    }

    // Interface pour le rôle Kitchen (simplifiée)
    if (userRole === "kitchen") {
        return (
            <>
                <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <div className="flex justify-between w-full">
                        <h1 className="text-sm font-medium my-auto">Interface Cuisine</h1>
                        <div className="text-right leading-tight text-sm">
                            <p className="truncate font-medium">Cuisine</p>
                            <p className="text-muted-foreground truncate text-xs">{userEmail}</p>
                        </div>
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

    // Interface complète pour Admin
    return (
        <>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <div className="flex justify-between w-full items-center">
                    <h1 className="text-sm font-medium hidden sm:flex">Tableau de bord</h1>
                    <div className="flex items-center gap-4">
                        <PeriodSelector value={period} onValueChange={setPeriod} />
                        <div className="text-right leading-tight text-sm">
                            <p className="truncate font-medium">Administrateur</p>
                            <p className="text-muted-foreground truncate text-xs">{userEmail}</p>
                        </div>
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
                        {/* KPIs en haut */}
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <KpiCard
                                title="Chiffre d'affaires"
                                value={stats.revenue.total}
                                format="currency"
                                trend={{
                                    value: stats.revenue.percentChange,
                                    isPositive: stats.revenue.percentChange >= 0
                                }}
                                icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
                            />
                            <KpiCard
                                title="Commandes totales"
                                value={stats.orders.total}
                                format="number"
                                description={`${stats.revenue.ordersCount} livrées`}
                                icon={<ShoppingCart className="h-4 w-4 text-muted-foreground" />}
                            />
                            <KpiCard
                                title="Panier moyen"
                                value={stats.orders.averageOrderValue}
                                format="currency"
                                icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
                            />
                            <KpiCard
                                title="Commandes actives"
                                value={stats.orders.pending + stats.orders.preparing + stats.orders.ready}
                                format="number"
                                description={`${stats.orders.pending} en attente`}
                                icon={<Users className="h-4 w-4 text-muted-foreground" />}
                            />
                        </div>

                        {/* Graphiques principaux */}
                        <div className="grid gap-4 md:grid-cols-2">
                            <RevenueChart data={stats.dailySales} />
                            <OrdersDistributionChart data={stats.orders} />
                        </div>

                        {/* Ventes par catégorie et top produits */}
                        <div className="grid gap-4 md:grid-cols-2">
                            <CategorySalesChart data={stats.categorySales} />
                            <TopProductsChart data={stats.topProducts} />
                        </div>

                        {/* Alertes et commandes récentes */}
                        <div className="grid gap-4 md:grid-cols-2">
                            <StockAlertsCard data={stats.stockAlerts} />
                            <RecentOrdersCard data={stats.recentOrders} />
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