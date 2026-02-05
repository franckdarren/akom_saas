import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
    getRestaurantSubscription,
    ensureSubscription,
} from '@/lib/actions/subscription'
import Link from 'next/link'
import { AlertCircle, Calendar, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export default async function SubscriptionExpiredPage() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Récupérer le restaurant
    const { data: restaurantUser } = await supabase
        .from('restaurant_users')
        .select('restaurant_id, restaurants(name)')
        .eq('user_id', user.id)
        .single()

    if (!restaurantUser) {
        redirect('/dashboard')
    }

    const restaurantId = restaurantUser.restaurant_id
    const restaurantName = (restaurantUser.restaurants as any)?.name

    // NOUVEAU : Appeler ensureSubscription ICI au lieu du middleware
    // Cela garantit qu'un abonnement existe avant d'afficher la page
    const subscription = await ensureSubscription(restaurantId)

    // Si l'abonnement est actif, rediriger vers le dashboard
    const now = new Date()
    let isActive = false

    if (subscription.status === 'trial' && subscription.trialEndsAt) {
        isActive = new Date(subscription.trialEndsAt) > now
    } else if (subscription.status === 'active' && subscription.currentPeriodEnd) {
        isActive = new Date(subscription.currentPeriodEnd) > now
    }

    // Si finalement l'abonnement est actif, rediriger
    if (isActive) {
        redirect('/dashboard')
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-2xl w-full space-y-6">
                <Alert variant="destructive" className="border-2">
                    <AlertCircle className="h-5 w-5" />
                    <AlertTitle className="text-lg font-semibold">
                        Abonnement expiré
                    </AlertTitle>
                    <AlertDescription className="text-base">
                        Votre accès à Akôm est actuellement suspendu. Pour continuer à
                        utiliser toutes les fonctionnalités, veuillez renouveler votre
                        abonnement.
                    </AlertDescription>
                </Alert>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl">
                            Renouveler {restaurantName}
                        </CardTitle>
                        <CardDescription>
                            {subscription.status === 'trial'
                                ? 'Votre période d\'essai gratuite est terminée.'
                                : 'Votre abonnement a expiré.'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">
                                    Plan actuel
                                </span>
                                <span className="px-3 py-1 bg-gray-200 text-gray-800 rounded-full text-sm font-medium capitalize">
                                    {subscription.plan}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">
                                    Statut
                                </span>
                                <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                                    {subscription.status === 'trial' ? 'Essai expiré' : 'Expiré'}
                                </span>
                            </div>
                            {subscription.currentPeriodEnd && (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-700">
                                        Date d'expiration
                                    </span>
                                    <span className="text-sm text-gray-600 flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        {new Date(subscription.currentPeriodEnd).toLocaleDateString(
                                            'fr-FR',
                                            {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric',
                                            }
                                        )}
                                    </span>
                                </div>
                            )}
                        </div>

                        {subscription.payments &&
                            subscription.payments.filter((p) => p.status === 'pending').length > 0 && (
                                <Alert>
                                    <CreditCard className="h-4 w-4" />
                                    <AlertTitle>Paiement en cours de validation</AlertTitle>
                                    <AlertDescription>
                                        Vous avez {subscription.payments.filter((p) => p.status === 'pending').length}{' '}
                                        paiement(s) en attente de validation par notre équipe. Cela
                                        peut prendre jusqu'à 24h.
                                    </AlertDescription>
                                </Alert>
                            )}

                        <div className="space-y-3 pt-4">
                            <Button asChild className="w-full" size="lg">
                                <Link href="/dashboard/subscription/choose-plan">
                                    Renouveler mon abonnement
                                </Link>
                            </Button>
                            <Button asChild variant="outline" className="w-full" size="lg">
                                <Link href="/dashboard/subscription">
                                    Voir mes paiements
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                        <strong>💡 Vos données sont en sécurité</strong> : Toutes vos
                        informations (menus, commandes, statistiques) sont conservées. Dès
                        que votre abonnement sera renouvelé, vous retrouverez l'accès
                        complet à votre compte.
                    </p>
                </div>
            </div>
        </div>
    )
}