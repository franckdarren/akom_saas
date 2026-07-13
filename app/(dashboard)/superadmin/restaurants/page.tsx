// app/superadmin/restaurants/page.tsx
import prisma from '@/lib/prisma'
import {
    Breadcrumb,
    BreadcrumbList,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbSeparator,
    BreadcrumbPage,
} from '@/components/ui/breadcrumb'
import {PageHeader} from '@/components/ui/page-header'
import {AppInsetHeader} from '@/components/layout/AppInsetHeader'
import {Badge} from '@/components/ui/badge'
import {AppCard, CardContent} from '@/components/ui/app-card'
import {EmptyState} from '@/components/ui/empty-state'
import {formatPrice, calculateMonthlyPrice} from '@/lib/config/subscription'
import {getLabels} from '@/lib/config/activity-labels'
import Link from 'next/link'
import {ExternalLink, Users} from 'lucide-react'

function capitalize(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1)
}

/**
 * Page Superadmin : Liste de tous les restaurants
 *
 * Cette page affiche une vue d'ensemble de tous les restaurants inscrits
 * avec leurs informations d'abonnement, y compris le nombre d'utilisateurs
 * et le prix mensuel calculé correctement.
 *
 * CORRECTIONS APPORTÉES :
 * - Ajout de activeUsersCount dans la requête Prisma
 * - Calcul correct du prix mensuel basé sur le nombre d'utilisateurs
 * - Affichage du nombre d'utilisateurs actifs
 * - Meilleur visuel pour les informations d'abonnement
 */
