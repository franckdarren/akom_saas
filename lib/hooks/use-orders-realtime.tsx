// lib/hooks/use-orders-realtime.tsx
'use client'

import {useEffect, useState, useCallback, useMemo, useRef} from 'react'
import {createClient} from '@/lib/supabase/client'
import {useRestaurant} from '@/lib/hooks/use-restaurant'

export type OrderStatus =
    | 'awaiting_payment'
    | 'pending'
    | 'preparing'
    | 'ready'
    | 'delivered'
    | 'cancelled'


export type OrderStatusFilter =
    | 'awaiting_payment'
    | 'pending'
    | 'preparing'
    | 'ready'
    | 'delivered'
    | 'cancelled'
    | 'all'

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'
export type PaymentMethod = 'cash' | 'mobile_money' | 'airtel_money' | 'moov_money' | 'card'

export interface OrderPayment {
    id: string
    status: PaymentStatus
    method: PaymentMethod
}

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
    payments: OrderPayment[]
    customerName?: string
    notes?: string
}

export function useOrdersRealtime() {
    const supabase = createClient()
    const {currentRestaurant} = useRestaurant()

    const [allOrders, setAllOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all')

    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

    /**
     * SOURCE DE VÉRITÉ = API
     */
    const fetchOrders = useCallback(async () => {
        if (!currentRestaurant?.id) return

        try {
            const res = await fetch(
                `/api/orders?restaurantId=${currentRestaurant.id}`,
                {cache: 'no-store'}
            )

            // ✅ Vérifier que la réponse est JSON avant d'appeler res.json()
            const text = await res.text()

            if (!text) {
                console.warn('⚠️ /api/orders returned empty response')
                setAllOrders([])
                return
            }

            let data: { orders?: Order[] } = {}
            try {
                data = JSON.parse(text)
            } catch (err) {
                console.error('Erreur parse JSON /api/orders:', err, text)
                setAllOrders([])
                return
            }

            if (data?.orders) {
                setAllOrders(data.orders)
            } else {
                setAllOrders([])
            }
        } catch (e) {
            console.error('Erreur fetch orders:', e)
            setAllOrders([])
        } finally {
            setLoading(false)
        }
    }, [currentRestaurant?.id])

    /**
     * Chargement initial
     */
    useEffect(() => {
        fetchOrders()
    }, [fetchOrders])

    /**
     * ⚡ REALTIME via Supabase
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
     * POLLING INTELLIGENT
     * Refetch toutes les 3 secondes s'il y a des commandes actives
     */
    useEffect(() => {
        // Vérifier s'il y a des commandes actives (pas delivered, cancelled, ni awaiting_payment)
        const hasActiveOrders = allOrders.some(
            (order) => !['delivered', 'cancelled', 'awaiting_payment'].includes(order.status)
        )

        // Si commandes actives → polling
        if (hasActiveOrders) {
            console.log('🔄 Polling activé (commandes actives)')
            pollingIntervalRef.current = setInterval(() => {
                fetchOrders()
            }, 3000) // Refetch toutes les 3 secondes
        } else {
            console.log('⏸️ Polling désactivé (aucune commande active)')
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current)
                pollingIntervalRef.current = null
            }
        }

        // Cleanup
        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current)
            }
        }
    }, [allOrders, fetchOrders])

    /**
     * Filtrage
     */
    const orders = useMemo(() => {
        // Par défaut ('all'), masquer les commandes en attente de paiement
        if (statusFilter === 'all') return allOrders.filter((o) => o.status !== 'awaiting_payment')
        return allOrders.filter((o) => o.status === statusFilter)
    }, [allOrders, statusFilter])

    /**
     * Pending count
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
        refetch: fetchOrders,
    }
}