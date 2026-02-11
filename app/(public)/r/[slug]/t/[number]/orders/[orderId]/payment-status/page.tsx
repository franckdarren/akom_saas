// app/r/[slug]/order/[orderId]/payment-status/page.tsx
import { redirect, notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Clock, XCircle, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { formatPrice } from '@/lib/subscription/config'

interface PageProps {
    params: Promise<{
        slug: string
        orderId: string
    }>
    searchParams: Promise<{
        paymentId?: string
    }>
}

export default async function OrderPaymentStatusPage({ params, searchParams }: PageProps) {
    const { slug, orderId } = await params
    const { paymentId } = await searchParams

    if (!paymentId) {
        redirect(`/r/${slug}/order/${orderId}/payment`)
    }

    // Récupérer le restaurant
    const restaurant = await prisma.restaurant.findUnique({
        where: { slug },
        select: {
            id: true,
            name: true,
        },
    })

    if (!restaurant) {
        notFound()
    }

    // Récupérer le paiement
    const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
            order: {
                include: {
                    table: {
                        select: {
                            number: true,
                        },
                    },
                },
            },
        },
    })

    if (!payment || payment.order.restaurantId !== restaurant.id) {
        notFound()
    }

    const isPaid = payment.status === 'paid'
    const isPending = payment.status === 'pending'
    const isFailed = payment.status === 'failed'

    // Extraire les détails depuis metadata
    const metadata = payment.metadata as any
    const breakdown = metadata ? {
        restaurantAmount: metadata.restaurantAmount || payment.amount,
        akomCommission: metadata.akomCommission || 0,
        transactionFees: metadata.transactionFees || 0,
        totalPaid: metadata.totalPaid || payment.amount,
    } : null

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 flex items-center justify-center">
            <Card className="max-w-2xl w-full">
                <CardHeader className="text-center pb-2">
                    {isPaid && (
                        <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="h-10 w-10 text-green-600" />
                        </div>
                    )}
                    {isPending && (
                        <div className="mx-auto mb-4 w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center animate-pulse">
                            <Clock className="h-10 w-10 text-orange-600" />
                        </div>
                    )}
                    {isFailed && (
                        <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                            <XCircle className="h-10 w-10 text-red-600" />
                        </div>
                    )}

                    <CardTitle className="text-2xl">
                        {isPaid && 'Paiement confirmé !'}
                        {isPending && 'Validation en cours...'}
                        {isFailed && 'Paiement échoué'}
                    </CardTitle>
                    <CardDescription>
                        {restaurant.name} • Commande #{payment.order.orderNumber}
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Détails du paiement */}
                    <div className="bg-gray-50 rounded-lg p-6 space-y-3">
                        {breakdown && (
                            <>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Commande</span>
                                    <span className="font-medium">{formatPrice(breakdown.restaurantAmount)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Frais de service</span>
                                    <span className="font-medium">{formatPrice(breakdown.akomCommission)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Frais de transaction</span>
                                    <span className="font-medium">{formatPrice(breakdown.transactionFees)}</span>
                                </div>
                                <div className="border-t pt-3 mt-3">
                                    <div className="flex justify-between font-bold">
                                        <span>Total payé</span>
                                        <span className="text-green-600">{formatPrice(breakdown.totalPaid)}</span>
                                    </div>
                                </div>
                            </>
                        )}
                        {!breakdown && (
                            <div className="flex justify-between font-bold">
                                <span>Montant</span>
                                <span>{formatPrice(payment.amount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Mode de paiement</span>
                            <span className="font-medium capitalize">
                                {payment.method === 'mobile_money' ? 'Mobile Money' : 'Carte bancaire'}
                            </span>
                        </div>
                        {payment.transactionId && (
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Référence</span>
                                <span className="font-mono text-xs">{payment.transactionId}</span>
                            </div>
                        )}
                    </div>

                    {/* Message selon le statut */}
                    {isPaid && (
                        <div className="text-center space-y-3 bg-green-50 border border-green-200 rounded-lg p-4">
                            <p className="text-green-800 font-medium">
                                Votre commande a été transmise en cuisine
                            </p>
                            <p className="text-sm text-green-700">
                                {payment.order.table ? 
                                    `Votre plat sera servi à la table ${payment.order.table.number}` :
                                    'Votre commande sera bientôt prête'}
                            </p>
                        </div>
                    )}

                    {isPending && (
                        <div className="text-center space-y-3 bg-orange-50 border border-orange-200 rounded-lg p-4">
                            <p className="text-orange-800">
                                Validation de votre paiement en cours...
                            </p>
                            <p className="text-sm text-orange-700">
                                Cela peut prendre quelques secondes. Cette page se rafraîchira automatiquement.
                            </p>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.location.reload()}
                                className="mt-2"
                            >
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Actualiser
                            </Button>
                        </div>
                    )}

                    {isFailed && (
                        <div className="text-center space-y-3 bg-red-50 border border-red-200 rounded-lg p-4">
                            <p className="text-red-800">
                                Le paiement n'a pas pu être traité
                            </p>
                            {payment.errorMessage && (
                                <p className="text-sm text-red-700">
                                    Raison : {payment.errorMessage}
                                </p>
                            )}
                            <p className="text-sm text-red-700">
                                Veuillez réessayer ou demander de l'aide au personnel.
                            </p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col gap-3 pt-4">
                        {isFailed && (
                            <Button asChild className="w-full">
                                <Link href={`/r/${slug}/order/${orderId}/payment`}>
                                    Réessayer le paiement
                                </Link>
                            </Button>
                        )}
                        <Button asChild variant="outline" className="w-full">
                            <Link href={`/r/${slug}`}>
                                Retour au menu
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Auto-refresh pour les paiements en attente */}
            {isPending && (
                <script
                    dangerouslySetInnerHTML={{
                        __html: `setTimeout(() => window.location.reload(), 5000)`,
                    }}
                />
            )}
        </div>
    )
}