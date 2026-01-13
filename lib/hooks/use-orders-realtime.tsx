// lib/hooks/use-orders-realtime.tsx
'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRestaurant } from '@/lib/hooks/use-restaurant'

export type OrderStatus =
    | 'pending'
    | 'preparing'
    | 'ready'
    | 'delivered'
    | 'cancelled'

export type OrderStatusFilter =
    | 'pending'
    | 'preparing'
    | 'ready'
    | 'delivered'
    | 'cancelled'
    | 'all'

export interface OrderItem {
    id: string
    productName: string
    quantity: number
    unitPrice: number
}

export interface Order {
    id: string
    orderNumber: string
    status: OrderStatus
    totalAmount: number
    createdAt: string
    table?: {
        number: number
    }
    orderItems: OrderItem[]
    customerName?: string
    notes?: string
}

export function useOrdersRealtime() {
    const supabase = createClient()
    const { currentRestaurant } = useRestaurant()

    const [allOrders, setAllOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all')

    /**
     * 🔄 SOURCE DE VÉRITÉ = API
     */
    const fetchOrders = useCallback(async () => {
        if (!currentRestaurant?.id) return

        try {
            const res = await fetch(
                `/api/orders?restaurantId=${currentRestaurant.id}`,
                { cache: 'no-store' }
            )

            const data = await res.json()

            if (data?.orders) {
                setAllOrders(data.orders)
            }
        } catch (e) {
            console.error('Erreur fetch orders:', e)
        } finally {
            setLoading(false)
        }
    }, [currentRestaurant?.id])

    /**
     * ⏳ Chargement initial
     */
    useEffect(() => {
        fetchOrders()
    }, [fetchOrders])

    /**
     * ⚡ REALTIME = SIGNAL UNIQUEMENT
     * Déclenche un refetch dès qu'une modification est détectée
     */
    useEffect(() => {
        if (!currentRestaurant?.id) return

        const channel = supabase
            .channel(`orders:${currentRestaurant.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'orders',
                    filter: `restaurant_id=eq.${currentRestaurant.id}`,
                },
                (payload) => {
                    console.log('📡 Realtime event:', payload.eventType)
                    // Refetch immédiatement pour avoir les données à jour
                    fetchOrders()
                }
            )
            .subscribe((status) => {
                console.log('🔌 Subscription status:', status)
            })

        return () => {
            supabase.removeChannel(channel)
        }
    }, [currentRestaurant?.id, fetchOrders, supabase])

    /**
     * 🎯 Filtrage
     */
    const orders = useMemo(() => {
        if (statusFilter === 'all') return allOrders
        return allOrders.filter((o) => o.status === statusFilter)
    }, [allOrders, statusFilter])

    /**
     * 🔔 Pending count
     */
    const pendingCount = useMemo(
        () => allOrders.filter((o) => o.status === 'pending').length,
        [allOrders]
    )

    return {
        orders,
        allOrders,
        loading,
        pendingCount,
        statusFilter,
        setStatusFilter,
        refetch: fetchOrders, // ✅ Exposer refetch pour un refresh manuel
    }
}