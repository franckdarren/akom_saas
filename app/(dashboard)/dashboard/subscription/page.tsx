// app/dashboard/subscription/page.tsx
import {redirect} from 'next/navigation'
import {createClient} from '@/lib/supabase/server'
import {
    getRestaurantSubscription,
    getDaysRemaining,
} from '@/lib/actions/subscription'
import {formatPrice} from '@/lib/subscription/config'
import Link from 'next/link'
import {
    Calendar,
    CreditCard,
    CheckCircle2,
    Clock,
    XCircle,
    AlertCircle,
    ArrowRight,
} from 'lucide-react'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import {
    Breadcrumb,
    BreadcrumbList,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbSeparator,
    BreadcrumbPage,
} from '@/components/ui/breadcrumb'
import {Separator} from '@/components/ui/separator'
import {SidebarTrigger} from '@/components/ui/sidebar'
import {Button} from '@/components/ui/button'
import {Plus} from 'lucide-react'
import {getUserRole} from "@/lib/actions/auth"

import {Badge} from '@/components/ui/badge'
import {Alert, AlertDescription, AlertTitle} from '@/components/ui/alert'

export default async function SubscriptionPage() {
    const supabase = await createClient()
    const {
        data: {user},
    } = await supabase.auth.getUser()

    const userRole = await getUserRole()

    if (!user) {
        redirect('/login')
    }

    // Récupérer le restaurant
    const {data: restaurantUser} = await supabase
        .from('restaurant_users')
        .select('restaurant_id, restaurants(name)')
        .eq('user_id', user.id)
        .single()

    if (!restaurantUser) {
        redirect('/dashboard')
    }

    const restaurantId = restaurantUser.restaurant_id
    const restaurantName = (restaurantUser.restaurants as any)?.name

    // Récupérer l'abonnement
    const {subscription} = await getRestaurantSubscription(restaurantId)
    const daysRemaining = await getDaysRemaining(restaurantId)

    if (!subscription) {
        return (
            <div className="p-6">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4"/>
                    <AlertTitle>Erreur</AlertTitle>
                    <AlertDescription>
                        Aucun abonnement trouvé pour ce restaurant.
                    </AlertDescription>
                </Alert>
            </div>
        )
    }

    const isExpiringSoon = daysRemaining !== null && daysRemaining <= 7
    const pendingPayments = subscription.payments.filter(
        (p) => p.status === 'pending'
    )

    return (
        <>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1"/>
                <Separator orientation="vertical" className="mr-2 h-4"/>
                <div className="flex justify-between w-full">
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/dashboard">Opérations</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator/>
                            <BreadcrumbItem>
                                <BreadcrumbPage>Abonnement</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header>

            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Abonnement</h1>
                        <p className="text-muted-foreground mt-2">
                            Gérez votre abonnement
                        </p>
                    </div>
                </div>

                {/* Body */}

                {/* Alerte si expiration proche */}
                {isExpiringSoon && subscription.status === 'trial' && (
                    <Alert className="border-orange-800 ">
                        <AlertCircle className="h-4 w-4 text-orange-600"/>
                        <AlertTitle className="text-primary">
                            Période d'essai bientôt terminée
                        </AlertTitle>
                        <AlertDescription className="text-orange-600">
                            Il vous reste {daysRemaining} jour{daysRemaining! > 1 ? 's' : ''}{' '}
                            d'essai gratuit. Choisissez votre plan dès maintenant pour ne pas
                            perdre l'accès.
                        </AlertDescription>
                    </Alert>
                )}

                {/* Paiements en attente */}
                {pendingPayments.length > 0 && (
                    <Alert className="border-blue-200 bg-blue-50">
                        <Clock className="h-4 w-4 text-blue-600"/>
                        <AlertTitle className="text-blue-800">
                            Paiement en cours de validation
                        </AlertTitle>
                        <AlertDescription className="text-blue-700">
                            Vous avez {pendingPayments.length} paiement
                            {pendingPayments.length > 1 ? 's' : ''} en attente de validation.
                            Notre équipe vérifie votre paiement, cela peut prendre jusqu'à 24h.
                        </AlertDescription>
                    </Alert>
                )}

                {/* Card Plan Actuel */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Plan Actuel</CardTitle>
                                <CardDescription>
                                    Gérez votre abonnement et votre facturation
                                </CardDescription>
                            </div>
                            <Badge
                                variant={
                                    subscription.status === 'active'
                                        ? 'default'
                                        : subscription.status === 'trial'
                                            ? 'secondary'
                                            : 'destructive'
                                }
                                className="text-sm px-3 py-1"
                            >
                                {subscription.status === 'trial' && 'Période d\'essai'}
                                {subscription.status === 'active' && 'Actif'}
                                {subscription.status === 'expired' && 'Expiré'}
                                {subscription.status === 'suspended' && 'Suspendu'}
                                {subscription.status === 'cancelled' && 'Annulé'}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Informations du plan */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm text-muted-foreground">Plan</p>
                                    <p className="text-lg font-semibold capitalize">
                                        {subscription.plan}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Prix mensuel</p>
                                    <p className="text-lg font-semibold">
                                        {formatPrice(subscription.monthlyPrice)}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {subscription.status === 'trial' ? (
                                    <>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Date de début</p>
                                            <p className="text-lg font-medium flex items-center gap-2">
                                                <Calendar className="h-4 w-4"/>
                                                {new Date(subscription.trialStartsAt).toLocaleDateString(
                                                    'fr-FR'
                                                )}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Fin de l'essai</p>
                                            <p className="text-lg font-medium flex items-center gap-2">
                                                <Calendar className="h-4 w-4"/>
                                                {new Date(subscription.trialEndsAt).toLocaleDateString(
                                                    'fr-FR'
                                                )}
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        {subscription.currentPeriodStart && (
                                            <div>
                                                <p className="text-sm text-muted-foreground">
                                                    Début de période
                                                </p>
                                                <p className="text-lg font-medium flex items-center gap-2">
                                                    <Calendar className="h-4 w-4"/>
                                                    {new Date(
                                                        subscription.currentPeriodStart
                                                    ).toLocaleDateString('fr-FR')}
                                                </p>
                                            </div>
                                        )}
                                        {subscription.currentPeriodEnd && (
                                            <div>
                                                <p className="text-sm text-muted-foreground">
                                                    Prochaine facturation
                                                </p>
                                                <p className="text-lg font-medium flex items-center gap-2">
                                                    <Calendar className="h-4 w-4"/>
                                                    {new Date(
                                                        subscription.currentPeriodEnd
                                                    ).toLocaleDateString('fr-FR')}
                                                </p>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Compte à rebours */}
                        {daysRemaining !== null && daysRemaining >= 0 && (
                            <div className="rounded-lg p-4 text-center border">
                                <p className="text-sm text-muted-foreground mb-2">
                                    {subscription.status === 'trial'
                                        ? 'Jours d\'essai restants'
                                        : 'Jours restants'}
                                </p>
                                <p className="text-4xl font-bold text-primary">
                                    {daysRemaining}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    jour{daysRemaining > 1 ? 's' : ''}
                                </p>
                            </div>
                        )}

                        {/* Fonctionnalités du plan */}
                        <div>
                            <p className="font-semibold mb-3">Fonctionnalités incluses :</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                <div className="flex items-center gap-2 text-sm">
                                    <CheckCircle2 className="h-4 w-4 text-green-600"/>
                                    <span>
                                        {subscription.maxTables
                                            ? `${subscription.maxTables} tables`
                                            : 'Tables illimitées'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <CheckCircle2 className="h-4 w-4 text-green-600"/>
                                    <span>{subscription.maxUsers} utilisateurs</span>
                                </div>
                                {subscription.hasStockManagement && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <CheckCircle2 className="h-4 w-4 text-green-600"/>
                                        <span>Gestion de stock</span>
                                    </div>
                                )}
                                {subscription.hasAdvancedStats && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <CheckCircle2 className="h-4 w-4 text-green-600"/>
                                        <span>Statistiques avancées</span>
                                    </div>
                                )}
                                {subscription.hasDataExport && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <CheckCircle2 className="h-4 w-4 text-green-600"/>
                                        <span>Export de données</span>
                                    </div>
                                )}
                                {subscription.hasMobilePayment && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <CheckCircle2 className="h-4 w-4 text-green-600"/>
                                        <span>Paiement mobile money</span>
                                    </div>
                                )}
                                {subscription.hasMultiRestaurants && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <CheckCircle2 className="h-4 w-4 text-green-600"/>
                                        <span>Multi-restaurants</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                            <Button asChild className="flex-1">
                                <Link href="/dashboard/subscription/choose-plan">
                                    {subscription.status === 'trial'
                                        ? 'Choisir mon plan'
                                        : 'Changer de plan'}
                                    <ArrowRight className="ml-2 h-4 w-4"/>
                                </Link>
                            </Button>
                            {subscription.status === 'active' && (
                                <Button asChild variant="outline" className="flex-1">
                                    <Link href="/dashboard/subscription/payment">
                                        Renouveler maintenant
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Historique des paiements */}
                <Card>
                    <CardHeader>
                        <CardTitle>Historique des paiements</CardTitle>
                        <CardDescription>
                            Consultez tous vos paiements et leur statut
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {subscription.payments.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50"/>
                                <p>Aucun paiement enregistré</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {subscription.payments.map((payment) => (
                                    <div
                                        key={payment.id}
                                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            {payment.status === 'confirmed' && (
                                                <CheckCircle2 className="h-5 w-5 text-green-600"/>
                                            )}
                                            {payment.status === 'pending' && (
                                                <Clock className="h-5 w-5 text-orange-600"/>
                                            )}
                                            {payment.status === 'failed' && (
                                                <XCircle className="h-5 w-5 text-red-600"/>
                                            )}

                                            <div>
                                                <p className="font-medium">
                                                    {formatPrice(payment.amount)}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {payment.billingCycle} mois •{' '}
                                                    {new Date(payment.createdAt).toLocaleDateString(
                                                        'fr-FR'
                                                    )}
                                                </p>
                                            </div>
                                        </div>

                                        <Badge
                                            variant={
                                                payment.status === 'confirmed'
                                                    ? 'default'
                                                    : payment.status === 'pending'
                                                        ? 'secondary'
                                                        : 'destructive'
                                            }
                                        >
                                            {payment.status === 'confirmed' && 'Confirmé'}
                                            {payment.status === 'pending' && 'En attente'}
                                            {payment.status === 'failed' && 'Échoué'}
                                            {payment.status === 'refunded' && 'Remboursé'}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    )
}