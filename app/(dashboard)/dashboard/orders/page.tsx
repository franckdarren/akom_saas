// app/(dashboard)/dashboard/orders/page.tsx
'use client'

import { useOrdersRealtime } from '@/lib/hooks/use-orders-realtime'
import { OrderCard } from '@/components/kitchen/OrderCard'
import { OrderFilters } from '@/components/kitchen/OrderFilters'
import { NotificationSound } from '@/components/kitchen/NotificationSound'
import {
    Breadcrumb,
    BreadcrumbList,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbSeparator,
    BreadcrumbPage,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/lib/hooks/use-auth'
import { useRestaurant } from '@/lib/hooks/use-restaurant'

export default function OrdersPage() {
    const { user } = useAuth()
    const { currentRole } = useRestaurant()
    const {
        orders,
        allOrders,
        loading,
        pendingCount,
        statusFilter,
        setStatusFilter,
    } = useOrdersRealtime()

    // Calculer les compteurs pour les filtres
    const counts = {
        all: allOrders.length,
        pending: allOrders.filter((o) => o.status === 'pending').length,
        preparing: allOrders.filter((o) => o.status === 'preparing').length,
        ready: allOrders.filter((o) => o.status === 'ready').length,
        delivered: allOrders.filter((o) => o.status === 'delivered').length,
        cancelled: allOrders.filter((o) => o.status === 'cancelled').length,
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <>
            {/* Son de notification */}
            <NotificationSound shouldPlay={pendingCount > 0} />

            {/* Header avec breadcrumb */}
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <div className="flex justify-between w-full">
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/dashboard">
                                    Tableau de bord
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Commandes</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
                <div className="border-black text-right leading-tight text-sm">
                    {currentRole === 'admin' && (
                        <p className="truncate font-medium">Administrateur</p>
                    )}
                    {currentRole === 'kitchen' && (
                        <p className="truncate font-medium">Cuisine</p>
                    )}
                    {currentRole === 'superadmin' && (
                        <p className="truncate font-medium">Super Admin</p>
                    )}
                    <p className="text-muted-foreground truncate text-xs">
                        {user?.email}
                    </p>
                </div>
            </header>

            {/* Contenu principal */}
            <div className="flex flex-1 flex-col gap-4 p-4">
                {/* En-tête avec alerte */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Commandes</h1>
                        <p className="text-muted-foreground mt-2">
                            Gérez les commandes en temps réel
                        </p>
                    </div>

                    {pendingCount > 0 && (
                        <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse" />
                                    <span className="font-semibold text-red-900 dark:text-red-100">
                                        {pendingCount} nouvelle
                                        {pendingCount > 1 ? 's' : ''} commande
                                        {pendingCount > 1 ? 's' : ''}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Filtres */}
                <OrderFilters
                    activeFilter={statusFilter}
                    onFilterChange={setStatusFilter}
                    counts={counts}
                />

                {/* Liste des commandes */}
                {orders.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <p className="text-muted-foreground text-center">
                                {statusFilter === 'all'
                                    ? 'Aucune commande pour le moment'
                                    : `Aucune commande ${statusFilter === 'pending'
                                        ? 'en attente'
                                        : statusFilter === 'preparing'
                                            ? 'en préparation'
                                            : statusFilter === 'ready'
                                                ? 'prête'
                                                : statusFilter === 'delivered'
                                                    ? 'servie'
                                                    : 'annulée'
                                    }`}
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {orders.map((order) => (
                            <OrderCard key={order.id} order={order} />
                        ))}
                    </div>
                )}
            </div>
        </>
    )
}