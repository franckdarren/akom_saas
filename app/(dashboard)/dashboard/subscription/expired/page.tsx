// app/(dashboard)/dashboard/subscription/expired/page.tsx
import {redirect} from 'next/navigation'
import {createClient} from '@/lib/supabase/server'
import {getRestaurantSubscription} from '@/lib/actions/subscription'
import Link from 'next/link'
import {Calendar, CreditCard, AlertCircle} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {
    AppCard,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/app-card'
import {Alert, AlertDescription, AlertTitle} from '@/components/ui/alert'

// Cette page est un Server Component
export default async function SubscriptionExpiredPage() {
    const supabase = await createClient()

    // Récupérer l'utilisateur connecté
    const {
        data: {user},
    } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    // Récupérer le restaurant associé à l'utilisateur
    const {data: restaurantUser} = await supabase
        .from('restaurant_users')
        .select('restaurant_id, restaurants(name)')
        .eq('user_id', user.id)
        .single()

    if (!restaurantUser) redirect('/dashboard')

    const restaurantId = restaurantUser.restaurant_id
    const restaurantName = ((restaurantUser.restaurants as unknown) as { name: string } | null)?.name || 'votre restaurant'

    // Récupérer l'abonnement et ses paiements
    const {subscription} = await getRestaurantSubscription(restaurantId)
    if (!subscription) redirect('/dashboard/subscription/choose-plan')

    // Vérifier si l'abonnement est encore actif
    const now = new Date()
    let isActive = false
    if (subscription.status === 'trial' && subscription.trialEndsAt) {
        isActive = new Date(subscription.trialEndsAt) > now
    } else if (subscription.status === 'active' && subscription.currentPeriodEnd) {
        isActive = new Date(subscription.currentPeriodEnd) > now
    }

    if (isActive) redirect('/dashboard')

    const pendingPayments = subscription.payments?.filter((p) => p.status === 'pending') || []

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <div className="max-w-2xl w-full space-y-6">

                {/* Alerte abonnement expiré */}
                <Alert variant="destructive" className="border-2">
                    <AlertCircle className="h-5 w-5"/>
                    <AlertTitle className="text-lg font-semibold">Abonnement expiré</AlertTitle>
                    <AlertDescription className="text-base">
                        Votre accès à Akôm est actuellement suspendu. Pour continuer à utiliser toutes les
                        fonctionnalités, veuillez renouveler votre abonnement.
                    </AlertDescription>
                </Alert>

                {/* Carte d’abonnement */}
                <AppCard>
                    <CardHeader>
                        <CardTitle className="text-2xl">Renouveler {restaurantName}</CardTitle>
                        <CardDescription>
                            {subscription.status === 'trial'
                                ? "Votre période d'essai gratuite est terminée."
                                : 'Votre abonnement a expiré.'}
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="layout-card-body">

                        {/* Infos plan */}
                        <div className="bg-muted rounded-lg p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-foreground">Plan actuel</span>
                                <span
                                    className="px-3 py-1 bg-muted text-foreground rounded-full text-sm font-medium capitalize">
                  {subscription.plan}
                </span>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-foreground">Statut</span>
                                <span
                                    className="px-3 py-1 bg-destructive/20 text-destructive rounded-full text-sm font-medium">
                  {subscription.status === 'trial' ? 'Essai expiré' : 'Expiré'}
                </span>
                            </div>

                            {subscription.currentPeriodEnd && (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-foreground">Date d'expiration</span>
                                    <span className="text-sm text-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4"/>
                                        {new Date(subscription.currentPeriodEnd).toLocaleDateString('fr-FR', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric',
                                        })}
                  </span>
                                </div>
                            )}
                        </div>

                        {/* Paiements en attente */}
                        {pendingPayments.length > 0 && (
                            <Alert variant="destructive">
                                <CreditCard className="h-4 w-4"/>
                                <AlertTitle>Paiement en cours de validation</AlertTitle>
                                <AlertDescription>
                                    Vous avez {pendingPayments.length} paiement(s) en attente de validation par notre
                                    équipe. Cela peut prendre jusqu'à 24h.
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Boutons d'action */}
                        <div className="space-y-3 pt-4">
                            <Button asChild className="w-full" size="lg">
                                <Link href="/dashboard/subscription/choose-plan">Renouveler mon abonnement</Link>
                            </Button>
                            <Button asChild variant="outline" className="w-full" size="lg">
                                <Link href="/dashboard/subscription">Voir mes paiements</Link>
                            </Button>
                        </div>
                    </CardContent>
                </AppCard>

                {/* Note sécurité */}
                <AppCard className="bg-info-subtle border-info">
                    <CardContent>
                        <p className="text-sm text-blue-800">
                            <strong>💡 Vos données sont en sécurité</strong> : Toutes vos informations (menus, commandes,
                            statistiques) sont conservées. Dès que votre abonnement sera renouvelé, vous retrouverez
                            l'accès complet à votre compte.
                        </p>
                    </CardContent>
                </AppCard>

            </div>
        </div>
    )
}