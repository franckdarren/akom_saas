// app/(dashboard)/dashboard/warehouse/transfers/page.tsx
import { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Package, ArrowRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Breadcrumb,
    BreadcrumbList,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Badge } from '@/components/ui/badge'
import { getCurrentUserAndRestaurant } from '@/lib/auth/session'
import prisma from '@/lib/prisma'

export const metadata: Metadata = {
    title: 'Historique des transferts | Akôm',
    description: 'Suivi de tous les transferts du magasin vers le stock opérationnel',
}

/**
 * Page d'historique des transferts du magasin vers le stock opérationnel.
 *
 * Cette page affiche tous les transferts effectués avec :
 * - Le produit source (entrepôt) et destination (menu)
 * - Les quantités transférées avec conversion
 * - La date et l'auteur du transfert
 * - Les notes éventuelles
 *
 * Permet de tracer exactement quand et comment les produits ont été
 * réapprovisionnés depuis l'entrepôt.
 *
 * Design inspiré de Shopify Transfer Orders et Odoo Internal Transfers.
 */
export default async function WarehouseTransfersPage() {
    const { restaurantId } = await getCurrentUserAndRestaurant()

    // Récupérer tous les transferts avec les détails des produits
    const transfers = await prisma.warehouseToOpsTransfer.findMany({
        where: { restaurantId },
        include: {
            warehouseProduct: {
                select: {
                    id: true,
                    name: true,
                    imageUrl: true,
                    storageUnit: true,
                },
            },
            opsProduct: {
                select: {
                    id: true,
                    name: true,
                    imageUrl: true,
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
        take: 100, // Limiter à 100 transferts pour les performances
    })

    // Calculer des statistiques
    const totalTransfers = transfers.length
    const last7Days = transfers.filter(t => {
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        return new Date(t.createdAt) >= weekAgo
    }).length

    return (
        <>
            {/* Header */}
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <div className="flex justify-between w-full">
                    <div className='my-auto'>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/dashboard">Magasin</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Historique des transferts</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </div>
                </div>
            </header >
            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold tracking-tight">
                                Historique des transferts
                            </h1>
                        </div>
                        <p className="text-muted-foreground mt-1">
                            Tous les transferts du magasin vers votre stock opérationnel
                        </p>
                    </div>
                </div>

                {/* Statistiques rapides */}
                <div className="grid gap-4 md:grid-cols-2">
                    <Card className="p-6">
                        <div className="flex items-start gap-4">
                            <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/20">
                                <Package className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-muted-foreground">
                                    Total des transferts
                                </p>
                                <p className="text-2xl font-bold mt-1">
                                    {totalTransfers}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Depuis la création de l'entrepôt
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-start gap-4">
                            <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                                <ArrowRight className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-muted-foreground">
                                    Transferts récents
                                </p>
                                <p className="text-2xl font-bold mt-1">
                                    {last7Days}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Ces 7 derniers jours
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Tableau des transferts */}
                <Card className="p-6">
                    <Suspense fallback={<TableSkeleton />}>
                        {transfers.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <Package className="h-12 w-12 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold">Aucun transfert enregistré</h3>
                                <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                                    Les transferts du magasin vers votre stock opérationnel apparaîtront ici
                                </p>
                                <Button asChild className="mt-4">
                                    <Link href="/dashboard/warehouse">
                                        Voir les produits d'entrepôt
                                    </Link>
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold">
                                        {transfers.length} transfert{transfers.length > 1 ? 's' : ''}
                                    </h3>
                                    {transfers.length === 100 && (
                                        <Badge variant="outline" className="text-orange-600">
                                            Limite de 100 résultats atteinte
                                        </Badge>
                                    )}
                                </div>

                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Depuis le magasin</TableHead>
                                                <TableHead className="text-center">→</TableHead>
                                                <TableHead>Vers le restaurant</TableHead>
                                                <TableHead>Notes</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {transfers.map((transfer) => (
                                                <TableRow key={transfer.id}>
                                                    {/* Date */}
                                                    <TableCell>
                                                        <div className="flex flex-col gap-1">
                                                            <span className="font-medium">
                                                                {new Date(transfer.createdAt).toLocaleDateString('fr-FR', {
                                                                    day: 'numeric',
                                                                    month: 'short',
                                                                })}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground">
                                                                {new Date(transfer.createdAt).toLocaleTimeString('fr-FR', {
                                                                    hour: '2-digit',
                                                                    minute: '2-digit',
                                                                })}
                                                            </span>
                                                        </div>
                                                    </TableCell>

                                                    {/* Produit source (entrepôt) */}
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <div className="relative h-10 w-10 rounded-md overflow-hidden bg-muted flex-shrink-0">
                                                                {transfer.warehouseProduct.imageUrl ? (
                                                                    <Image
                                                                        src={transfer.warehouseProduct.imageUrl}
                                                                        alt={transfer.warehouseProduct.name}
                                                                        fill
                                                                        className="object-contain"
                                                                    />
                                                                ) : (
                                                                    <div className="flex items-center justify-center h-full">
                                                                        <Package className="h-5 w-5 text-muted-foreground" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex flex-col gap-1">
                                                                <Link
                                                                    href={`/dashboard/warehouse/products/${transfer.warehouseProduct.id}`}
                                                                    className="font-medium hover:underline"
                                                                >
                                                                    {transfer.warehouseProduct.name}
                                                                </Link>
                                                                <span className="text-xs text-muted-foreground">
                                                                    {/* ✅ Convertir le Decimal en number pour l'affichage */}
                                                                    {Number(transfer.warehouseQuantity)} {transfer.warehouseProduct.storageUnit}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </TableCell>

                                                    {/* Flèche de conversion */}
                                                    <TableCell className="text-center">
                                                        <div className="flex flex-col items-center gap-1">
                                                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                                            <Badge variant="outline" className="text-xs">
                                                                {/* ✅ Convertir le Decimal en number pour l'affichage */}
                                                                ×{Number(transfer.conversionRatio)}
                                                            </Badge>
                                                        </div>
                                                    </TableCell>

                                                    {/* Produit destination (menu) */}
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <div className="relative h-10 w-10 rounded-md overflow-hidden bg-muted flex-shrink-0">
                                                                {transfer.opsProduct.imageUrl ? (
                                                                    <Image
                                                                        src={transfer.opsProduct.imageUrl}
                                                                        alt={transfer.opsProduct.name}
                                                                        fill
                                                                        className="object-contain"
                                                                    />
                                                                ) : (
                                                                    <div className="flex items-center justify-center h-full">
                                                                        <Package className="h-5 w-5 text-muted-foreground" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex flex-col gap-1">
                                                                <Link
                                                                    href={`/dashboard/menu/products/${transfer.opsProduct.id}`}
                                                                    className="font-medium hover:underline text-green-600 dark:text-green-400"
                                                                >
                                                                    {transfer.opsProduct.name}
                                                                </Link>
                                                                <span className="text-xs text-green-600 dark:text-green-400 font-semibold">
                                                                    {/* ✅ Convertir le Decimal en number pour l'affichage */}
                                                                    +{Number(transfer.opsQuantity)} unités
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </TableCell>

                                                    {/* Notes */}
                                                    <TableCell>
                                                        {transfer.notes ? (
                                                            <p className="text-sm text-muted-foreground italic max-w-xs truncate">
                                                                {transfer.notes}
                                                            </p>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground">—</span>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        )}
                    </Suspense>
                </Card>
            </div>
        </>
    )
}

// Composant de loading
function TableSkeleton() {
    return (
        <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded" />
            ))}
        </div>
    )
}