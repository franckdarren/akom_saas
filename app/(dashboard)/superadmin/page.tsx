// app/superadmin/page.tsx
import {
    getPlatformStats,
    getActivityStats,
    getTopRestaurants,
} from '@/lib/actions/superadmin'

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

import {Badge} from '@/components/ui/badge'

import {
    Building2,
    Users,
    ShoppingCart,
    TrendingUp,
    CreditCard,
    Clock,
    CheckCircle2,
    Calendar,
    FileText,
    AlertCircle,
    CheckCircle,
    FileCheck,
    XCircle,
} from 'lucide-react'

import {formatNumber, formatPrice} from '@/lib/utils/format'
import Link from 'next/link'
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

export default async function SuperAdminDashboard() {
    const [stats, activity, topRestaurants] = await Promise.all([
        getPlatformStats(),
        getActivityStats(),
        getTopRestaurants(),
    ])

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
                                <BreadcrumbLink href="/superadmin">
                                    Administration
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator/>
                            <BreadcrumbItem>
                                <BreadcrumbPage>Tableau de bord</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header>

            <div className="flex flex-col gap-6 p-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        SuperAdmin Dashboard
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Vue globale de la plateforme Akôm
                    </p>
                </div>

                {/* ================= KPI GLOBAL ================= */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title="Restaurants"
                        value={stats.totalRestaurants}
                        subtitle={`${stats.activeRestaurants} actifs`}
                        icon={<Building2/>}
                    />

                    <StatCard title="Utilisateurs" value={stats.totalUsers} icon={<Users/>}/>

                    <StatCard
                        title="Commandes"
                        value={stats.totalOrders}
                        subtitle={`${stats.ordersToday} aujourd'hui`}
                        icon={<ShoppingCart/>}
                    />

                    <StatCard
                        title="Revenus commandes"
                        value={formatPrice(stats.totalRevenue)}
                        icon={<TrendingUp/>}
                    />
                </div>

                {/* ================= ABONNEMENTS ================= */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title="Abonnements actifs"
                        value={stats.activeSubscriptions}
                        subtitle={`${stats.trialSubscriptions} en essai`}
                        icon={<CheckCircle2/>}
                    />

                    <StatCard
                        title="Abonnements expirés"
                        value={stats.expiredSubscriptions}
                        icon={<Clock/>}
                    />

                    <StatCard
                        title="Paiements en attente"
                        value={stats.pendingPayments}
                        icon={<Clock/>}
                    />

                    <StatCard
                        title="Revenus abonnements (mois)"
                        value={formatPrice(stats.monthlySubscriptionRevenue)}
                        subtitle={new Date().toLocaleDateString('fr-FR', {
                            month: 'long',
                            year: 'numeric',
                        })}
                        icon={<CreditCard/>}
                    />
                </div>

                {/* ================= CONFORMITÉ ================= */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                    <StatCard
                        title="En attente de documents"
                        value={stats.pendingDocuments}
                        icon={<Clock/>}
                    />

                    <StatCard
                        title="Documents soumis"
                        value={stats.submittedDocuments}
                        icon={<FileCheck/>}
                    />

                    <StatCard
                        title="Restaurants vérifiés"
                        value={stats.verifiedRestaurants}
                        icon={<CheckCircle/>}
                    />

                    <StatCard
                        title="Documents rejetés"
                        value={stats.rejectedDocuments}
                        icon={<XCircle/>}
                    />

                    <StatCard
                        title="Restaurants suspendus"
                        value={stats.suspendedRestaurants}
                        icon={<AlertCircle/>}
                    />

                    <StatCard
                        title="Fiches circuit en attente"
                        value={stats.pendingCircuitSheets}
                        icon={<FileText/>}
                    />
                </div>

                {/* ================= ACTIVITÉ 7 JOURS ================= */}
                <Card>
                    <CardHeader>
                        <CardTitle>Activité des 7 derniers jours</CardTitle>
                        <CardDescription>Commandes et revenus journaliers</CardDescription>
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

                {/* ================= TOP RESTAURANTS ================= */}
                <Card>
                    <CardHeader>
                        <CardTitle>Top 5 Restaurants</CardTitle>
                        <CardDescription>Classés par nombre de commandes</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Restaurant</TableHead>
                                    <TableHead>Slug</TableHead>
                                    <TableHead>Statut</TableHead>
                                    <TableHead className="text-right">Commandes</TableHead>
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
                                                variant={restaurant.isActive ? 'default' : 'outline'}
                                            >
                                                {restaurant.isActive ? 'Actif' : 'Inactif'}
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
        </>
    )
}

/* ================= COMPONENT ================= */

function StatCard({
                      title,
                      value,
                      subtitle,
                      icon,
                  }: {
    title: string
    value: string | number
    subtitle?: string
    icon: React.ReactNode
}) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <div className="h-4 w-4 text-zinc-600">{icon}</div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">
                    {typeof value === 'number' ? formatNumber(value) : value}
                </div>
                {subtitle && (
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                        {subtitle}
                    </p>
                )}
            </CardContent>
        </Card>
    )
}
