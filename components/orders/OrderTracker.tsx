// components/orders/OrderTracking.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Clock, CheckCircle, Package, UtensilsCrossed } from 'lucide-react'
import { formatPrice } from '@/lib/utils/format'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Order {
    id: string
    order_number: string
    status: 'pending' | 'preparing' | 'ready' | 'delivered'
    total_amount: number
    customer_name: string | null
    created_at: string
    updated_at: string
    order_items: Array<{
        id: string
        product_name: string
        quantity: number
        unit_price: number
    }>
}

interface OrderTrackingProps {
    order: Order
    restaurant: {
        slug: string
        name: string
        logo_url: string | null
        phone: string | null
    }
    table: {
        number: number
    }
}

const STATUS_CONFIG = {
    pending: {
        label: 'En attente',
        description: 'Votre commande a été reçue',
        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
        icon: Clock
    },
    preparing: {
        label: 'En préparation',
        description: 'La cuisine prépare votre commande',
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        icon: UtensilsCrossed
    },
    ready: {
        label: 'Prête',
        description: 'Votre commande est prête à être servie',
        color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        icon: CheckCircle
    },
    delivered: {
        label: 'Servie',
        description: 'Bon appétit !',
        color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
        icon: Package
    }
}

export function OrderTracker({ order: initialOrder, restaurant, table }: OrderTrackingProps) {
    const [order, setOrder] = useState(initialOrder)
    const [isConnected, setIsConnected] = useState(false)
    const router = useRouter()

    // ✅ NOUVEAU : Construire l'URL du menu pour le bouton "Retour"
    const menuUrl = `/r/${restaurant.slug}/t/${table.number}`

    useEffect(() => {
        // Créer le client Supabase pour les mises à jour temps réel
        const supabase = createClient()

        console.log('📡 [TRACKING] Initialisation temps réel pour commande:', order.id)

        // S'abonner aux changements de statut de cette commande
        const channel = supabase
            .channel(`order-tracking-${order.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'orders',
                    filter: `id=eq.${order.id}`
                },
                (payload) => {
                    console.log('🔄 [TRACKING] Mise à jour reçue:', payload.new.status)
                    setOrder((prev) => ({
                        ...prev,
                        status: payload.new.status,
                        updated_at: payload.new.updated_at
                    }))
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('✅ [TRACKING] Connecté au temps réel')
                    setIsConnected(true)
                } else if (status === 'CHANNEL_ERROR') {
                    console.error('❌ [TRACKING] Erreur de connexion temps réel')
                    setIsConnected(false)
                }
            })

        return () => {
            console.log('🔌 [TRACKING] Déconnexion du temps réel')
            supabase.removeChannel(channel)
        }
    }, [order.id])

    const statusConfig = STATUS_CONFIG[order.status]
    const StatusIcon = statusConfig.icon

    // Calculer le temps écoulé depuis la création
    const createdAt = new Date(order.created_at)
    const timeAgo = formatDistanceToNow(createdAt, { addSuffix: true, locale: fr })

    // Vérifier si la commande peut être annulée (moins de 2 minutes et statut pending)
    const canCancel = order.status === 'pending' && 
        (Date.now() - createdAt.getTime()) < 2 * 60 * 1000

    return (
        <div className="container max-w-2xl mx-auto p-4 space-y-6">
            {/* Header avec navigation */}
            <div className="flex items-center justify-between">
                <Link href={menuUrl}>
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Retour au menu
                    </Button>
                </Link>
                
                {isConnected && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        Mises à jour en temps réel
                    </div>
                )}
            </div>

            {/* Carte principale */}
            <Card>
                <CardHeader>
                    <div className="space-y-3">
                        <div className="flex items-start justify-between">
                            <div>
                                <CardTitle className="text-2xl">
                                    Commande {order.order_number}
                                </CardTitle>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {restaurant.name} • Table {table.number}
                                </p>
                            </div>
                            <Badge className={statusConfig.color}>
                                <StatusIcon className="h-4 w-4 mr-1" />
                                {statusConfig.label}
                            </Badge>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>Commandé {timeAgo}</span>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Statut actuel avec description */}
                    <div className="bg-muted/50 rounded-lg p-4">
                        <p className="text-center text-lg font-medium">
                            {statusConfig.description}
                        </p>
                    </div>

                    {/* Timeline du statut */}
                    <div>
                        <h3 className="font-medium mb-4">Progression de la commande</h3>
                        <div className="space-y-3">
                            {Object.entries(STATUS_CONFIG).map(([key, config], index) => {
                                const isCompleted = 
                                    key === 'pending' ? true :
                                    key === 'preparing' ? ['preparing', 'ready', 'delivered'].includes(order.status) :
                                    key === 'ready' ? ['ready', 'delivered'].includes(order.status) :
                                    order.status === 'delivered'
                                
                                const isActive = order.status === key
                                const Icon = config.icon

                                return (
                                    <StatusStep
                                        key={key}
                                        label={config.label}
                                        icon={Icon}
                                        completed={isCompleted}
                                        active={isActive}
                                    />
                                )
                            })}
                        </div>
                    </div>

                    {/* Liste des articles */}
                    <div>
                        <h3 className="font-medium mb-3">Articles commandés</h3>
                        <div className="space-y-2">
                            {order.order_items.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-center justify-between py-3 border-b last:border-0"
                                >
                                    <div className="flex-1">
                                        <p className="font-medium">{item.product_name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            Quantité : {item.quantity}
                                        </p>
                                    </div>
                                    <p className="font-medium">
                                        {formatPrice(item.unit_price * item.quantity)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Total */}
                    <div className="flex items-center justify-between pt-4 border-t">
                        <span className="text-lg font-semibold">Total</span>
                        <span className="text-lg font-semibold">
                            {formatPrice(order.total_amount)}
                        </span>
                    </div>

                    {/* Bouton d'annulation (si applicable) */}
                    {canCancel && (
                        <div className="pt-4 border-t">
                            <p className="text-sm text-muted-foreground mb-3">
                                Vous pouvez annuler votre commande dans les 2 minutes suivant sa création.
                            </p>
                            <Button
                                variant="destructive"
                                className="w-full"
                                onClick={() => {
                                    // TODO: Implémenter l'annulation (V2)
                                    alert('Fonction d\'annulation à venir')
                                }}
                            >
                                Annuler la commande
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Card d'actions supplémentaires */}
            <Card>
                <CardContent className="pt-6 space-y-3">
                    <Link href={menuUrl} className="block">
                        <Button variant="outline" className="w-full">
                            Passer une nouvelle commande
                        </Button>
                    </Link>
                </CardContent>
            </Card>
        </div>
    )
}

function StatusStep({
    label,
    icon: Icon,
    completed,
    active
}: {
    label: string
    icon: any
    completed: boolean
    active: boolean
}) {
    return (
        <div className="flex items-center gap-3">
            <div
                className={`
                    w-10 h-10 rounded-full border-2 flex items-center justify-center shrink-0
                    ${completed 
                        ? 'bg-primary border-primary text-primary-foreground' 
                        : 'border-muted-foreground/30 text-muted-foreground'
                    }
                    ${active ? 'ring-4 ring-primary/20 scale-110' : ''}
                    transition-all duration-300
                `}
            >
                <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1">
                <span className={`font-medium ${active ? 'text-primary' : completed ? '' : 'text-muted-foreground'}`}>
                    {label}
                </span>
            </div>
        </div>
    )
}