// app/dashboard/subscription/page.tsx
import {redirect} from 'next/navigation'
import {createClient} from '@/lib/supabase/server'
import {
    getRestaurantSubscription,
    getDaysRemaining,
} from '@/lib/actions/subscription'
import {
    SUBSCRIPTION_CONFIG,
    formatPrice,
    calculateMonthlyPrice,
    getPlanConfig,
} from '@/lib/config/subscription'
import Link from 'next/link'
import {
    Calendar,
    CreditCard,
    CheckCircle2,
    Clock,
    XCircle,
    AlertCircle,
    ArrowRight,
    Users,
    TrendingUp,
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
import {Badge} from '@/components/ui/badge'
import {Alert, AlertDescription, AlertTitle} from '@/components/ui/alert'
import {Progress} from '@/components/ui/progress'

/**
 * Page principale de gestion d'abonnement
 *
 * REFONTE COMPLÈTE pour le système de tarification par utilisateur
 *
 * Cette page affiche maintenant :
 * - Le nombre d'utilisateurs actuels et la limite du plan
 * - Le coût mensuel actuel basé sur le nombre d'utilisateurs
 * - La décomposition du prix (base + supplément utilisateurs)
 * - Des recommandations d'upgrade si proche de la limite
 * - L'historique des paiements avec détails utilisateurs
 */
export default async function SubscriptionPage() {
    const supabase = await createClient()
    const {
        data: {user},
    } = await supabase.auth.getUser()

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

    // NOUVEAU : Compter le nombre d'utilisateurs actuels
    const {count: currentUserCount} = await supabase
        .from('restaurant_users')
        .select('*', {count: 'exact', head: true})
        .eq('restaurant_id', restaurantId)

    const userCount = Math.max(1, currentUserCount || 1)

    // Récupérer la configuration du plan actuel
    const planConfig = getPlanConfig(subscription.plan)
    const maxUsers = planConfig.userPricing.maxUsers

    // Calculer le prix mensuel actuel basé sur le nombre d'utilisateurs
    const currentMonthlyPrice = calculateMonthlyPrice(subscription.plan, userCount)

    // Calculer le pourcentage d'utilisation des utilisateurs
    const userUsagePercentage = maxUsers === 'unlimited'
        ? 0
        : (userCount / maxUsers) * 100

    // Déterminer si proche de la limite
    const isNearUserLimit = maxUsers !== 'unlimited' && userUsagePercentage >= 80

    const isExpiringSoon = daysRemaining !== null && daysRemaining <= 7
    const pendingPayments = subscription.payments.filter((p) => p.status === 'pending')

    return (
        <>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1"/>
                <Separator orientation="vertical" className="mr-2 h-4"/>
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator/>
                        <BreadcrumbItem>
                            <BreadcrumbPage>Abonnement</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </header>

            <div className="flex flex-1 flex-col gap-6 p-6">

                {/* HEADER */}
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Abonnement</h1>
                    <p className="text-muted-foreground mt-2">
                        Gérez votre abonnement et vos utilisateurs
                    </p>
                </div>

                {/* ALERTES */}
                <div className="space-y-4">

                    {/* Alerte expiration proche */}
                    {isExpiringSoon && subscription.status === 'trial' && (
                        <Alert className="border-orange-500 bg-orange-50">
                            <AlertCircle className="h-4 w-4 text-orange-600"/>
                            <AlertTitle className="text-orange-900">
                                Période d'essai bientôt terminée
                            </AlertTitle>
                            <AlertDescription className="text-orange-800">
                                Il vous reste {daysRemaining} jour{daysRemaining > 1 ? 's' : ''} d'essai
                                gratuit. Choisissez votre plan dès maintenant pour ne pas perdre l'accès.
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* NOUVEAU : Alerte limite d'utilisateurs proche */}
                    {isNearUserLimit && (
                        <Alert className="border-amber-500 bg-amber-50">
                            <TrendingUp className="h-4 w-4 text-amber-600"/>
                            <AlertTitle className="text-amber-900">
                                Limite d'utilisateurs bientôt atteinte
                            </AlertTitle>
                            <AlertDescription className="text-amber-800">
                                Vous utilisez {userCount} sur {maxUsers} utilisateurs autorisés
                                ({Math.round(userUsagePercentage)}%). Pensez à passer au plan supérieur
                                pour ajouter plus d'utilisateurs.
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Alerte paiement en attente */}
                    {pendingPayments.length > 0 && (
                        <Alert className="border-blue-500 bg-blue-50">
                            <Clock className="h-4 w-4 text-blue-600"/>
                            <AlertTitle className="text-blue-900">
                                Paiement en cours de validation
                            </AlertTitle>
                            <AlertDescription className="text-blue-800">
                                Vous avez {pendingPayments.length} paiement{pendingPayments.length > 1 ? 's' : ''}
                                en attente. Notre équipe vérifie votre paiement (max 24h).
                            </AlertDescription>
                        </Alert>
                    )}
                </div>

                {/* GRID PRINCIPALE */}
                <div className="grid gap-6 md:grid-cols-2">

                    {/* CARTE PLAN ACTUEL */}
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Plan Actuel</CardTitle>
                                    <CardDescription>
                                        Détails de votre abonnement et utilisation
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
                                    {subscription.status === 'trial' && "Période d'essai"}
                                    {subscription.status === 'active' && 'Actif'}
                                    {subscription.status === 'expired' && 'Expiré'}
                                    {subscription.status === 'suspended' && 'Suspendu'}
                                    {subscription.status === 'cancelled' && 'Annulé'}
                                </Badge>
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-6">

                            {/* Informations principales */}
                            <div className="grid md:grid-cols-3 gap-6">

                                {/* Colonne 1 : Plan et prix */}
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">Plan</p>
                                        <p className="text-2xl font-bold capitalize">
                                            {subscription.plan}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">
                                            Coût mensuel actuel
                                        </p>
                                        <p className="text-2xl font-bold text-primary">
                                            {formatPrice(currentMonthlyPrice)}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Pour {userCount} utilisateur{userCount > 1 ? 's' : ''}
                                        </p>
                                    </div>
                                </div>

                                {/* Colonne 2 : Utilisation utilisateurs */}
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-sm text-muted-foreground">Utilisateurs</p>
                                            <Users className="h-4 w-4 text-muted-foreground"/>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-3xl font-bold">{userCount}</span>
                                                {maxUsers !== 'unlimited' && (
                                                    <span className="text-muted-foreground">/ {maxUsers}</span>
                                                )}
                                            </div>
                                            {maxUsers !== 'unlimited' && (
                                                <Progress value={userUsagePercentage} className="h-2"/>
                                            )}
                                            {maxUsers === 'unlimited' && (
                                                <Badge variant="outline" className="text-primary">
                                                    Illimité ✨
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    {/* Décomposition du prix */}
                                    <div className="text-xs space-y-1 p-3 bg-muted/50 rounded-lg">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Prix de base</span>
                                            <span>{formatPrice(planConfig.baseMonthlyPrice)}</span>
                                        </div>
                                        {userCount > 1 && (
                                            <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          + {userCount - 1} user{userCount > 2 ? 's' : ''}
                        </span>
                                                <span>
                          {formatPrice((userCount - 1) * planConfig.userPricing.pricePerExtraUser)}
                        </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Colonne 3 : Dates */}
                                <div className="space-y-4">
                                    {subscription.status === 'trial' ? (
                                        <>
                                            <div>
                                                <p className="text-sm text-muted-foreground mb-1">
                                                    Début de l'essai
                                                </p>
                                                <p className="flex items-center gap-2 font-medium">
                                                    <Calendar className="h-4 w-4"/>
                                                    {new Date(subscription.trialStartsAt).toLocaleDateString('fr-FR')}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground mb-1">
                                                    Fin de l'essai
                                                </p>
                                                <p className="flex items-center gap-2 font-medium">
                                                    <Calendar className="h-4 w-4"/>
                                                    {new Date(subscription.trialEndsAt).toLocaleDateString('fr-FR')}
                                                </p>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            {subscription.currentPeriodStart && (
                                                <div>
                                                    <p className="text-sm text-muted-foreground mb-1">
                                                        Début période
                                                    </p>
                                                    <p className="flex items-center gap-2 font-medium">
                                                        <Calendar className="h-4 w-4"/>
                                                        {new Date(subscription.currentPeriodStart).toLocaleDateString('fr-FR')}
                                                    </p>
                                                </div>
                                            )}
                                            {subscription.currentPeriodEnd && (
                                                <div>
                                                    <p className="text-sm text-muted-foreground mb-1">
                                                        Prochaine facturation
                                                    </p>
                                                    <p className="flex items-center gap-2 font-medium">
                                                        <Calendar className="h-4 w-4"/>
                                                        {new Date(subscription.currentPeriodEnd).toLocaleDateString('fr-FR')}
                                                    </p>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            <Separator/>

                            {/* Compte à rebours */}
                            {daysRemaining !== null && daysRemaining >= 0 && (
                                <div className="text-center p-6 bg-muted/30 rounded-lg">
                                    <p className="text-sm text-muted-foreground mb-2">
                                        {subscription.status === 'trial' ? "Jours d'essai restants" : 'Jours restants'}
                                    </p>
                                    <p className="text-5xl font-bold text-primary mb-1">
                                        {daysRemaining}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        jour{daysRemaining > 1 ? 's' : ''}
                                    </p>
                                </div>
                            )}

                            {/* Fonctionnalités (lecture depuis la config, pas depuis la BDD) */}
                            <div>
                                <p className="font-semibold mb-4">Fonctionnalités de votre plan :</p>
                                <div className="grid md:grid-cols-2 gap-3">
                                    {planConfig.features.kitchen_display && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <CheckCircle2 className="h-4 w-4 text-green-600"/>
                                            <span>Interface cuisine</span>
                                        </div>
                                    )}
                                    {planConfig.features.basic_stats && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <CheckCircle2 className="h-4 w-4 text-green-600"/>
                                            <span>Statistiques basiques</span>
                                        </div>
                                    )}
                                    {planConfig.features.advanced_stats && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <CheckCircle2 className="h-4 w-4 text-green-600"/>
                                            <span>Statistiques avancées</span>
                                        </div>
                                    )}
                                    {planConfig.features.stock_management && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <CheckCircle2 className="h-4 w-4 text-green-600"/>
                                            <span>Gestion de stock</span>
                                        </div>
                                    )}
                                    {planConfig.features.caisse_module && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <CheckCircle2 className="h-4 w-4 text-green-600"/>
                                            <span>Module caisse</span>
                                        </div>
                                    )}
                                    {planConfig.features.warehouse_module && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <CheckCircle2 className="h-4 w-4 text-green-600"/>
                                            <span>Module entrepôt</span>
                                        </div>
                                    )}
                                    {planConfig.features.data_export && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <CheckCircle2 className="h-4 w-4 text-green-600"/>
                                            <span>Export de données</span>
                                        </div>
                                    )}
                                    {planConfig.features.mobile_payment && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <CheckCircle2 className="h-4 w-4 text-green-600"/>
                                            <span>Paiement Mobile Money</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <Separator/>

                            {/* Actions */}
                            <div className="flex flex-col sm:flex-row gap-3">
                                <Button asChild className="flex-1" size="lg">
                                    <Link href="/dashboard/subscription/choose-plan">
                                        {subscription.status === 'trial' ? 'Choisir mon plan' : 'Changer de plan'}
                                        <ArrowRight className="ml-2 h-4 w-4"/>
                                    </Link>
                                </Button>
                                {subscription.status === 'active' && (
                                    <Button asChild variant="outline" className="flex-1" size="lg">
                                        <Link href="/dashboard/subscription/choose-plan">
                                            Renouveler maintenant
                                        </Link>
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* HISTORIQUE DES PAIEMENTS */}
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle>Historique des paiements</CardTitle>
                            <CardDescription>
                                Consultez tous vos paiements et leur statut
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {subscription.payments.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50"/>
                                    <p>Aucun paiement enregistré</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {subscription.payments.map((payment) => (
                                        <div
                                            key={payment.id}
                                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
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
                                                    <p className="font-semibold">
                                                        {formatPrice(payment.amount)}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {payment.billingCycle} mois •{' '}
                                                        {new Date(payment.createdAt).toLocaleDateString('fr-FR')}
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
            </div>
        </>
    )
}