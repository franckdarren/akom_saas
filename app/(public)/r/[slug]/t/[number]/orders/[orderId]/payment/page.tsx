// app/r/[slug]/order/[orderId]/payment/page.tsx
import { redirect, notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import { OrderPaymentForm } from './OrderPaymentForm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { InfoIcon, UtensilsCrossed } from 'lucide-react'
import { formatPrice } from '@/lib/subscription/config'

interface PageProps {
    params: Promise<{
        slug: string
        orderId: string
    }>
}

export default async function OrderPaymentPage({ params }: PageProps) {
    const { slug, orderId } = await params

    // Récupérer le restaurant
    const restaurant = await prisma.restaurant.findUnique({
        where: { slug },
        select: {
            id: true,
            name: true,
            logoUrl: true,
        },
    })

    if (!restaurant) {
        notFound()
    }

    // Récupérer la commande
    const order = await prisma.order.findUnique({
        where: { 
            id: orderId,
            restaurantId: restaurant.id,
        },
        include: {
            table: {
                select: {
                    number: true,
                },
            },
            orderItems: {
                include: {
                    product: {
                        select: {
                            name: true,
                            price: true,
                        },
                    },
                },
            },
            payments: {
                where: {
                    status: {
                        in: ['pending', 'paid'],
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
                take: 1,
            },
        },
    })

    if (!order) {
        notFound()
    }

    // Vérifier si la commande peut être payée
    if (order.status === 'cancelled') {
        redirect(`/r/${slug}/order/${orderId}/cancelled`)
    }

    if (order.status === 'delivered') {
        redirect(`/r/${slug}/order/${orderId}/completed`)
    }

    // Si paiement déjà en cours ou payé
    const existingPayment = order.payments[0]
    if (existingPayment?.status === 'paid') {
        redirect(`/r/${slug}/order/${orderId}/payment-success?paymentId=${existingPayment.id}`)
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header Restaurant */}
                <div className="text-center mb-8">
                    {restaurant.logoUrl ? (
                        <img
                            src={restaurant.logoUrl}
                            alt={restaurant.name}
                            className="h-16 w-16 mx-auto mb-3 rounded-full object-cover"
                        />
                    ) : (
                        <div className="h-16 w-16 mx-auto mb-3 rounded-full bg-blue-100 flex items-center justify-center">
                            <UtensilsCrossed className="h-8 w-8 text-blue-600" />
                        </div>
                    )}
                    <h1 className="text-2xl font-bold">{restaurant.name}</h1>
                    <p className="text-gray-600">Paiement de votre commande</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Colonne gauche : Détails de la commande */}
                    <div className="space-y-6">
                        {/* Récapitulatif commande */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Commande #{order.orderNumber}</CardTitle>
                                <CardDescription>
                                    {order.table ? `Table ${order.table.number}` : 'À emporter'}
                                    {order.customerName && ` • ${order.customerName}`}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Liste des produits */}
                                <div className="space-y-3">
                                    {order.orderItems.map((item) => (
                                        <div key={item.id} className="flex justify-between text-sm">
                                            <div className="flex-1">
                                                <p className="font-medium">{item.productName}</p>
                                                <p className="text-gray-500">
                                                    {item.quantity} × {formatPrice(item.unitPrice)}
                                                </p>
                                            </div>
                                            <p className="font-medium">
                                                {formatPrice(item.quantity * item.unitPrice)}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                <div className="border-t pt-4">
                                    <div className="flex justify-between text-lg font-bold">
                                        <span>Total</span>
                                        <span>{formatPrice(order.totalAmount)}</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Les frais de service et de transaction seront ajoutés
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Informations */}
                        <Alert>
                            <InfoIcon className="h-4 w-4" />
                            <AlertTitle>Paiement sécurisé</AlertTitle>
                            <AlertDescription className="text-sm">
                                Votre paiement est sécurisé et crypté. Une fois confirmé, 
                                votre commande sera immédiatement transmise en cuisine.
                            </AlertDescription>
                        </Alert>

                        {/* Instructions */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Comment payer ?</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ol className="space-y-2 text-sm text-gray-600">
                                    <li className="flex gap-2">
                                        <span className="font-semibold text-gray-900">1.</span>
                                        Choisissez votre mode de paiement
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="font-semibold text-gray-900">2.</span>
                                        Entrez votre numéro de téléphone
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="font-semibold text-gray-900">3.</span>
                                        Validez avec votre code PIN
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="font-semibold text-gray-900">4.</span>
                                        Recevez la confirmation instantanée
                                    </li>
                                </ol>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Colonne droite : Formulaire de paiement */}
                    <div>
                        <OrderPaymentForm
                            orderId={order.id}
                            orderNumber={order.orderNumber || ''}
                            orderAmount={order.totalAmount}
                            restaurantName={restaurant.name}
                            customerName={order.customerName || undefined}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}