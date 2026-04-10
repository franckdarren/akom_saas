'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, ChevronRight, Package, Loader2 } from 'lucide-react'
import { getActiveOrdersForTable } from '@/lib/actions/order'
import { Alert, AlertDescription } from '@/components/ui/alert'

// Définir un type local correspondant à l'enum Prisma
type OrderStatus = 'awaiting_payment' | 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled'

interface ActiveOrder {
    id: string
    orderNumber: string | null
    status: OrderStatus
    totalAmount: number
    createdAt: Date
}

interface ActiveOrdersBannerProps {
    tableId: string
    tableNumber: number
    restaurantSlug: string
    restaurantId: string
}

// Classes Tailwind câblées sur les tokens CSS du design system.
// awaiting_payment utilise --status-awaiting-payment-* (violet).
const STATUS_CLASSES: Record<OrderStatus, string> = {
    awaiting_payment:
        'bg-status-awaiting-payment-subtle border-status-awaiting-payment/40 text-status-awaiting-payment',
    pending:
        'bg-status-pending/10 border-status-pending/40 text-status-pending-fg',
    preparing:
        'bg-status-preparing/10 border-status-preparing/40 text-status-preparing-fg',
    ready:
        'bg-status-ready/10 border-status-ready/40 text-status-ready-fg',
    delivered:
        'bg-muted border-border text-muted-foreground',
    cancelled:
        'bg-status-cancelled/10 border-status-cancelled/40 text-status-cancelled-fg',
}

const STATUS_LABELS: Record<OrderStatus, string> = {
    awaiting_payment: 'Attente paiement',
    pending: 'En attente',
    preparing: 'En préparation',
    ready: 'Prête',
    delivered: 'Servie',
    cancelled: 'Annulée',
}

/**
 * Bandeau informatif affichant les commandes actives d'une table.
 * Permet au client de voir rapidement s'il a déjà commandé et d'accéder au tracking.
 */
export function ActiveOrdersBanner({ tableId, tableNumber, restaurantSlug, restaurantId }: ActiveOrdersBannerProps) {
    const router = useRouter()
    const [orders, setOrders] = useState<ActiveOrder[]>([])
    const [isInitialLoading, setIsInitialLoading] = useState(true)
    const [navigatingToOrderId, setNavigatingToOrderId] = useState<string | null>(null)

    useEffect(() => {
        loadActiveOrders(true)
        const intervalId = setInterval(() => loadActiveOrders(false), 10000)
        return () => clearInterval(intervalId)
    }, [tableId])

    async function loadActiveOrders(isInitial = false) {
        if (isInitial) setIsInitialLoading(true)
        const activeOrders = await getActiveOrdersForTable(tableId, restaurantId)
        setOrders(activeOrders)
        if (isInitial) setIsInitialLoading(false)
    }

    function handleOrderClick(orderId: string) {
        setNavigatingToOrderId(orderId)
        router.push(`/r/${restaurantSlug}/t/${tableNumber}/orders/${orderId}`)
    }

    if (isInitialLoading || orders.length === 0) return null

    return (
        <div className="space-y-2 mb-6">
            {orders.map((order) => {
                const isNavigating = navigatingToOrderId === order.id

                return (
                    <button
                        key={order.id}
                        onClick={() => handleOrderClick(order.id)}
                        disabled={isNavigating}
                        className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all hover:shadow-md disabled:opacity-75 disabled:cursor-wait ${STATUS_CLASSES[order.status]}`}
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/50 dark:bg-black/20">
                                {isNavigating
                                    ? <Loader2 className="w-5 h-5 animate-spin" />
                                    : <Package className="w-5 h-5" />
                                }
                            </div>
                            <div className="text-left">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold">
                                        Commande {order.orderNumber || `#${order.id.slice(0, 8)}`}
                                    </span>
                                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/50 dark:bg-black/20">
                                        {STATUS_LABELS[order.status]}
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
                <Alert variant="info">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        Vous avez {orders.length} commandes actives. Vous pouvez passer une nouvelle
                        commande qui sera traitée séparément.
                    </AlertDescription>
                </Alert>
            )}
        </div>
    )
}
