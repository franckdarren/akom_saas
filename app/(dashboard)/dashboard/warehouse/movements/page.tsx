// app/(dashboard)/dashboard/warehouse/movements/page.tsx
import { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import { ArrowLeft, Download } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { getCurrentUserAndRestaurant } from '@/lib/auth/session'
import prisma from '@/lib/prisma'
import { WarehouseMovementsTimeline } from '@/components/warehouse/WarehouseMovementsTimeline'
import { MovementsFilters } from '@/components/warehouse/MovementsFilters'
import { MovementsStats } from '@/components/warehouse/MovementsStats'
import {SidebarTrigger} from "@/components/ui/sidebar";
import {Separator} from "@/components/ui/separator";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList, BreadcrumbPage,
    BreadcrumbSeparator
} from "@/components/ui/breadcrumb";

export const metadata: Metadata = {
    title: 'Mouvements de stock | Akôm',
    description: 'Historique complet des mouvements d\'entrepôt',
}

interface PageProps {
    searchParams: {
        productId?: string
        type?: string
        startDate?: string
        endDate?: string
    }
}

/**
 * Page d'historique complet des mouvements de stock d'entrepôt.
 *
 * Affiche tous les mouvements avec :
 * - Filtres par produit, type, période
 * - Statistiques agrégées
 * - Timeline détaillée
 * - Export possible (future feature)
 *
 * Design inspiré de Stripe Payments List et QuickBooks Transactions.
 */
export default async function WarehouseMovementsPage({ searchParams }: PageProps) {
    const { restaurantId } = await getCurrentUserAndRestaurant()

    // Construire les filtres de recherche
    const where: any = { restaurantId }

    if (searchParams.productId) {
        where.warehouseProductId = searchParams.productId
    }

    if (searchParams.type) {
        where.movementType = searchParams.type
    }

    if (searchParams.startDate || searchParams.endDate) {
        where.createdAt = {}
        if (searchParams.startDate) {
            where.createdAt.gte = new Date(searchParams.startDate)
        }
        if (searchParams.endDate) {
            where.createdAt.lte = new Date(searchParams.endDate)
        }
    }

    // Récupérer les mouvements avec pagination
    const movements = await prisma.warehouseMovement.findMany({
        where,
        include: {
            warehouseProduct: {
                select: {
                    id: true,
                    name: true,
                    storageUnit: true,
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
        take: 100, // Limiter à 100 résultats pour les performances
    })

    // Calculer des statistiques sur la période filtrée
    const stats = await calculateMovementsStats(restaurantId, where)

    // Récupérer la liste des produits pour le filtre
    const products = await prisma.warehouseProduct.findMany({
        where: { restaurantId },
        select: {
            id: true,
            name: true,
        },
        orderBy: {
            name: 'asc',
        },
    })

    return (
        <>
            {/* Header */}
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <div className="flex justify-between w-full">
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/dashboard/warehouse">Magasin</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Mouvements de stock</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header>

            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3">

                            <h1 className="text-3xl font-bold tracking-tight">
                                Mouvements de stock
                            </h1>
                        </div>
                        <p className="text-muted-foreground mt-1">
                            Historique complet de tous les mouvements d'entrepôt
                        </p>
                    </div>

                    {/* Export (future feature) */}
                    <Button variant="outline" disabled className="gap-2">
                        <Download className="h-4 w-4" />
                        Exporter (à venir)
                    </Button>
                </div>

                {/* Statistiques de la période */}
                <Suspense fallback={<StatsCardsSkeleton />}>
                    <MovementsStats stats={stats} />
                </Suspense>

                {/* Filtres et liste */}
                <Card className="p-6">
                    <div className="space-y-6">
                        {/* Barre de filtres */}
                        <MovementsFilters products={products} />

                        {/* Nombre de résultats */}
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>
                            {movements.length} mouvement{movements.length > 1 ? 's' : ''} trouvé{movements.length > 1 ? 's' : ''}
                        </span>
                            {movements.length === 100 && (
                                <span className="text-orange-600">
                                Limite de 100 résultats atteinte. Affinez vos filtres.
                            </span>
                            )}
                        </div>

                        {/* Timeline des mouvements */}
                        <Suspense fallback={<TimelineSkeleton />}>
                            <WarehouseMovementsTimeline movements={movements} />
                        </Suspense>
                    </div>
                </Card>
            </div>
        </>
    )
}

/**
 * Calcule les statistiques agrégées des mouvements.
 */
async function calculateMovementsStats(restaurantId: string, where: any) {
    const movements = await prisma.warehouseMovement.findMany({
        where,
        select: {
            movementType: true,
            quantity: true,
        },
    })

    const stats = {
        totalMovements: movements.length,
        entries: movements.filter(m => m.movementType === 'entry').length,
        exits: movements.filter(m => m.movementType === 'exit').length,
        transfers: movements.filter(m => m.movementType === 'transfer_to_ops').length,
        adjustments: movements.filter(m => m.movementType === 'adjustment').length,
        totalQuantityIn: movements
            .filter(m => m.quantity > 0)
            .reduce((sum, m) => sum + Number(m.quantity), 0),
        totalQuantityOut: movements
            .filter(m => m.quantity < 0)
            .reduce((sum, m) => sum + Math.abs(Number(m.quantity)), 0),
    }

    return stats
}

// Composants de loading
function StatsCardsSkeleton() {
    return (
        <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
                <Card key={i} className="p-6">
                    <div className="animate-pulse space-y-3">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                    </div>
                </Card>
            ))}
        </div>
    )
}

function TimelineSkeleton() {
    return (
        <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700" />
                    <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                    </div>
                </div>
            ))}
        </div>
    )
}