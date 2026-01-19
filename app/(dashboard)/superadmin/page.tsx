import {
    getPlatformStats,
    getActivityStats,
    getTopRestaurants,
} from '@/lib/actions/superadmin'
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
import { Badge } from '@/components/ui/badge'
import {
    Building2,
    Users,
    ShoppingCart,
    TrendingUp,
    Calendar,
} from 'lucide-react'
import Link from 'next/link'

export default async function SuperAdminDashboard() {
    const [stats, activity, topRestaurants] = await Promise.all([
        getPlatformStats(),
        getActivityStats(),
        getTopRestaurants(),
    ])

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold pb-2">SuperAdmin Dashboard</h1>
                <p className="text-zinc-600 dark:text-zinc-400">
                    Vue d'ensemble de la plateforme Akôm
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Total Restaurants */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">
                            Restaurants
                        </CardTitle>
                        <Building2 className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatNumber(stats.totalRestaurants)}
                        </div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">
                            {stats.activeRestaurants} actifs
                        </p>
                    </CardContent>
                </Card>

                {/* Total Users */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">
                            Utilisateurs
                        </CardTitle>
                        <Users className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatNumber(stats.totalUsers)}
                        </div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">
                            Total utilisateurs
                        </p>
                    </CardContent>
                </Card>

                {/* Total Orders */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">
                            Commandes
                        </CardTitle>
                        <ShoppingCart className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatNumber(stats.totalOrders)}
                        </div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">
                            {stats.ordersToday} aujourd'hui
                        </p>
                    </CardContent>
                </Card>

                {/* Total Revenue */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">
                            Revenu Total
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatPrice(stats.totalRevenue)}
                        </div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">
                            Tous restaurants confondus
                        </p>
                    </CardContent>
                </Card>

                {/* Activity Today */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">
                            Aujourd'hui
                        </CardTitle>
                        <Calendar className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatNumber(stats.ordersToday)}
                        </div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">
                            Nouvelles commandes
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Activity Chart (simple version) */}
            <Card>
                <CardHeader>
                    <CardTitle>Activité des 7 derniers jours</CardTitle>
                    <CardDescription>
                        Commandes et revenus par jour
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {activity.map((day) => (
                            <div
                                key={day.date}
                                className="flex items-center justify-between py-2 border-b last:border-0"
                            >
                                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                                    {new Date(day.date).toLocaleDateString('fr-FR', {
                                        weekday: 'short',
                                        day: 'numeric',
                                        month: 'short',
                                    })}
                                </span>
                                <div className="flex items-center gap-4">
                                    <span className="text-sm font-medium">
                                        {formatNumber(day.orders)} commandes
                                    </span>
                                    <span className="text-sm font-bold text-green-600">
                                        {formatPrice(day.revenue)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Top Restaurants */}
            <Card>
                <CardHeader>
                    <CardTitle>Top 5 Restaurants</CardTitle>
                    <CardDescription>
                        Par nombre de commandes
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Restaurant</TableHead>
                                <TableHead>Slug</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead className="text-right">
                                    Commandes
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {topRestaurants.map((restaurant) => (
                                <TableRow key={restaurant.id}>
                                    <TableCell className="font-medium">
                                        <Link
                                            href={`/superadmin/restaurants/${restaurant.id}`}
                                            className="hover:underline"
                                        >
                                            {restaurant.name}
                                        </Link>
                                    </TableCell>
                                    <TableCell className="text-zinc-600 dark:text-zinc-400">
                                        {restaurant.slug}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={
                                                restaurant.isActive
                                                    ? 'default'
                                                    : 'outline'
                                            }
                                        >
                                            {restaurant.isActive
                                                ? 'Actif'
                                                : 'Inactif'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                        {formatNumber(restaurant._count.orders)}
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