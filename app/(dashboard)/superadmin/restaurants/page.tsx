import { getAllRestaurants } from '@/lib/actions/superadmin'
import { formatDate, formatNumber } from '@/lib/utils/format'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ExternalLink } from 'lucide-react'
import Link from 'next/link'

export default async function RestaurantsListPage() {
    const restaurants = await getAllRestaurants()

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Restaurants</h1>
                    <p className="text-zinc-600 dark:text-zinc-400">
                        Tous les restaurants de la plateforme
                    </p>
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400">
                    Total : {formatNumber(restaurants.length)}
                </div>
            </div>

            {/* Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Liste complète</CardTitle>
                    <CardDescription>
                        Gérer et consulter tous les restaurants
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Restaurant</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead>Utilisateurs</TableHead>
                                <TableHead>Produits</TableHead>
                                <TableHead>Commandes</TableHead>
                                <TableHead>Créé le</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {restaurants.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={7}
                                        className="text-center text-zinc-600 dark:text-zinc-400"
                                    >
                                        Aucun restaurant
                                    </TableCell>
                                </TableRow>
                            ) : (
                                restaurants.map((restaurant) => (
                                    <TableRow key={restaurant.id}>
                                        <TableCell>
                                            <div>
                                                <div className="font-medium">
                                                    {restaurant.name}
                                                </div>
                                                <div className="text-sm text-zinc-600 dark:text-zinc-400">
                                                    {restaurant.slug}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    restaurant.isActive
                                                        ? 'default'
                                                        : 'outline'
                                                }
                                            >
                                                {restaurant.isActive ? 'Actif' : 'Inactif'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {formatNumber(restaurant._count.users)}
                                        </TableCell>
                                        <TableCell>
                                            {formatNumber(restaurant._count.products)}
                                        </TableCell>
                                        <TableCell>
                                            {formatNumber(restaurant._count.orders)}
                                        </TableCell>
                                        <TableCell className="text-zinc-600 dark:text-zinc-400">
                                            {formatDate(restaurant.createdAt)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                asChild
                                            >
                                                <Link
                                                    href={`/superadmin/restaurants/${restaurant.id}`}
                                                >
                                                    <ExternalLink className="h-4 w-4" />
                                                    Voir
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}