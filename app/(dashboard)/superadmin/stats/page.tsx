import {
    getStatsByPeriod,
    getRestaurantsComparison,
    getTopProducts,
    getRealTimeStats,
} from '@/lib/actions/superadmin-stats'
import { formatPrice, formatNumber } from '@/lib/utils/format'
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
import { StatsChart } from '@/components/superadmin/StatsChart'
import { ExportStatsButton } from '@/components/superadmin/ExportStatsButton'
import { TrendingUp, Package, Activity } from 'lucide-react'

export default async function StatsPage() {
    const [monthlyStats, topRestaurants, topProducts, realTimeStats] =
        await Promise.all([
            getStatsByPeriod('month'),
            getRestaurantsComparison(10),
            getTopProducts(10),
            getRealTimeStats(),
        ])

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Stats Avancées</h1>
                    <p className="text-zinc-600 dark:text-zinc-400">
                        Analyse détaillée de la plateforme
                    </p>
                </div>
                <ExportStatsButton />
            </div>

            {/* Stats Temps Réel */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">
                            Dernières 24h
                        </CardTitle>
                        <Activity className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatNumber(realTimeStats.ordersLast24h)}
                        </div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">
                            Commandes
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">
                            Revenu 24h
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatPrice(realTimeStats.revenueLast24h)}
                        </div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">
                            Chiffre d'affaires
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">
                            Restaurants Actifs
                        </CardTitle>
                        <Package className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatNumber(realTimeStats.activeRestaurants)}
                        </div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">
                            Avec commandes récentes
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Graphique Évolution */}
            <Card>
                <CardHeader>
                    <CardTitle>Évolution Mensuelle</CardTitle>
                    <CardDescription>
                        Commandes et revenus des 12 derniers mois
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <StatsChart data={monthlyStats} />
                </CardContent>
            </Card>

            {/* Top Restaurants */}
            <Card>
                <CardHeader>
                    <CardTitle>Top 10 Restaurants</CardTitle>
                    <CardDescription>
                        Classement par nombre de commandes
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>#</TableHead>
                                <TableHead>Restaurant</TableHead>
                                <TableHead className="text-right">
                                    Commandes
                                </TableHead>
                                <TableHead className="text-right">
                                    Revenu
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {topRestaurants.map((restaurant, index) => (
                                <TableRow key={restaurant.id}>
                                    <TableCell className="font-medium">
                                        {index + 1}
                                    </TableCell>
                                    <TableCell>{restaurant.name}</TableCell>
                                    <TableCell className="text-right">
                                        {formatNumber(restaurant.ordersCount)}
                                    </TableCell>
                                    <TableCell className="text-right font-medium text-green-600">
                                        {formatPrice(restaurant.revenue)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Top Produits */}
            <Card>
                <CardHeader>
                    <CardTitle>Top 10 Produits</CardTitle>
                    <CardDescription>
                        Produits les plus vendus (tous restaurants)
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>#</TableHead>
                                <TableHead>Produit</TableHead>
                                <TableHead className="text-right">
                                    Quantité
                                </TableHead>
                                <TableHead className="text-right">
                                    Revenu
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {topProducts.map((product, index) => (
                                <TableRow key={index}>
                                    <TableCell className="font-medium">
                                        {index + 1}
                                    </TableCell>
                                    <TableCell>{product.productName}</TableCell>
                                    <TableCell className="text-right">
                                        {formatNumber(product.totalQuantity)}
                                    </TableCell>
                                    <TableCell className="text-right font-medium text-green-600">
                                        {formatPrice(product.totalRevenue)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}