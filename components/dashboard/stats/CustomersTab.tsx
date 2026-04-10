'use client'

// components/dashboard/stats/CustomersTab.tsx

import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'
import { AppCard, CardContent, CardHeader, CardTitle } from '@/components/ui/app-card'
import { TopCustomersTable } from './TopCustomersTable'
import { Users, UserCheck, UserPlus, ArrowUp, ArrowDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CustomerAnalytics } from '@/types/stats'

const CustomerRetentionChart = dynamic(
    () =>
        import('./CustomerRetentionChart').then((m) => ({ default: m.CustomerRetentionChart })),
    { ssr: false, loading: () => <Skeleton className="h-[280px] w-full rounded-xl" /> },
)

interface CustomersTabProps {
    analytics: CustomerAnalytics
}

function computePercentChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0
    return Math.round(((current - previous) / previous) * 1000) / 10
}

export function CustomersTab({ analytics }: CustomersTabProps) {
    const {
        identifiedCustomers,
        newCustomers,
        returningCustomers,
        anonymousOrders,
        avgOrdersPerCustomer,
        topCustomers,
        previousIdentifiedCustomers,
    } = analytics

    const customersChange = computePercentChange(identifiedCustomers, previousIdentifiedCustomers)
    const customersUp = customersChange > 0

    return (
        <div className="layout-sections">
            {/* KPIs */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Clients identifiés avec trend N-1 */}
                <AppCard variant="stat">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="type-description">Clients identifiés</CardTitle>
                        <div className="p-2 rounded-lg bg-info-subtle text-info">
                            <Users className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{identifiedCustomers}</div>
                        <div className="mt-1 flex items-center gap-1 type-caption">
                            {customersChange === 0 ? (
                                <span className="flex items-center gap-0.5 text-muted-foreground">
                                    <Minus className="h-3 w-3" />
                                    Aucune variation
                                </span>
                            ) : (
                                <span className={cn(
                                    'flex items-center gap-0.5 font-medium',
                                    customersUp ? 'text-success' : 'text-destructive',
                                )}>
                                    {customersUp ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                                    {customersUp ? '+' : ''}{customersChange}%
                                </span>
                            )}
                            <span className="text-muted-foreground">vs période préc.</span>
                        </div>
                    </CardContent>
                </AppCard>

                {/* Nouveaux clients */}
                <AppCard variant="stat">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="type-description">Nouveaux clients</CardTitle>
                        <div className="p-2 rounded-lg bg-info-subtle text-info">
                            <UserPlus className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{newCustomers}</div>
                        <p className="mt-1 type-caption text-muted-foreground">
                            {identifiedCustomers > 0
                                ? `${Math.round((newCustomers / identifiedCustomers) * 100)}% des clients`
                                : 'Première commande ce mois'}
                        </p>
                    </CardContent>
                </AppCard>

                {/* Clients récurrents */}
                <AppCard variant="stat">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="type-description">Clients récurrents</CardTitle>
                        <div className="p-2 rounded-lg bg-success-subtle text-success">
                            <UserCheck className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{returningCustomers}</div>
                        <p className="mt-1 type-caption text-muted-foreground">
                            {identifiedCustomers > 0
                                ? `${Math.round((returningCustomers / identifiedCustomers) * 100)}% de fidélisation`
                                : 'Aucun récurrent détecté'}
                        </p>
                    </CardContent>
                </AppCard>

                {/* Moy. commandes + commandes anonymes */}
                <AppCard variant="stat">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="type-description">Moy. commandes / client</CardTitle>
                        <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                            <Users className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {identifiedCustomers > 0 ? avgOrdersPerCustomer : '—'}
                        </div>
                        <p className="mt-1 type-caption text-muted-foreground">
                            {anonymousOrders > 0
                                ? `+ ${anonymousOrders} commande${anonymousOrders > 1 ? 's' : ''} anonyme${anonymousOrders > 1 ? 's' : ''}`
                                : 'Toutes commandes identifiées'}
                        </p>
                    </CardContent>
                </AppCard>
            </div>

            {/* Rétention + Top clients */}
            <div className="grid gap-6 md:grid-cols-2">
                <CustomerRetentionChart
                    newCustomers={newCustomers}
                    returningCustomers={returningCustomers}
                    identifiedCustomers={identifiedCustomers}
                />
                <TopCustomersTable customers={topCustomers} />
            </div>
        </div>
    )
}