export default async function RestaurantsPage() {
    // ============================================================
    // Récupération des restaurants avec leurs abonnements
    // ============================================================

    const restaurants = await prisma.restaurant.findMany({
        include: {
            subscription: {
                // IMPORTANT : Inclure activeUsersCount pour calculer le prix correct
                select: {
                    id: true,
                    plan: true,
                    status: true,
                    basePlanPrice: true,
                    activeUsersCount: true,  // ← NOUVEAU : nécessaire pour le calcul du prix
                    billingCycle: true,
                    trialStartsAt: true,
                    trialEndsAt: true,
                    currentPeriodStart: true,
                    currentPeriodEnd: true,
                    createdAt: true,
                    updatedAt: true,
                },
            },
            _count: {
                select: {
                    tables: true,
                    products: true,
                    orders: true,
                    // BONUS : Compter aussi les utilisateurs via la relation
                    users: true,
                },
            },
        },
        orderBy: {createdAt: 'desc'},
    })

    return (
        <>
            {/* Header */}
            <AppInsetHeader>
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/superadmin">Administration</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator/>
                        <BreadcrumbItem>
                            <BreadcrumbPage>Structures</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </AppInsetHeader>

            <div className="layout-page">
                <PageHeader
                    title="Toutes les Structures"
                    description={`${restaurants.length} structure${restaurants.length > 1 ? 's' : ''} inscrite${restaurants.length > 1 ? 's' : ''}`}
                />

                {/* Liste des restaurants */}
                <div className="grid gap-4">
                    {restaurants.map((restaurant) => {
                        const sub = restaurant.subscription
                        const now = new Date()
                        const labels = getLabels(restaurant.activityType)

                        // ============================================================
                        // Calcul du statut de l'abonnement et des jours restants
                        // ============================================================

                        let isActive = false
                        let daysRemaining = 0
                        let endDate: Date | null = null

                        if (sub) {
                            if (sub.status === 'trial') {
                                isActive = new Date(sub.trialEndsAt) > now
                                daysRemaining = Math.ceil(
                                    (new Date(sub.trialEndsAt).getTime() - now.getTime()) /
                                    (1000 * 60 * 60 * 24)
                                )
                                endDate = new Date(sub.trialEndsAt)
                            } else if (sub.status === 'active' && sub.currentPeriodEnd) {
                                isActive = new Date(sub.currentPeriodEnd) > now
                                daysRemaining = Math.ceil(
                                    (new Date(sub.currentPeriodEnd).getTime() - now.getTime()) /
                                    (1000 * 60 * 60 * 24)
                                )
                                endDate = new Date(sub.currentPeriodEnd)
                            }
                        }

                        // ============================================================
                        // CORRECTION : Calcul correct du prix mensuel
                        // ============================================================

                        // Calculer le prix mensuel basé sur le plan ET le nombre d'utilisateurs
                        // Si activeUsersCount n'est pas disponible, on utilise 1 par défaut
                        const userCount = sub?.activeUsersCount || 1
                        const monthlyPrice = sub
                            ? calculateMonthlyPrice(sub.plan, userCount)
                            : 0

                        return (
                            <AppCard key={restaurant.id}>
                                <CardContent>
                                    <div className="flex items-start justify-between">

                                        {/* Informations principales du restaurant */}
                                        <div className="flex-1">

                                            {/* En-tête avec nom et badges */}
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-semibold">
                                                    {restaurant.name}
                                                </h3>

                                                {/* Badge de statut */}
                                                <Badge
                                                    variant={
                                                        isActive
                                                            ? 'default'
                                                            : sub?.status === 'trial'
                                                                ? 'secondary'
                                                                : 'destructive'
                                                    }
                                                >
                                                    {!sub && "Pas d'abonnement"}
                                                    {sub?.status === 'trial' &&
                                                        (isActive ? 'Essai actif' : 'Essai expiré')}
                                                    {sub?.status === 'active' &&
                                                        (isActive ? 'Actif' : 'Expiré')}
                                                    {sub?.status === 'suspended' && 'Suspendu'}
                                                    {sub?.status === 'cancelled' && 'Annulé'}
                                                </Badge>

                                                {/* Badge du plan */}
                                                {sub && (
                                                    <Badge variant="outline" className="capitalize">
                                                        {sub.plan}
                                                    </Badge>
                                                )}

                                                {/* Badge du type d'activité */}
                                                <Badge variant="secondary">
                                                    <span className="mr-1">{labels.emoji}</span>
                                                    {labels.structureNameCapital}
                                                </Badge>
                                            </div>

                                            {/* Statistiques du restaurant */}
                                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4 text-sm">

                                                {/* Nombre de points de service */}
                                                <div>
                                                    <p className="text-muted-foreground">{capitalize(labels.tableNamePlural)}</p>
                                                    <p className="font-medium text-lg">
                                                        {restaurant._count.tables}
                                                    </p>
                                                </div>

                                                {/* Nombre de produits/articles/prestations */}
                                                <div>
                                                    <p className="text-muted-foreground">{capitalize(labels.productNamePlural)}</p>
                                                    <p className="font-medium text-lg">
                                                        {restaurant._count.products}
                                                    </p>
                                                </div>

                                                {/* Nombre de commandes/réservations */}
                                                <div>
                                                    <p className="text-muted-foreground">{labels.orderNamePluralCapital}</p>
                                                    <p className="font-medium text-lg">
                                                        {restaurant._count.orders}
                                                    </p>
                                                </div>

                                                {/* NOUVEAU : Nombre d'utilisateurs */}
                                                <div>
                                                    <p className="text-muted-foreground flex items-center gap-1">
                                                        <Users className="h-3 w-3"/>
                                                        Utilisateurs
                                                    </p>
                                                    <p className="font-medium text-lg">
                                                        {restaurant._count.users}
                                                    </p>
                                                </div>

                                                {/* Jours restants */}
                                                {sub && (
                                                    <div>
                                                        <p className="text-muted-foreground">Jours restants</p>
                                                        <p className="font-medium text-lg">
                                                            {isActive ? Math.max(0, daysRemaining) : 0} j
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Détails de l'abonnement */}
                                            {sub && (
                                                <div className="mt-4 space-y-2">

                                                    {/* Ligne 1 : Prix et composition */}
                                                    <div className="flex items-center gap-6 text-sm">
                                                        <div>
                                                            <span
                                                                className="text-muted-foreground">Prix mensuel : </span>
                                                            <span className="font-semibold text-base text-primary">
                                {formatPrice(monthlyPrice)}
                              </span>
                                                        </div>

                                                        {/* Afficher la composition du prix si plus d'un utilisateur */}
                                                        {userCount > 1 && (
                                                            <div className="text-xs text-muted-foreground">
                                                                ({formatPrice(sub.basePlanPrice)} base
                                                                + {userCount - 1} user
                                                                {userCount > 2 ? 's' : ''})
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Ligne 2 : Dates */}
                                                    <div className="flex items-center gap-6 text-sm">
                                                        <div>
                                                            <span className="text-muted-foreground">Créé le : </span>
                                                            <span className="font-medium">
                                {new Date(restaurant.createdAt).toLocaleDateString('fr-FR')}
                              </span>
                                                        </div>

                                                        {endDate && (
                                                            <div>
                                <span className="text-muted-foreground">
                                  {sub.status === 'trial' ? 'Fin essai : ' : 'Expire le : '}
                                </span>
                                                                <span className="font-medium">
                                  {endDate.toLocaleDateString('fr-FR')}
                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Message si pas d'abonnement */}
                                            {!sub && (
                                                <div className="mt-4 text-sm text-muted-foreground">
                                                    Cette structure n'a pas encore d'abonnement actif
                                                </div>
                                            )}
                                        </div>

                                        {/* Lien vers la page de détail */}
                                        <Link
                                            href={`/superadmin/restaurants/${restaurant.id}`}
                                            aria-label={`Voir la fiche de la structure ${restaurant.name}`}
                                            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                                        >
                                            Voir détails
                                            <ExternalLink className="h-4 w-4"/>
                                        </Link>
                                    </div>
                                </CardContent>
                            </AppCard>
                        )
                    })}

                    {/* Message si aucune structure */}
                    {restaurants.length === 0 && (
                        <AppCard>
                            <CardContent>
                                <EmptyState title="Aucune structure inscrite pour le moment"/>
                            </CardContent>
                        </AppCard>
                    )}
                </div>
            </div>
        </>
    )
}