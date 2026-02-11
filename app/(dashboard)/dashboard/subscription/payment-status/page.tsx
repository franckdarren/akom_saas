// app/dashboard/subscription/payment-status/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Clock, XCircle, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { formatPrice } from '@/lib/subscription/config'

interface SearchParams {
    paymentId?: string
}

export default async function PaymentStatusPage({
    searchParams,
}: {
    searchParams: Promise<SearchParams>
}) {
    const params = await searchParams
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const paymentId = params.paymentId
    if (!paymentId) redirect('/dashboard/subscription')

    // Récupérer le paiement
    const payment = await prisma.subscriptionPayment.findUnique({
        where: { id: paymentId },
        include: {
            subscription: {
                include: {
                    restaurant: {
                        select: { name: true },
                    },
                },
            },
        },
    })

    if (!payment) redirect('/dashboard/subscription')

    // Vérifier que l'utilisateur a accès à ce restaurant
    const { data: restaurantUser } = await supabase
        .from('restaurant_users')
        .select('restaurant_id')
        .eq('user_id', user.id)
        .eq('restaurant_id', payment.restaurantId)
        .single()

    if (!restaurantUser) redirect('/dashboard')

    const isConfirmed = payment.status === 'confirmed'
    const isPending = payment.status === 'pending'
    const isFailed = payment.status === 'failed'

    return (
        <div className="min-h-screen bg-background dark:bg-background py-12 px-4 flex items-center justify-center">
            <Card className="max-w-2xl w-full">
                <CardHeader className="text-center pb-2">
                    {isConfirmed && (
                        <div className="mx-auto mb-4 w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
                        </div>
                    )}
                    {isPending && (
                        <div className="mx-auto mb-4 w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                            <Clock className="h-10 w-10 text-orange-600 dark:text-orange-400" />
                        </div>
                    )}
                    {isFailed && (
                        <div className="mx-auto mb-4 w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                            <XCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
                        </div>
                    )}

                    <CardTitle className="text-2xl">
                        {isConfirmed && 'Paiement confirmé !'}
                        {isPending && 'Paiement en attente'}
                        {isFailed && 'Paiement échoué'}
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                        {payment.subscription.restaurant.name}
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Détails du paiement */}
                    <div className="bg-muted rounded-lg p-6 space-y-3">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Montant</span>
                            <span className="font-semibold">{formatPrice(payment.amount)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Durée</span>
                            <span className="font-semibold">{payment.billingCycle} mois</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Mode de paiement</span>
                            <span className="font-semibold capitalize">
                                {payment.method === 'mobile_money'
                                    ? 'Mobile Money'
                                    : payment.method === 'card'
                                    ? 'Carte bancaire'
                                    : 'Manuel'}
                            </span>
                        </div>
                        {payment.transactionId && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Référence</span>
                                <span className="font-mono text-sm">{payment.transactionId}</span>
                            </div>
                        )}
                    </div>

                    {/* Message selon le statut */}
                    {isConfirmed && (
                        <div className="text-center space-y-3">
                            <p className="text-foreground">
                                Votre abonnement a été activé avec succès. Vous pouvez maintenant profiter de toutes les fonctionnalités de votre plan.
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Valable jusqu'au {payment.expiresAt ? new Date(payment.expiresAt).toLocaleDateString('fr-FR') : 'N/A'}
                            </p>
                        </div>
                    )}

                    {isPending && (
                        <div className="text-center space-y-3">
                            <p className="text-foreground">
                                Votre paiement est en cours de traitement. Cela peut prendre quelques minutes.
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Vous recevrez une notification dès que le paiement sera confirmé.
                            </p>
                        </div>
                    )}

                    {isFailed && (
                        <div className="text-center space-y-3">
                            <p className="text-foreground">Le paiement n'a pas pu être traité.</p>
                            {payment.errorMessage && (
                                <p className="text-sm text-red-600">
                                    Raison : {payment.errorMessage}
                                </p>
                            )}
                            <p className="text-sm text-muted-foreground">
                                Veuillez réessayer ou contacter notre support si le problème persiste.
                            </p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                        <Button asChild className="flex-1" variant={isConfirmed ? 'default' : 'outline'}>
                            <Link href="/dashboard/subscription" className="flex items-center justify-center gap-2">
                                Voir mon abonnement <ArrowRight className="h-4 w-4" />
                            </Link>
                        </Button>
                        {isFailed && (
                            <Button asChild className="flex-1" variant="default">
                                <Link href="/dashboard/subscription/choose-plan" className="flex items-center justify-center">
                                    Réessayer
                                </Link>
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
