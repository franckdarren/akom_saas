// app/orders/[orderId]/order-tracker.tsx
'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import {
    Clock,
    ChefHat,
    CheckCircle2,
    Package,
    Phone,
    ArrowLeft,
    RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatPrice } from '@/lib/utils/format'
import { formatDate } from '@/lib/utils/format'
import Link from 'next/link'

type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled'

interface OrderItem {
    name: string
    quantity: number
    price: number
    imageUrl: string | null
}

interface OrderTrackerProps {
    orderId: string
    orderNumber: string
    restaurantName: string
    restaurantLogo: string | null
    restaurantPhone: string | null
    tableNumber: number
    status: OrderStatus
    totalAmount: number
    items: OrderItem[]
    createdAt: string
}

const ORDER_STEPS = [
    {
        status: 'pending' as OrderStatus,
        label: 'Commande reçue',
        icon: Clock,
    },
    {
        status: 'preparing' as OrderStatus,
        label: 'En préparation',
        icon: ChefHat,
    },
    {
        status: 'ready' as OrderStatus,
        label: 'Prête',
        icon: CheckCircle2,
    },
    {
        status: 'delivered' as OrderStatus,
        label: 'Servie',
        icon: Package,
    },
]

export function OrderTracker({
    orderId,
    orderNumber,
    restaurantName,
    restaurantLogo,
    restaurantPhone,
    tableNumber,
    status: initialStatus,
    totalAmount,
    items,
    createdAt,
}: OrderTrackerProps) {
    const [status, setStatus] = useState<OrderStatus>(initialStatus)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
    const [errorCount, setErrorCount] = useState(0)

    // Polling automatique
    useEffect(() => {

        const fetchStatus = async () => {
            const fetchStart = Date.now()

            try {
                setIsRefreshing(true)

                const apiUrl = `/api/orders/${orderId}`

                const response = await fetch(apiUrl, {
                    cache: 'no-store',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                })

                const fetchDuration = Date.now() - fetchStart

                if (!response.ok) {
                    const errorText = await response.text()
                    console.error('❌ [POLLING] Erreur HTTP:', {
                        status: response.status,
                        statusText: response.statusText,
                        body: errorText
                    })
                    setErrorCount(prev => prev + 1)
                    return
                }

                const data = await response.json()

                if (data.status !== status) {
                    setStatus(data.status)
                    setLastUpdate(new Date())
                    setErrorCount(0)
                } else {
                }
            } catch (error) {
                const fetchDuration = Date.now() - fetchStart
                console.error(`💥 [POLLING] Erreur après ${fetchDuration}ms:`, error)
                console.error('💥 [POLLING] Type:', error instanceof Error ? error.message : typeof error)
                setErrorCount(prev => prev + 1)
            } finally {
                setIsRefreshing(false)
            }
        }

        // Première vérification après 10 secondes
        const initialTimeout = setTimeout(() => {
            fetchStatus()
        }, 10000)

        // Puis toutes les 3 secondes
        console.log('⏰ [TRACKER] Polling configuré toutes les 12s')
        const interval = setInterval(() => {
            fetchStatus()
        }, 12000)

        return () => {
            clearTimeout(initialTimeout)
            clearInterval(interval)
        }
    }, [orderId, status, errorCount])

    // Refresh manuel
    const handleRefresh = async () => {
        setIsRefreshing(true)

        try {
            const response = await fetch(`/api/orders/${orderId}`)

            if (response.ok) {
                const data = await response.json()
                setStatus(data.status)
                setLastUpdate(new Date())
                setErrorCount(0)
            }
        } catch (error) {
            console.error('💥 [MANUAL] Erreur:', error)
        } finally {
            setIsRefreshing(false)
        }
    }

    const currentStepIndex = ORDER_STEPS.findIndex((step) => step.status === status)

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-900">
            {/* Header */}
            <div className="bg-white dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 sticky top-0 z-10">
                <div className="max-w-2xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <Link href="/">
                            <Button variant="ghost" size="sm" className="gap-2">
                                <ArrowLeft className="h-4 w-4" />
                                Retour
                            </Button>
                        </Link>

                        <div className="flex items-center gap-3">
                            {/* Debug info en développement */}
                            {process.env.NODE_ENV === 'development' && (
                                <div className="text-xs space-y-1">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${isRefreshing ? 'bg-blue-500 animate-pulse' : 'bg-green-500'
                                            }`} />
                                        <span className="text-muted-foreground">
                                            {isRefreshing ? 'Actualisation...' : 'Actif'}
                                        </span>
                                    </div>
                                    {errorCount > 0 && (
                                        <div className="text-red-500">
                                            Erreurs: {errorCount}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Bouton refresh manuel */}
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={handleRefresh}
                                disabled={isRefreshing}
                            >
                                <RefreshCw
                                    className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''
                                        }`}
                                />
                            </Button>

                            {restaurantLogo && (
                                <img
                                    src={restaurantLogo}
                                    alt={restaurantName}
                                    className="h-8"
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
                {/* Infos commande */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-2xl">
                                    Commande {orderNumber}
                                </CardTitle>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Table {tableNumber} • {formatDate(new Date(createdAt))}
                                </p>
                            </div>

                            <Badge
                                variant={
                                    status === 'delivered'
                                        ? 'success'
                                        : status === 'cancelled'
                                            ? 'destructive'
                                            : 'default'
                                }
                                className="text-sm"
                            >
                                {ORDER_STEPS.find((s) => s.status === status)?.label ||
                                    status}
                            </Badge>
                        </div>
                    </CardHeader>
                </Card>

                {/* Statut de la commande */}
                {status !== 'cancelled' && (
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
                                                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${isCompleted
                                                        ? 'bg-primary text-white scale-110'
                                                        : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-400'
                                                        }`}
                                                >
                                                    <Icon className="h-5 w-5" />
                                                </div>

                                                {index < ORDER_STEPS.length - 1 && (
                                                    <div
                                                        className={`absolute left-5 top-10 w-0.5 h-8 transition-all duration-500 ${isCompleted
                                                            ? 'bg-primary'
                                                            : 'bg-zinc-200 dark:bg-zinc-700'
                                                            }`}
                                                    />
                                                )}
                                            </div>

                                            <div className="flex-1 pt-2">
                                                <p
                                                    className={`font-medium transition-colors duration-300 ${isCurrent
                                                        ? 'text-primary'
                                                        : isCompleted
                                                            ? 'text-zinc-900 dark:text-zinc-100'
                                                            : 'text-zinc-400'
                                                        }`}
                                                >
                                                    {step.label}
                                                </p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Articles commandés */}
                <Card>
                    <CardHeader>
                        <CardTitle>Articles ({items.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {items.map((item, index) => (
                            <div key={index} className="flex items-center gap-3">
                                <div className="relative w-16 h-16 rounded-lg bg-zinc-100 dark:bg-zinc-800 overflow-hidden shrink-0">
                                    {item.imageUrl ? (
                                        <Image
                                            src={item.imageUrl}
                                            alt={item.name}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Package className="h-6 w-6 text-zinc-400" />
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{item.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {item.quantity} x {formatPrice(item.price)}
                                    </p>
                                </div>

                                <p className="font-semibold shrink-0">
                                    {formatPrice(item.price * item.quantity)}
                                </p>
                            </div>
                        ))}

                        <div className="border-t pt-3 mt-3 flex justify-between items-center">
                            <span className="font-semibold text-lg">Total</span>
                            <span className="font-bold text-xl text-primary">
                                {formatPrice(totalAmount)}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                {restaurantPhone && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Besoin d'aide ?</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <a href={`tel:${restaurantPhone}`}>
                                <Button variant="outline" className="w-full gap-2">
                                    <Phone className="h-4 w-4" />
                                    Appeler {restaurantName}
                                </Button>
                            </a>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}