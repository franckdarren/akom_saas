'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRestaurant } from '@/lib/hooks/use-restaurant'
import type { Order, OrderItem, Product, Table } from '@/app/generated/prisma/client'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

export type OrderWithDetails = Order & {
    orderItems: (OrderItem & {
        product: Product
    })[]
    table: Table | null
}

export type OrderStatusFilter =
    | 'all'
    | 'pending'
    | 'preparing'
    | 'ready'
    | 'delivered'
    | 'cancelled'

export function useOrdersRealtime() {
    const { currentRestaurant } = useRestaurant()
    const [orders, setOrders] = useState<OrderWithDetails[]>([])
    const [loading, setLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState<OrderStatusFilter>('all')

    /**
     * 🔹 Chargement initial
     */
    useEffect(() => {
        if (!currentRestaurant?.id) return

        const restaurantId = currentRestaurant.id

        async function fetchOrders() {
            try {
                const response = await fetch(`/api/orders?restaurantId=${restaurantId}`)
                const data = await response.json()
                setOrders(data.orders || [])
            } catch (error) {
                console.error('Erreur chargement commandes:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchOrders()
    }, [currentRestaurant?.id])

    /**
     * 🔹 Temps réel
     */
    useEffect(() => {
        if (!currentRestaurant?.id) return

        const restaurantId = currentRestaurant.id
        const supabase = createClient()

        const channel = supabase
            .channel('orders-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'orders',
                    filter: `restaurant_id=eq.${restaurantId}`,
                },
                async (
                    payload: RealtimePostgresChangesPayload<Order>
                ) => {
                    console.log('Changement détecté:', payload)

                    // Sécurité INSERT / UPDATE
                    if (payload.eventType !== 'DELETE' && payload.new?.id) {
                        const response = await fetch(
                            `/api/orders/${payload.new.id}?restaurantId=${restaurantId}`
                        )
                        const data = await response.json()

                        if (payload.eventType === 'INSERT') {
                            setOrders((prev) => [data.order, ...prev])
                        }

                        if (payload.eventType === 'UPDATE') {
                            setOrders((prev) =>
                                prev.map((order) =>
                                    order.id === payload.new.id ? data.order : order
                                )
                            )
                        }
                    }

                    // Sécurité DELETE
                    if (payload.eventType === 'DELETE' && payload.old?.id) {
                        setOrders((prev) =>
                            prev.filter((order) => order.id !== payload.old.id)
                        )
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [currentRestaurant?.id])

    /**
     * 🔹 Filtrage & tri
     */
    const filteredOrders = orders.filter((order) => {
        if (statusFilter === 'all') return true
        return order.status === statusFilter
    })

    const statusOrder = ['pending', 'preparing', 'ready', 'delivered', 'cancelled']

    const sortedOrders = [...filteredOrders].sort((a, b) => {
        const aIndex = statusOrder.indexOf(a.status)
        const bIndex = statusOrder.indexOf(b.status)

        if (aIndex !== bIndex) return aIndex - bIndex
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    const pendingCount = orders.filter((o) => o.status === 'pending').length

    return {
        orders: sortedOrders,
        allOrders: orders,
        loading,
        pendingCount,
        statusFilter,
        setStatusFilter,
    }
}
