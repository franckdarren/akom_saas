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
import {Separator} from '@/components/ui/separator'
import {SidebarTrigger} from '@/components/ui/sidebar'
import {Badge} from '@/components/ui/badge'
import {Card, CardContent} from '@/components/ui/card'
import {formatPrice, calculateMonthlyPrice} from '@/lib/config/subscription'
import Link from 'next/link'
import {ExternalLink, Users} from 'lucide-react'

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
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1"/>
                <Separator orientation="vertical" className="mr-2 h-4"/>
                <div className="flex justify-between w-full">
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/superadmin">Administration</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator/>
                            <BreadcrumbItem>
                                <BreadcrumbPage>Restaurants</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header>

            <div className="flex flex-col gap-6 p-6">

                {/* En-tête de la page */}
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Tous les Restaurants
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        {restaurants.length} restaurant{restaurants.length > 1 ? 's' : ''} inscrit{restaurants.length > 1 ? 's' : ''}
                    </p>
                </div>

                {/* Liste des restaurants */}
                <div className="grid gap-4">
                    {restaurants.map((restaurant) => {
                        const sub = restaurant.subscription
                        const now = new Date()

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
                            <Card key={restaurant.id}>
                                <CardContent className="p-6">
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
                                            </div>

                                            {/* Statistiques du restaurant */}
                                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4 text-sm">

                                                {/* Nombre de tables */}
                                                <div>
                                                    <p className="text-muted-foreground">Tables</p>
                                                    <p className="font-medium text-lg">
                                                        {restaurant._count.tables}
                                                    </p>
                                                </div>

                                                {/* Nombre de produits */}
                                                <div>
                                                    <p className="text-muted-foreground">Produits</p>
                                                    <p className="font-medium text-lg">
                                                        {restaurant._count.products}
                                                    </p>
                                                </div>

                                                {/* Nombre de commandes */}
                                                <div>
                                                    <p className="text-muted-foreground">Commandes</p>
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
                                                    Ce restaurant n'a pas encore d'abonnement actif
                                                </div>
                                            )}
                                        </div>

                                        {/* Lien vers la page de détail */}
                                        <Link
                                            href={`/superadmin/restaurants/${restaurant.id}`}
                                            aria-label={`Voir la fiche du restaurant ${restaurant.name}`}
                                            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                                        >
                                            Voir détails
                                            <ExternalLink className="h-4 w-4"/>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}

                    {/* Message si aucun restaurant */}
                    {restaurants.length === 0 && (
                        <Card>
                            <CardContent className="p-12 text-center text-muted-foreground">
                                Aucun restaurant inscrit pour le moment
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </>
    )
}