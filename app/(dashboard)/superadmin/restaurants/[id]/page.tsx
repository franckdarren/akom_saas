'use client'

import { getRestaurantDetails } from '@/lib/actions/superadmin'
import { formatDate, formatNumber, formatPrice } from '@/lib/utils/format'
import { getRoleBadge } from '@/lib/utils/permissions'
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
import { SystemRole } from '@/types/auth'

// ----------------------------
// Typage des utilisateurs et restaurant
// ----------------------------

export type RestaurantUserType = {
    id: string
    userId: string
    role: string // admin, kitchen, manager, delivery, etc.
    createdAt: Date
}

export type RestaurantDetailsType = {
    id: string
    name: string
    slug: string
    phone?: string | null
    address?: string | null
    isActive: boolean
    createdAt: string
    _count: {
        products: number
        tables: number
        orders: number
    }
    stats: {
        totalOrders: number
        totalRevenue: number
        ordersThisMonth: number
    }
    users: RestaurantUserType[]
}

// ----------------------------
// Props
// ----------------------------

interface PageProps {
    params: Promise<{ id: string }>
}


export default async function RestaurantDetailsPage({ params }: PageProps) {
    const { id } = await params
    const restaurantRaw = await getRestaurantDetails(id)
    const restaurant: RestaurantDetailsType = {
        ...restaurantRaw,
        createdAt: restaurantRaw.createdAt instanceof Date
            ? restaurantRaw.createdAt.toISOString()
            : restaurantRaw.createdAt,
        users: restaurantRaw.users.map((user: any) => ({
            ...user,
            role: user.role ?? '',
        })),
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/superadmin/restaurants">
                            <ArrowLeft className="h-4 w-4" />
                            Retour
                        </Link>
                    </Button>
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
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <div className="text-sm text-zinc-600 dark:text-zinc-400">
                                Téléphone
                            </div>
                            <div className="font-medium">
                                {restaurant.phone || 'Non renseigné'}
                            </div>
                        </div>
                        <div>
                            <div className="text-sm text-zinc-600 dark:text-zinc-400">
                                Adresse
                            </div>
                            <div className="font-medium">
                                {restaurant.address || 'Non renseigné'}
                            </div>
                        </div>
                        <div>
                            <div className="text-sm text-zinc-600 dark:text-zinc-400">
                                Statut
                            </div>
                            <Badge
                                variant={restaurant.isActive ? 'default' : 'outline'}
                            >
                                {restaurant.isActive ? 'Actif' : 'Inactif'}
                            </Badge>
                        </div>
                        <div>
                            <div className="text-sm text-zinc-600 dark:text-zinc-400">
                                Créé le
                            </div>
                            <div className="font-medium">
                                {formatDate(new Date(restaurant.createdAt))}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">
                            Commandes Total
                        </CardTitle>
                        <ShoppingCart className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatNumber(restaurant.stats.totalOrders)}
                        </div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">
                            {restaurant.stats.ordersThisMonth} ce mois
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">
                            Revenu Total
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatPrice(restaurant.stats.totalRevenue)}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">
                            Produits
                        </CardTitle>
                        <Building2 className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatNumber(restaurant._count.products)}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">
                            Tables
                        </CardTitle>
                        <Building2 className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatNumber(restaurant._count.tables)}
                        </div>
                    </CardContent>
                </Card>
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
                                        className="text-center text-zinc-600 dark:text-zinc-400"
                                    >
                                        Aucun utilisateur
                                    </TableCell>
                                </TableRow>
                            ) : (
                                restaurant.users.map((user: RestaurantUserType) => {
                                    const roleBadge = getRoleBadge(user.role as SystemRole)
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
                                            <TableCell className="text-zinc-600 dark:text-zinc-400">
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
