// components/orders/OrderTracker.tsx
'use client'

import { useEffect, useState } from 'react'
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

interface OrderTrackerProps {
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

export function OrderTracker({ order: initialOrder, restaurant, table }: OrderTrackerProps) {
    // État local pour stocker les données de la commande
    // On initialise avec les données reçues du serveur (initialOrder)
    // et on va mettre à jour cet état quand des changements arrivent en temps réel
    const [order, setOrder] = useState(initialOrder)

    // État pour suivre si la connexion WebSocket est active
    // Cela permet d'afficher un indicateur visuel au client
    const [isConnected, setIsConnected] = useState(false)

    // L'URL pour revenir au menu
    // On la construit une fois ici pour éviter de la recalculer à chaque render
    const menuUrl = `/r/${restaurant.slug}/t/${table.number}`

    useEffect(() => {
        // Créer le client Supabase pour établir la connexion temps réel
        // IMPORTANT : On doit utiliser le client navigateur (createClient)
        // et non le client serveur, car seul le navigateur peut maintenir
        // une connexion WebSocket persistante
        const supabase = createClient()

        console.log('============================================')
        console.log('📡 [REALTIME] Initialisation de la connexion')
        console.log('📦 [REALTIME] Commande:', order.id)
        console.log('📦 [REALTIME] Statut initial:', order.status)
        console.log('============================================')

        // Créer un canal Supabase Realtime
        // Le nom du canal doit être unique par commande pour éviter les conflits
        // Si plusieurs clients regardent la même commande, ils partagent ce canal
        const channel = supabase
            .channel(`order-tracking-${order.id}`)

            // S'abonner aux changements sur la table 'orders'
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',           // On écoute uniquement les mises à jour
                    schema: 'public',          // Le schéma PostgreSQL (toujours 'public' par défaut)
                    table: 'orders',           // La table à surveiller
                    filter: `id=eq.${order.id}` // CRUCIAL : On filtre pour n'écouter que CETTE commande
                },
                (payload) => {
                    // Cette fonction est appelée chaque fois que la commande change
                    console.log('🔄 [REALTIME] Mise à jour reçue')
                    console.log('   Ancien statut:', order.status)
                    console.log('   Nouveau statut:', payload.new.status)
                    console.log('   Timestamp:', new Date().toISOString())

                    // Mettre à jour l'état local avec les nouvelles données
                    // On ne met à jour QUE les champs qui peuvent changer
                    // (status et updated_at dans notre cas)
                    setOrder((previousOrder) => ({
                        ...previousOrder,
                        status: payload.new.status,
                        updated_at: payload.new.updated_at
                    }))
                }
            )

            // S'abonner effectivement au canal
            // Cette fonction retourne une promesse qui se résout quand
            // la connexion est établie
            .subscribe((status) => {
                console.log('🔌 [REALTIME] Statut de la connexion:', status)

                if (status === 'SUBSCRIBED') {
                    console.log('✅ [REALTIME] Connecté avec succès au temps réel')
                    setIsConnected(true)
                } else if (status === 'CHANNEL_ERROR') {
                    console.error('❌ [REALTIME] Erreur de connexion au temps réel')
                    setIsConnected(false)
                } else if (status === 'TIMED_OUT') {
                    console.error('⏱️ [REALTIME] Timeout de connexion')
                    setIsConnected(false)
                } else if (status === 'CLOSED') {
                    console.log('🔌 [REALTIME] Connexion fermée')
                    setIsConnected(false)
                }
            })

        // Fonction de nettoyage : appelée quand le composant se démonte
        // ou quand l'effet se re-déclenche (si order.id change)
        return () => {
            console.log('🔌 [REALTIME] Fermeture de la connexion')

            // Très important : toujours nettoyer les abonnements pour éviter
            // les fuites de mémoire et les connexions orphelines
            supabase.removeChannel(channel)
        }
    }, [order.id]) // L'effet se re-déclenche uniquement si l'ID de la commande change

    // Récupérer la configuration du statut actuel
    const statusConfig = STATUS_CONFIG[order.status]
    const StatusIcon = statusConfig.icon

    // Calculer le temps écoulé depuis la création de la commande
    // Cette valeur change automatiquement grâce à React qui re-render
    // le composant périodiquement
    const createdAt = new Date(order.created_at)
    const timeAgo = formatDistanceToNow(createdAt, {
        addSuffix: true,
        locale: fr
    })

    // Déterminer si la commande peut être annulée
    // Règle métier : moins de 2 minutes après création ET statut pending
    const canCancel = order.status === 'pending' &&
        (Date.now() - createdAt.getTime()) < 2 * 60 * 1000

    // Pooling de secours toutes les 10 secondes
    // Juste au cas où le temps réel ne fonctionnerait pas
    useEffect(() => {
        // Vérifier le statut toutes les 10 secondes
        const interval = setInterval(async () => {
            try {
                const response = await fetch(`/api/orders/${order.id}`)
                const data = await response.json()

                if (data.order.status !== order.status) {
                    console.log('🔄 Nouveau statut détecté:', data.order.status)
                    setOrder(prev => ({
                        ...prev,
                        status: data.order.status,
                        updated_at: data.order.updated_at
                    }))
                }
            } catch (error) {
                console.error('Erreur lors de la vérification:', error)
            }
        }, 10000) // Toutes les 10 secondes

        return () => clearInterval(interval)
    }, [order.id, order.status])

    return (
        <div className="container max-w-2xl mx-auto p-4 space-y-6">
            {/* Header avec navigation et indicateur de connexion */}
            <div className="flex items-center justify-between">
                <Link href={menuUrl}>
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Retour au menu
                    </Button>
                </Link>

                {/* Indicateur visuel de la connexion temps réel */}
                {isConnected && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="hidden sm:inline">Mises à jour en temps réel</span>
                    </div>
                )}
            </div>

            {/* Carte principale de la commande */}
            <Card>
                <CardHeader>
                    <div className="space-y-3">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                                <CardTitle className="text-2xl truncate">
                                    Commande {order.order_number}
                                </CardTitle>
                                <p className="text-sm text-muted-foreground mt-1 truncate">
                                    {restaurant.name} • Table {table.number}
                                </p>
                            </div>
                            <Badge className={`${statusConfig.color} shrink-0`}>
                                <StatusIcon className="h-4 w-4 mr-1" />
                                {statusConfig.label}
                            </Badge>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4 shrink-0" />
                            <span>Commandé {timeAgo}</span>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Message de statut actuel */}
                    <div className="bg-muted/50 rounded-lg p-4">
                        <p className="text-center text-lg font-medium">
                            {statusConfig.description}
                        </p>
                    </div>

                    {/* Timeline de progression */}
                    <div>
                        <h3 className="font-medium mb-4">Progression de la commande</h3>
                        <div className="space-y-3">
                            {Object.entries(STATUS_CONFIG).map(([key, config]) => {
                                // Déterminer si cette étape est complétée
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

                    {/* Liste des articles commandés */}
                    <div>
                        <h3 className="font-medium mb-3">Articles commandés</h3>
                        <div className="space-y-2">
                            {order.order_items.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-center justify-between py-3 border-b last:border-0"
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{item.product_name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            Quantité : {item.quantity}
                                        </p>
                                    </div>
                                    <p className="font-medium ml-4 shrink-0">
                                        {formatPrice(item.unit_price * item.quantity)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Total de la commande */}
                    <div className="flex items-center justify-between pt-4 border-t">
                        <span className="text-lg font-semibold">Total</span>
                        <span className="text-lg font-semibold">
                            {formatPrice(order.total_amount)}
                        </span>
                    </div>

                    {/* Bouton d'annulation si applicable */}
                    {canCancel && (
                        <div className="pt-4 border-t">
                            <p className="text-sm text-muted-foreground mb-3">
                                Vous pouvez annuler votre commande dans les 2 minutes
                                suivant sa création.
                            </p>
                            <Button
                                variant="destructive"
                                className="w-full"
                                onClick={async () => {
                                    // TODO: Implémenter l'annulation
                                    try {
                                        const response = await fetch(
                                            `/api/orders/${order.id}/cancel`,
                                            { method: 'POST' }
                                        )

                                        if (response.ok) {
                                            // La mise à jour du statut sera automatique
                                            // grâce au temps réel !
                                        } else {
                                            alert('Impossible d\'annuler la commande')
                                        }
                                    } catch (error) {
                                        alert('Erreur lors de l\'annulation')
                                    }
                                }}
                            >
                                Annuler la commande
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Actions supplémentaires */}
            <Card>
                <CardContent className="pt-6">
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

/**
 * Composant pour afficher une étape de la timeline
 */
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
                <span className={`
                    font-medium 
                    ${active ? 'text-primary' : completed ? '' : 'text-muted-foreground'}
                `}>
                    {label}
                </span>
            </div>
        </div>
    )
}