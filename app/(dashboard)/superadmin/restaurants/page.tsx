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
import {ExternalLink} from 'lucide-react'

export default async function RestaurantsPage() {
    const restaurants = await prisma.restaurant.findMany({
        include: {
            subscription: true,
            _count: {
                select: {
                    tables: true,
                    products: true,
                    orders: true,
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

            <div className='flex flex-col gap-6 p-6'>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Tous les Restaurants</h1>
                    <p className="text-muted-foreground mt-2">
                        {restaurants.length} restaurant{restaurants.length > 1 ? 's' : ''} inscrit{restaurants.length > 1 ? 's' : ''}
                    </p>
                </div>

                {/* Liste */}
                <div className="grid gap-4">
                    {restaurants.map((restaurant) => {
                        const sub = restaurant.subscription
                        const now = new Date()
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

                        return (
                            <Card key={restaurant.id}>
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-semibold">{restaurant.name}</h3>

                                                <Badge
                                                    variant={
                                                        isActive
                                                            ? 'default'
                                                            : sub?.status === 'trial'
                                                                ? 'secondary'
                                                                : 'destructive'
                                                    }
                                                >
                                                    {!sub && 'Pas d\'abonnement'}
                                                    {sub?.status === 'trial' &&
                                                        (isActive ? 'Essai actif' : 'Essai expiré')}
                                                    {sub?.status === 'active' &&
                                                        (isActive ? 'Actif' : 'Expiré')}
                                                    {sub?.status === 'suspended' && 'Suspendu'}
                                                    {sub?.status === 'cancelled' && 'Annulé'}
                                                </Badge>

                                                {sub && (
                                                    <Badge variant="outline" className="capitalize">
                                                        {sub.plan}
                                                    </Badge>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                                                <div>
                                                    <p className="text-gray-600">Tables</p>
                                                    <p className="font-medium">{restaurant._count.tables}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-600">Produits</p>
                                                    <p className="font-medium">{restaurant._count.products}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-600">Commandes</p>
                                                    <p className="font-medium">{restaurant._count.orders}</p>
                                                </div>
                                                {sub && (
                                                    <div>
                                                        <p className="text-gray-600">Jours restants</p>
                                                        <p className="font-medium">{isActive ? daysRemaining : 0} jours</p>
                                                    </div>
                                                )}
                                            </div>

                                            {sub && (
                                                <div className="mt-4 flex items-center gap-6 text-sm">
                                                    <div>
                                                        <span className="text-gray-600">Prix : </span>
                                                        <span className="font-medium">
                                                            {formatPrice(calculateMonthlyPrice(sub.plan, sub.basePlanPrice))}/mois
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-600">Créé le : </span>
                                                        <span className="font-medium">
                                                            {new Date(restaurant.createdAt).toLocaleDateString('fr-FR')}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-600">Termine le : </span>
                                                        <span
                                                            className="font-medium">{endDate?.toLocaleDateString('fr-FR')}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <Link
                                            href={`/superadmin/restaurants/${restaurant.id}`}
                                            aria-label={`Voir la fiche du restaurant ${restaurant.name}`}
                                            className="inline-flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700"
                                        >
                                            Voir le restaurant
                                            <ExternalLink className="h-4 w-4"/>
                                        </Link>

                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            </div>
        </>
    )
}