'use client'

import { RestaurantDetailsType } from './page'
import { formatDate, formatNumber, formatPrice } from '@/lib/utils/format'
import { getRoleBadge } from '@/lib/utils/permissions'
import { SystemRole } from '@/types/auth'
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
import { ToggleRestaurantStatus } from '@/components/superadmin/ToggleRestaurantStatus'
import { ArrowLeft, Building2, ShoppingCart, TrendingUp } from 'lucide-react'
import Link from 'next/link'

// ----------------------------
// Props
// ----------------------------

interface Props {
    restaurant: RestaurantDetailsType
}

// ----------------------------
// Component
// ----------------------------

export default function RestaurantDetailsClient({ restaurant }: Props) {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    
                    <div>
                        <h1 className="text-3xl font-bold">{restaurant.name}</h1>
                        <p className="text-zinc-600 dark:text-zinc-400">
                            {restaurant.slug}
                        </p>
                    </div>
                </div>

                <ToggleRestaurantStatus
                    restaurantId={restaurant.id}
                    isActive={restaurant.isActive}
                />
            </div>

            {/* Infos générales */}
            <Card>
                <CardHeader>
                    <CardTitle>Informations</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                    <Info label="Téléphone">
                        {restaurant.phone || 'Non renseigné'}
                    </Info>
                    <Info label="Adresse">
                        {restaurant.address || 'Non renseigné'}
                    </Info>
                    <Info label="Statut">
                        <Badge variant={restaurant.isActive ? 'default' : 'outline'}>
                            {restaurant.isActive ? 'Actif' : 'Inactif'}
                        </Badge>
                    </Info>
                    <Info label="Créé le">
                        {formatDate(new Date(restaurant.createdAt))}
                    </Info>
                </CardContent>
            </Card>

            {/* Statistiques */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Commandes Total"
                    value={formatNumber(restaurant.stats.totalOrders)}
                    sub={`${restaurant.stats.ordersThisMonth} ce mois`}
                    icon={<ShoppingCart className="h-4 w-4 text-zinc-500" />}
                />

                <StatCard
                    title="Revenu Total"
                    value={formatPrice(restaurant.stats.totalRevenue)}
                    icon={<TrendingUp className="h-4 w-4 text-zinc-500" />}
                />

                <StatCard
                    title="Produits"
                    value={formatNumber(restaurant._count.products)}
                    icon={<Building2 className="h-4 w-4 text-zinc-500" />}
                />

                <StatCard
                    title="Tables"
                    value={formatNumber(restaurant._count.tables)}
                    icon={<Building2 className="h-4 w-4 text-zinc-500" />}
                />
            </div>

            {/* Utilisateurs */}
            <Card>
                <CardHeader>
                    <CardTitle>Utilisateurs</CardTitle>
                    <CardDescription>
                        Liste des membres de ce restaurant
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User ID</TableHead>
                                <TableHead>Rôle</TableHead>
                                <TableHead>Ajouté le</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {restaurant.users.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={3}
                                        className="text-center text-zinc-600"
                                    >
                                        Aucun utilisateur
                                    </TableCell>
                                </TableRow>
                            ) : (
                                restaurant.users.map((user) => {
                                    const roleBadge = getRoleBadge(
                                        user.role as SystemRole
                                    )

                                    return (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-mono text-sm">
                                                {user.userId.slice(0, 8)}...
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={roleBadge.color}>
                                                    {roleBadge.label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-zinc-600">
                                                {formatDate(user.createdAt)}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}

// ----------------------------
// UI Helpers
// ----------------------------

function Info({
    label,
    children,
}: {
    label: string
    children: React.ReactNode
}) {
    return (
        <div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">{label}</p>
            <div className="font-medium">{children}</div>
        </div>
    )
}

function StatCard({
    title,
    value,
    sub,
    icon,
}: {
    title: string
    value: string | number
    sub?: string
    icon: React.ReactNode
}) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {sub && (
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                        {sub}
                    </p>
                )}
            </CardContent>
        </Card>
    )
}
