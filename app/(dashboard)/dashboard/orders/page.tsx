// app/(dashboard)/dashboard/orders/page.tsx
'use client'

import {useTransition} from 'react'
import {useOrdersRealtime} from '@/lib/hooks/use-orders-realtime'
import {OrderCard} from '@/components/kitchen/OrderCard'
import {OrderFilters} from '@/components/kitchen/OrderFilters'
import {Skeleton} from '@/components/ui/skeleton'
import {NotificationSound} from '@/components/kitchen/NotificationSound'
import {
    Breadcrumb,
    BreadcrumbList,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbSeparator,
    BreadcrumbPage,
} from '@/components/ui/breadcrumb'
import {AppCard, CardContent} from '@/components/ui/app-card'
import {AppInsetHeader} from '@/components/layout/AppInsetHeader'
import {useRestaurant} from '@/lib/hooks/use-restaurant'
import {getLabels} from '@/lib/config/activity-labels' // ← NOUVEAU
import {PageHeader} from '@/components/ui/page-header'

export default function OrdersPage() {
    const {currentRestaurant} = useRestaurant()
    const [isPending, startTransition] = useTransition()

    // ← Labels depuis le restaurant courant (client-side)
    const labels = getLabels(currentRestaurant?.activityType)

    const {
        orders,
        allOrders,
        loading,
        pendingCount,
        statusFilter,
        setStatusFilter,
    } = useOrdersRealtime()

    function handleFilterChange(filter: Parameters<typeof setStatusFilter>[0]) {
        startTransition(() => {
            setStatusFilter(filter)
        })
    }

    const counts = {
        all: allOrders.filter((o) => o.status !== 'awaiting_payment').length,
        pending: allOrders.filter((o) => o.status === 'pending').length,
        preparing: allOrders.filter((o) => o.status === 'preparing').length,
        ready: allOrders.filter((o) => o.status === 'ready').length,
        delivered: allOrders.filter((o) => o.status === 'delivered').length,
        cancelled: allOrders.filter((o) => o.status === 'cancelled').length,
    }

    return (
        <>
            <NotificationSound shouldPlay={pendingCount > 0}/>

            <AppInsetHeader>
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/dashboard">Opérations</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator/>
                        <BreadcrumbItem>
                            {/* ← Label dynamique */}
                            <BreadcrumbPage>{labels.orderNameCapital}s</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </AppInsetHeader>

            <div className="layout-page">
                <PageHeader
                    title={`${labels.orderNameCapital}s`}
                    description={`Gérez les ${labels.orderNamePlural} en temps réel`}
                    action={pendingCount > 0 ? (
                        <AppCard className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse"/>
                                    <span className="font-semibold text-red-900 dark:text-red-100">
                                        {pendingCount} nouvelle
                                        {pendingCount > 1 ? 's' : ''}{' '}
                                        {labels.orderName}
                                        {pendingCount > 1 ? 's' : ''}
                                    </span>
                                </div>
                            </CardContent>
                        </AppCard>
                    ) : undefined}
                />

                <OrderFilters
                    activeFilter={statusFilter}
                    onFilterChange={handleFilterChange}
                    counts={counts}
                />

                {isPending || loading ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {Array.from({length: 6}).map((_, i) => (
                            <Skeleton key={i} className="h-48 rounded-xl"/>
                        ))}
                    </div>
                ) : orders.length === 0 ? (
                    <AppCard>
                        <CardContent className="layout-empty-state">
                            <p className="text-muted-foreground text-center">
                                {statusFilter === 'all'
                                    ? `Aucune ${labels.orderName} pour le moment`
                                    : `Aucune ${labels.orderName} — ${labels.orderStatuses[statusFilter as keyof typeof labels.orderStatuses].label.toLowerCase()}`
                                }
                            </p>
                        </CardContent>
                    </AppCard>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {orders.map((order) => (
                            <OrderCard key={order.id} order={order}/>
                        ))}
                    </div>
                )}
            </div>
        </>
    )
}