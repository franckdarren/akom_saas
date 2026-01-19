// components/orders/OrderTracker.tsx
'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
    Clock,
    ChefHat,
    CheckCircle2,
    Package,
    Phone,
    ArrowLeft,
    RefreshCw,
    XCircle,
    ShoppingCart,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { formatPrice, formatDate } from '@/lib/utils/format'
import { toast } from 'sonner'

type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled'

interface OrderItem {
    id: string
    product_name: string
    quantity: number
    unit_price: number
}

interface Order {
    id: string
    order_number: string
    status: OrderStatus
    total_amount: number
    customer_name: string | null
    created_at: string
    order_items: OrderItem[]
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

const ORDER_STEPS = [
    { status: 'pending' as OrderStatus, label: 'Commande reçue', icon: Clock },
    { status: 'preparing' as OrderStatus, label: 'En préparation', icon: ChefHat },
    { status: 'ready' as OrderStatus, label: 'Prête', icon: CheckCircle2 },
    { status: 'delivered' as OrderStatus, label: 'Servie', icon: Package },
]

export function OrderTracker({ order: initialOrder, restaurant, table }: OrderTrackerProps) {
    const router = useRouter()
    const [order, setOrder] = useState(initialOrder)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [errorCount, setErrorCount] = useState(0)
    const [showCancelDialog, setShowCancelDialog] = useState(false)
    const [isCancelling, setIsCancelling] = useState(false)

    // Construction des URLs contextuelles à partir du contexte reçu
    const menuUrl = `/r/${restaurant.slug}/t/${table.number}`
    const currentOrderUrl = `/r/${restaurant.slug}/t/${table.number}/orders/${order.id}`

    // Calculer si la commande peut être annulée
    // Règle métier : annulation possible uniquement si statut "pending" ET moins de 2 minutes écoulées
    const createdAtDate = new Date(order.created_at)
    const minutesSinceCreation = (Date.now() - createdAtDate.getTime()) / 1000 / 60
    const canCancel = order.status === 'pending' && minutesSinceCreation < 2

    // Polling automatique pour mettre à jour le statut
    // Ce système vérifie régulièrement si le statut de la commande a changé
    useEffect(() => {
        const fetchStatus = async () => {
            try {
                setIsRefreshing(true)
                
                const response = await fetch(`/api/orders/${order.id}`, {
                    cache: 'no-store',
                    headers: { 'Content-Type': 'application/json' },
                })

                if (!response.ok) {
                    setErrorCount(prev => prev + 1)
                    
                    // Arrêter le polling après trop d'erreurs consécutives
                    if (errorCount > 5) {
                        toast.error('Erreur de connexion', {
                            description: 'Impossible de mettre à jour le statut. Veuillez rafraîchir la page.',
                        })
                    }
                    return
                }

                const data = await response.json()

                // Mettre à jour uniquement si le statut a changé
                if (data.order && data.order.status !== order.status) {
                    setOrder(data.order)
                    setErrorCount(0)
                    
                    toast.success('Statut mis à jour', {
                        description: ORDER_STEPS.find(s => s.status === data.order.status)?.label || data.order.status,
                    })
                }
            } catch (error) {
                setErrorCount(prev => prev + 1)
            } finally {
                setIsRefreshing(false)
            }
        }

        // Premier appel après 10 secondes, puis tous les 12 secondes
        const initialTimeout = setTimeout(fetchStatus, 10000)
        const interval = setInterval(fetchStatus, 12000)

        return () => {
            clearTimeout(initialTimeout)
            clearInterval(interval)
        }
    }, [order.id, order.status, errorCount])

    // Rafraîchissement manuel
    const handleRefresh = async () => {
        setIsRefreshing(true)
        try {
            const response = await fetch(`/api/orders/${order.id}`)
            if (response.ok) {
                const data = await response.json()
                if (data.order) {
                    setOrder(data.order)
                    setErrorCount(0)
                    toast.success('Statut actualisé')
                }
            }
        } catch (error) {
            toast.error('Erreur de connexion')
        } finally {
            setIsRefreshing(false)
        }
    }

    // Fonction d'annulation de commande
    const handleCancelOrder = async () => {
        setIsCancelling(true)

        try {
            const response = await fetch(`/api/orders/${order.id}/cancel`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || 'Impossible d\'annuler la commande')
            }

            setOrder(prev => ({ ...prev, status: 'cancelled' }))
            
            toast.success('Commande annulée', {
                description: 'Votre commande a été annulée avec succès',
            })

            setShowCancelDialog(false)

            // Redirection après 2 secondes
            setTimeout(() => {
                router.push(menuUrl)
            }, 2000)
            
        } catch (error: any) {
            toast.error('Erreur', {
                description: error.message || 'Impossible d\'annuler. Elle est peut-être déjà en préparation.',
            })
        } finally {
            setIsCancelling(false)
        }
    }

