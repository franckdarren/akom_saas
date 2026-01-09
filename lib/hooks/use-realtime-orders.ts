// lib/hooks/use-realtime-orders.ts
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface Order {
    id: string
    orderNumber: string | null
    status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
    totalAmount: number
    createdAt: Date
    table: {
        number: number
    } | null
    orderItems: Array<{
        id: string
        productName: string
        quantity: number
        unitPrice: number
        product: {
            name: string
            imageUrl: string | null
        }
    }>
}

export function useRealtimeOrders(restaurantId: string) {
    const [orders, setOrders] = useState<Order[]>([])
    const [newOrderIds, setNewOrderIds] = useState<Set<string>>(new Set())
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const supabase = createClient()
        let channel: RealtimeChannel

        async function setupRealtimeSubscription() {
            try {
                // Récupérer les commandes initiales
                const { data: initialOrders, error: fetchError } = await supabase
                    .from('orders')
                    .select(`
                        id,
                        orderNumber:order_number,
                        status,
                        totalAmount:total_amount,
                        createdAt:created_at,
                        table:tables(number),
                        orderItems:order_items(
                            id,
                            productName:product_name,
                            quantity,
                            unitPrice:unit_price,
                            product:products(
                                name,
                                imageUrl:image_url
                            )
                        )
                    `)
                    .eq('restaurant_id', restaurantId)
                    .in('status', ['pending', 'preparing', 'ready'])
                    .order('created_at', { ascending: false })

                if (fetchError) throw fetchError

                // Transformer les données pour matcher le type Order
                const transformedOrders = (initialOrders || []).map((order: any) => ({
                    ...order,
                    table: order.table?.[0] || null,
                    orderItems: (order.orderItems || []).map((item: any) => ({
                        ...item,
                        product: item.product?.[0] || { name: item.productName, imageUrl: null }
                    }))
                }))

                setOrders(transformedOrders)
                setLoading(false)

                // S'abonner aux changements en temps réel
                channel = supabase
                    .channel(`orders:${restaurantId}`)
                    .on(
                        'postgres_changes',
                        {
                            event: 'INSERT',
                            schema: 'public',
                            table: 'orders',
                            filter: `restaurant_id=eq.${restaurantId}`,
                        },
                        async (payload) => {
                            // Récupérer la commande complète avec relations
                            const { data: newOrder } = await supabase
                                .from('orders')
                                .select(`
                                    id,
                                    orderNumber:order_number,
                                    status,
                                    totalAmount:total_amount,
                                    createdAt:created_at,
                                    table:tables(number),
                                    orderItems:order_items(
                                        id,
                                        productName:product_name,
                                        quantity,
                                        unitPrice:unit_price,
                                        product:products(
                                            name,
                                            imageUrl:image_url
                                        )
                                    )
                                `)
                                .eq('id', payload.new.id)
                                .single()

                            if (newOrder) {
                                // Transformer les données
                                const transformedOrder = {
                                    ...newOrder,
                                    table: newOrder.table?.[0] || null,
                                    orderItems: (newOrder.orderItems || []).map((item: any) => ({
                                        ...item,
                                        product: item.product?.[0] || { name: item.productName, imageUrl: null }
                                    }))
                                }
                                
                                setOrders((prev) => [transformedOrder, ...prev])
                                // Marquer comme nouvelle commande (pour le son)
                                setNewOrderIds((prev) => new Set(prev).add(transformedOrder.id))
                            }
                        }
                    )
                    .on(
                        'postgres_changes',
                        {
                            event: 'UPDATE',
                            schema: 'public',
                            table: 'orders',
                            filter: `restaurant_id=eq.${restaurantId}`,
                        },
                        (payload) => {
                            setOrders((prev) =>
                                prev.map((order) =>
                                    order.id === payload.new.id
                                        ? { ...order, status: payload.new.status }
                                        : order
                                )
                            )

                            // Si la commande passe à delivered ou cancelled, la retirer de la liste
                            if (
                                payload.new.status === 'delivered' ||
                                payload.new.status === 'cancelled'
                            ) {
                                setOrders((prev) =>
                                    prev.filter((order) => order.id !== payload.new.id)
                                )
                            }
                        }
                    )
                    .subscribe()
            } catch (err) {
                console.error('Erreur realtime:', err)
                setError('Impossible de charger les commandes')
                setLoading(false)
            }
        }

        setupRealtimeSubscription()

        // Cleanup
        return () => {
            if (channel) {
                supabase.removeChannel(channel)
            }
        }
    }, [restaurantId])

    // Fonction pour marquer une commande comme "prise en charge"
    const acknowledgeOrder = (orderId: string) => {
        setNewOrderIds((prev) => {
            const newSet = new Set(prev)
            newSet.delete(orderId)
            return newSet
        })
    }

    return {
        orders,
        newOrderIds, // IDs des commandes qui doivent jouer le son
        loading,
        error,
        acknowledgeOrder, // Fonction pour stopper le son
    }
}