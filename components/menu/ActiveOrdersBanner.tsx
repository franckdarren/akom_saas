'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AlertCircle, ChevronRight, Package } from 'lucide-react'
import { getActiveOrdersForTable } from '@/lib/actions/order'
import type { OrderStatus } from '@/app/generated/prisma/client'

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
}

/**
 * Bandeau informatif affichant les commandes actives d'une table
 * Permet au client de voir rapidement s'il a déjà commandé et d'accéder au tracking
 */
export function ActiveOrdersBanner({ tableId, tableNumber, restaurantSlug }: ActiveOrdersBannerProps) {
    const [orders, setOrders] = useState<ActiveOrder[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadActiveOrders()
        
        // Polling : recharger les commandes toutes les 10 secondes
        const intervalId = setInterval(() => {
            loadActiveOrders()
        }, 10000) // 10000ms = 10 secondes

        // Nettoyer l'intervalle quand le composant est démonté
        return () => clearInterval(intervalId)
    }, [tableId])

    async function loadActiveOrders() {
        setLoading(true)
        const activeOrders = await getActiveOrdersForTable(tableId)
        setOrders(activeOrders)
        setLoading(false)
    }

    // Ne rien afficher si pas de commandes actives
    if (loading || orders.length === 0) {
        return null
    }

    // Fonction pour traduire le statut en français
    const getStatusLabel = (status: OrderStatus) => {
        const labels: Record<OrderStatus, string> = {
            pending: 'En attente',
            preparing: 'En préparation',
            ready: 'Prête',
            delivered: 'Servie',
            cancelled: 'Annulée',
        }
        return labels[status]
    }

    // Fonction pour obtenir la couleur selon le statut
    const getStatusColor = (status: OrderStatus) => {
        const colors: Record<OrderStatus, string> = {
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
            {orders.map((order) => (
                <Link
                    key={order.id}
                    href={`/r/${restaurantSlug}/t/${tableNumber}/orders/${order.id}`}
                    className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all hover:shadow-md ${getStatusColor(order.status)}`}
                >
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/50 dark:bg-black/20">
                            <Package className="w-5 h-5" />
                        </div>
                        <div>
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
                    <ChevronRight className="w-5 h-5 opacity-50" />
                </Link>
            ))}

            {/* Message informatif si plusieurs commandes */}
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