    // Déterminer l'index de l'étape actuelle
    const currentStepIndex = ORDER_STEPS.findIndex((step) => step.status === order.status)

    // Déterminer le bouton de navigation à afficher
    const getNavigationButton = () => {
        if (order.status === 'delivered') {
            return {
                href: menuUrl,
                label: 'Nouvelle commande',
                icon: ShoppingCart,
                variant: 'default' as const,
            }
        }

        if (order.status === 'cancelled') {
            return {
                href: menuUrl,
                label: 'Retour au menu',
                icon: ArrowLeft,
                variant: 'outline' as const,
            }
        }

        return {
            href: menuUrl,
            label: 'Retour au menu',
            icon: ArrowLeft,
            variant: 'ghost' as const,
        }
    }

    const navigationButton = getNavigationButton()
    const NavIcon = navigationButton.icon

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-900">
            {/* Header */}
            <div className="bg-white dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 sticky top-0 z-10">
                <div className="max-w-2xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <Link href={navigationButton.href}>
                            <Button variant={navigationButton.variant} size="sm" className="gap-2">
                                <NavIcon className="h-4 w-4" />
                                {navigationButton.label}
                            </Button>
                        </Link>

                        <div className="flex items-center gap-3">
                            {process.env.NODE_ENV === 'development' && (
                                <div className="text-xs space-y-1">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${
                                            isRefreshing ? 'bg-blue-500 animate-pulse' : 'bg-green-500'
                                        }`} />
                                        <span className="text-muted-foreground">
                                            {isRefreshing ? 'Actualisation...' : 'Actif'}
                                        </span>
                                    </div>
                                    {errorCount > 0 && (
                                        <div className="text-red-500">Erreurs: {errorCount}</div>
                                    )}
                                </div>
                            )}

                            <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={handleRefresh}
                                disabled={isRefreshing}
                                title="Actualiser le statut"
                            >
                                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                            </Button>

                            {restaurant.logo_url && (
                                <img 
                                    src={restaurant.logo_url} 
                                    alt={restaurant.name} 
                                    className="h-8 rounded"
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
                {/* Informations principales */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-2xl">
                                    Commande {order.order_number}
                                </CardTitle>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {restaurant.name} • Table {table.number}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {formatDate(createdAtDate)}
                                </p>
                            </div>

                            <Badge
                                variant={
                                    order.status === 'delivered' ? 'success' :
                                    order.status === 'cancelled' ? 'destructive' : 'default'
                                }
                                className="text-sm"
                            >
                                {order.status === 'cancelled' 
                                    ? 'Annulée' 
                                    : ORDER_STEPS.find((s) => s.status === order.status)?.label || order.status}
                            </Badge>
                        </div>

                        {/* Boutons d'action */}
                        {order.status !== 'cancelled' && order.status !== 'delivered' && (
                            <div className="flex gap-2 mt-4">
                                <Link href={menuUrl} className="flex-1">
                                    <Button variant="outline" className="w-full gap-2">
                                        <ShoppingCart className="h-4 w-4" />
                                        Ajouter des produits
                                    </Button>
                                </Link>

                                {canCancel && (
                                    <Button
                                        variant="destructive"
                                        onClick={() => setShowCancelDialog(true)}
                                        className="gap-2"
                                        disabled={isCancelling}
                                    >
                                        <XCircle className="h-4 w-4" />
                                        Annuler
                                    </Button>
                                )}
                            </div>
                        )}

                        {order.status === 'pending' && !canCancel && (
                            <p className="text-xs text-muted-foreground mt-2">
                                L'annulation n'est plus possible après 2 minutes
                            </p>
                        )}
                    </CardHeader>
                </Card>

                {/* Timeline */}
                {order.status !== 'cancelled' && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Suivi de votre commande</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {ORDER_STEPS.map((step, index) => {
                                    const Icon = step.icon
                                    const isCompleted = index <= currentStepIndex
                                    const isCurrent = index === currentStepIndex

                                    return (
                                        <div key={step.status} className="flex items-start gap-4">
                                            <div className="relative">
                                                <div
                                                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
                                                        isCompleted
                                                            ? 'bg-primary text-white scale-110'
                                                            : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-400'
                                                    } ${isCurrent ? 'ring-4 ring-primary/20' : ''}`}
                                                >
                                                    <Icon className="h-5 w-5" />
                                                </div>

                                                {index < ORDER_STEPS.length - 1 && (
                                                    <div
                                                        className={`absolute left-5 top-10 w-0.5 h-8 transition-all duration-500 ${
                                                            isCompleted
                                                                ? 'bg-primary'
                                                                : 'bg-zinc-200 dark:bg-zinc-700'
                                                        }`}
                                                    />
                                                )}
                                            </div>

                                            <div className="flex-1 pt-2">
                                                <p
                                                    className={`font-medium transition-colors duration-300 ${
                                                        isCurrent ? 'text-primary' :
                                                        isCompleted ? 'text-zinc-900 dark:text-zinc-100' :
                                                        'text-zinc-400'
                                                    }`}
                                                >
                                                    {step.label}
                                                </p>
                                                {isCurrent && (
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        En cours...
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Message d'annulation */}
                {order.status === 'cancelled' && (
                    <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
                        <CardContent className="p-6 text-center">
                            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
                            <h3 className="font-semibold text-lg mb-2">Commande annulée</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Cette commande a été annulée. Vous pouvez passer une nouvelle commande si vous le souhaitez.
                            </p>
                            <Link href={menuUrl}>
                                <Button>
                                    <ShoppingCart className="h-4 w-4 mr-2" />
                                    Nouvelle commande
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                )}

                {/* Liste des articles */}
                <Card>
                    <CardHeader>
                        <CardTitle>Articles ({order.order_items.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {order.order_items.map((item) => (
                            <div key={item.id} className="flex items-center gap-3">
                                <div className="relative w-16 h-16 rounded-lg bg-zinc-100 dark:bg-zinc-800 overflow-hidden shrink-0">
                                    <div className="w-full h-full flex items-center justify-center">
                                        <Package className="h-6 w-6 text-zinc-400" />
                                    </div>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{item.product_name}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {item.quantity} x {formatPrice(item.unit_price)}
                                    </p>
                                </div>

                                <p className="font-semibold shrink-0">
                                    {formatPrice(item.unit_price * item.quantity)}
                                </p>
                            </div>
                        ))}

                        <div className="border-t pt-3 mt-3 flex justify-between items-center">
                            <span className="font-semibold text-lg">Total</span>
                            <span className="font-bold text-xl text-primary">
                                {formatPrice(order.total_amount)}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                {/* Contact */}
                {restaurant.phone && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Besoin d'aide ?</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-3">
                                Notre équipe est à votre disposition pour toute question
                            </p>
                            <a href={`tel:${restaurant.phone}`}>
                                <Button variant="outline" className="w-full gap-2">
                                    <Phone className="h-4 w-4" />
                                    Appeler {restaurant.name}
                                </Button>
                            </a>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Dialog d'annulation */}
            <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Annuler la commande ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Êtes-vous sûr de vouloir annuler cette commande ? 
                            Cette action est irréversible et la commande sera définitivement annulée.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isCancelling}>
                            Non, garder la commande
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleCancelOrder}
                            disabled={isCancelling}
                            className="bg-red-500 hover:bg-red-600"
                        >
                            {isCancelling ? 'Annulation...' : 'Oui, annuler'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}