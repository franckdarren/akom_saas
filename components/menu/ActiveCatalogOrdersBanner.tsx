'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, ChevronRight, Package, Loader2 } from 'lucide-react'
import { getActiveCatalogOrders } from '@/lib/actions/order'
import { getCatalogOrderIds, removeCatalogOrders } from '@/lib/utils/catalog-orders-storage'

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
}

/**
 * Bandeau affichant les commandes catalogue actives du client.
 * Utilise le localStorage pour retrouver les commandes passées
 * depuis ce navigateur, puis vérifie leur statut en base.
 */
export function ActiveCatalogOrdersBanner({ restaurantSlug, restaurantId }: ActiveCatalogOrdersBannerProps) {
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

    const getStatusLabel = (status: OrderStatus) => {
        const labels: Record<OrderStatus, string> = {
            awaiting_payment: 'Attente paiement',
            pending: 'En attente',
            preparing: 'En préparation',
            ready: 'Prête',
            delivered: 'Servie',
            cancelled: 'Annulée',
        }
        return labels[status]
    }

    const getStatusColor = (status: OrderStatus) => {
        const colors: Record<OrderStatus, string> = {
            awaiting_payment: 'bg-purple-50 border-purple-200 text-purple-800 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-200',
            pending: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200',
            preparing: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200',
            ready: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200',
            delivered: 'bg-gray-50 border-gray-200 text-gray-800 dark:bg-gray-900/20 dark:border-gray-800 dark:text-gray-200',
            cancelled: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200',
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
                <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200">
                    <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <p className="text-sm">
                        Vous avez {orders.length} commandes actives. Vous pouvez passer une nouvelle commande qui sera traitée séparément.
                    </p>
                </div>
            )}
        </div>
    )
}
