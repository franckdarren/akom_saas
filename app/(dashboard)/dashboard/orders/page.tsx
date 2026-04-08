// app/(dashboard)/dashboard/orders/page.tsx
'use client'

import {useOrdersRealtime} from '@/lib/hooks/use-orders-realtime'
import {OrderCard} from '@/components/kitchen/OrderCard'
import {OrderFilters} from '@/components/kitchen/OrderFilters'
import {NotificationSound} from '@/components/kitchen/NotificationSound'
import {
    Breadcrumb,
    BreadcrumbList,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbSeparator,
    BreadcrumbPage,
} from '@/components/ui/breadcrumb'
import {Separator} from '@/components/ui/separator'
import {SidebarTrigger} from '@/components/ui/sidebar'
import {AppCard, CardContent} from '@/components/ui/app-card'
import {useAuth} from '@/lib/hooks/use-auth'
import {useRestaurant} from '@/lib/hooks/use-restaurant'
import {getLabels} from '@/lib/config/activity-labels' // ← NOUVEAU
import {PageHeader} from '@/components/ui/page-header'

export default function OrdersPage() {
    const {user} = useAuth()
    const {currentRole, currentRestaurant} = useRestaurant()

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

            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1"/>
                <Separator orientation="vertical" className="mr-2 h-4"/>
                <div className="flex justify-between w-full">
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
                </div>
            </header>

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
                    onFilterChange={setStatusFilter}
                    counts={counts}
                />

                {orders.length === 0 ? (
                    <AppCard>
                        <CardContent className="layout-empty-state">
                            <p className="text-muted-foreground text-center">
                                {statusFilter === 'all'
                                    ? `Aucune ${labels.orderName} pour le moment`
                                    : `Aucune ${labels.orderName} ${
                                        statusFilter === 'pending' ? 'en attente'
                                            : statusFilter === 'preparing' ? 'en préparation'
                                                : statusFilter === 'ready' ? 'prête'
                                                    : statusFilter === 'delivered' ? 'servie'
                                                        : 'annulée'
                                    }`}
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