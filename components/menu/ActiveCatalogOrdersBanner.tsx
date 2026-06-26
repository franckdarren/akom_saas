'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, ChevronRight, Package, Loader2 } from 'lucide-react'
import { getActiveCatalogOrders } from '@/lib/actions/order'
import { getCatalogOrderIds, removeCatalogOrders } from '@/lib/utils/catalog-orders-storage'
import { getLabels, type OrderStatusKey } from '@/lib/config/activity-labels'

type OrderStatus = 'awaiting_payment' | 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled'

interface ActiveOrder {
    id: string
    orderNumber: string | null
    status: OrderStatus
    totalAmount: number
    createdAt: Date
}

interface ActiveCatalogOrdersBannerProps {
    restaurantSlug: string
    restaurantId: string
    activityType?: string | null
}

/**
 * Bandeau affichant les commandes catalogue actives du client.
 * Utilise le localStorage pour retrouver les commandes passées
 * depuis ce navigateur, puis vérifie leur statut en base.
 */
export function ActiveCatalogOrdersBanner({ restaurantSlug, restaurantId, activityType }: ActiveCatalogOrdersBannerProps) {
    const router = useRouter()
    const [orders, setOrders] = useState<ActiveOrder[]>([])
    const [isInitialLoading, setIsInitialLoading] = useState(true)
    const [navigatingToOrderId, setNavigatingToOrderId] = useState<string | null>(null)

    useEffect(() => {
        loadActiveOrders(true)
        const intervalId = setInterval(() => loadActiveOrders(false), 10000)
        return () => clearInterval(intervalId)
    }, [restaurantSlug, restaurantId])

    async function loadActiveOrders(isInitial = false) {
        if (isInitial) setIsInitialLoading(true)

        const storedIds = getCatalogOrderIds(restaurantSlug)
        if (storedIds.length === 0) {
            setOrders([])
            if (isInitial) setIsInitialLoading(false)
            return
        }

        const activeOrders = await getActiveCatalogOrders(storedIds, restaurantId)
        setOrders(activeOrders)

        // Nettoyer du localStorage les commandes qui ne sont plus actives
        const activeIds = new Set(activeOrders.map((o) => o.id))
        const finishedIds = storedIds.filter((id) => !activeIds.has(id))
        if (finishedIds.length > 0) {
            removeCatalogOrders(restaurantSlug, finishedIds)
        }

        if (isInitial) setIsInitialLoading(false)
    }

    function handleOrderClick(orderId: string) {
        setNavigatingToOrderId(orderId)
        router.push(`/r/${restaurantSlug}/orders/${orderId}`)
    }

    if (isInitialLoading || orders.length === 0) return null

    const labels = getLabels(activityType)
    const orderStatuses = labels.orderStatuses
    const getStatusLabel = (status: OrderStatus) => {
        return orderStatuses[status as OrderStatusKey].label
    }

    const getStatusColor = (status: OrderStatus) => {
        const colors: Record<OrderStatus, string> = {
            awaiting_payment: 'bg-status-awaiting-payment-subtle border-status-awaiting-payment text-status-awaiting-payment',
            pending: 'bg-warning-subtle border-warning text-warning',
            preparing: 'bg-info-subtle border-info text-info',
            ready: 'bg-success-subtle border-success text-success',
            delivered: 'bg-muted border-border text-muted-foreground',
            cancelled: 'bg-destructive-subtle border-destructive text-destructive',
        }
        return colors[status]
    }

    return (
        <div className="space-y-2 mb-6">
            {orders.map((order) => {
                const isNavigating = navigatingToOrderId === order.id

                return (
                    <button
                        key={order.id}
                        onClick={() => handleOrderClick(order.id)}
                        disabled={isNavigating}
                        className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all hover:shadow-md disabled:opacity-75 disabled:cursor-wait ${getStatusColor(order.status)}`}
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/50 dark:bg-black/20">
                                {isNavigating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Package className="w-5 h-5" />}
                            </div>
                            <div className="text-left">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold">
                                        Commande {order.orderNumber || `#${order.id.slice(0, 8)}`}
                                    </span>
                                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/50 dark:bg-black/20">
                                        {getStatusLabel(order.status)}
                                    </span>
                                </div>
                                <p className="text-sm opacity-90">
                                    {new Intl.NumberFormat('fr-FR', {
                                        style: 'currency',
                                        currency: 'XAF',
                                        minimumFractionDigits: 0,
                                    }).format(order.totalAmount)}
                                </p>
                            </div>
                        </div>
                        <ChevronRight className={`w-5 h-5 opacity-50 transition-transform ${isNavigating ? 'translate-x-1' : ''}`} />
                    </button>
                )
            })}

            {orders.length > 1 && (
                <div className="flex items-start gap-2 p-3 bg-info-subtle border border-info rounded-lg text-info">
                    <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <p className="text-sm">
                        Vous avez {orders.length} {labels.orderNamePlural} {labels.orderGender === 'f' ? 'actives' : 'actifs'}. Vous pouvez passer {labels.orderGender === 'f' ? 'une nouvelle' : 'un nouveau'} {labels.orderName} qui sera traité{labels.orderGender === 'f' ? 'e' : ''} séparément.
                    </p>
                </div>
            )}
        </div>
    )
}
