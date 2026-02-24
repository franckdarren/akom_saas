// app/(dashboard)/dashboard/warehouse/page.tsx
import {Suspense} from 'react'
import {Metadata} from 'next'
import Link from 'next/link'
import {Package, Plus, TrendingDown, AlertTriangle} from 'lucide-react'

import {Button} from '@/components/ui/button'
import {Card} from '@/components/ui/card'
import {WarehouseStatsCards} from '@/components/warehouse/WarehouseStatsCards'
import {WarehouseProductsTable} from '@/components/warehouse/WarehouseProductsTable'
import {WarehouseFilters} from '@/components/warehouse/WarehouseFilters'
import {getWarehouseStats, getWarehouseProducts} from '@/lib/actions/warehouse'
import {WarehouseProductWithStock} from '@/types/warehouse'
import {FeatureGuard} from '@/components/guards/FeatureGuard'
import {getCurrentUserAndRestaurant} from '@/lib/auth/session'
import {SidebarTrigger} from "@/components/ui/sidebar"
import {Separator} from "@/components/ui/separator"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator
} from "@/components/ui/breadcrumb"

export const metadata: Metadata = {
    title: 'Magasin de stockage | Akôm',
    description: "Gérez votre stock d'entrepôt et vos transferts vers le restaurant",
}

export default async function WarehousePage({
                                                searchParams,
                                            }: {
    searchParams: {
        category?: string
        storageUnit?: string
        lowStock?: string
        search?: string
    }
}) {
    // Récupérer le restaurantId pour la protection
    const {restaurantId} = await getCurrentUserAndRestaurant()

    // Récupérer les statistiques du magasin
    const statsResult = await getWarehouseStats()
    const stats = statsResult.success ? statsResult.data : null

    // Récupérer les produits avec filtres
    const productsResult = await getWarehouseProducts({
        category: searchParams.category,
        storageUnit: searchParams.storageUnit,
        lowStockOnly: searchParams.lowStock === 'true',
        search: searchParams.search,
    })

    // Conversion complète Decimal → number
    const products: WarehouseProductWithStock[] = productsResult.success
        ? productsResult.data.map(p => {
            const stock = p.stock
                ? {
                    id: p.stock.id,
                    restaurantId: p.stock.restaurantId,
                    warehouseProductId: p.stock.warehouseProductId,
                    quantity: Number(p.stock.quantity),
                    alertThreshold: Number(p.stock.alertThreshold),
                    unitCost: p.stock.unitCost != null ? Number(p.stock.unitCost) : null,
                    totalValue:
                        p.stock.unitCost != null
                            ? Number(p.stock.quantity) * Number(p.stock.unitCost)
                            : null,
                    lastInventoryDate: p.stock.lastInventoryDate,
                    updatedAt: p.stock.updatedAt,
                }
                : {
                    id: '',
                    restaurantId: p.restaurantId,
                    warehouseProductId: p.id,
                    quantity: 0,
                    alertThreshold: 0,
                    unitCost: null,
                    totalValue: null,
                    lastInventoryDate: null,
                    updatedAt: new Date(),
                }

            return {
                id: p.id,
                restaurantId: p.restaurantId,
                name: p.name,
                sku: p.sku,
                description: p.description,
                storageUnit: p.storageUnit,
                unitsPerStorage: p.unitsPerStorage,
                category: p.category,
                imageUrl: p.imageUrl,
                linkedProductId: p.linkedProductId,
                conversionRatio: Number(p.conversionRatio),
                notes: p.notes,
                isActive: p.isActive,
                createdAt: p.createdAt,
                updatedAt: p.updatedAt,
                stock,
                isLowStock: p.isLowStock,
                linkedProduct: p.linkedProduct
                    ? {
                        id: p.linkedProduct.id,
                        name: p.linkedProduct.name,
                        imageUrl: p.linkedProduct.imageUrl,
                        currentStock: Number(p.linkedProduct.currentStock ?? 0),
                    }
                    : undefined,
            }
        })
        : []

    // ============================================================
    // PROTECTION : Vérifier que l'utilisateur a accès au module warehouse
    // ============================================================

    return (
        <FeatureGuard
            restaurantId={restaurantId}
            requiredFeature="warehouse_module"
            showError={true}
        >
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1"/>
                <Separator orientation="vertical" className="mr-2 h-4"/>
                <div className="flex justify-between w-full">
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/dashboard">Magasin</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator/>
                            <BreadcrumbItem>
                                <BreadcrumbPage>Magasin de stockage</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header>

            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Magasin de stockage</h1>
                        <p className="text-muted-foreground mt-1">
                            Gérez votre stock d&apos;entrepôt et réapprovisionnez votre restaurant
                        </p>
                    </div>

                    <Button asChild size="lg" className="gap-2">
                        <Link href="/dashboard/warehouse/products/new">
                            <Plus className="h-4 w-4"/>
                            Nouveau produit
                        </Link>
                    </Button>
                </div>

                <Suspense fallback={<StatsCardsSkeleton/>}>
                    <WarehouseStatsCards stats={stats}/>
                </Suspense>

                <Card className="p-6">
                    <div className="space-y-6">
                        <WarehouseFilters/>

                        {stats && stats.lowStockCount > 0 && (
                            <div
                                className="flex items-center gap-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 p-4">
                                <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400"/>
                                <div className="flex-1">
                                    <p className="font-medium text-orange-900 dark:text-orange-100">
                                        {stats.lowStockCount}{' '}
                                        {stats.lowStockCount === 1 ? 'produit' : 'produits'} sous le seuil d&apos;alerte
                                    </p>
                                    <p className="text-sm text-orange-700 dark:text-orange-300">
                                        Pensez à réapprovisionner votre entrepôt pour éviter les ruptures
                                    </p>
                                </div>
                                <Button variant="outline" size="sm" asChild>
                                    <Link href="/dashboard/warehouse?lowStock=true">Voir les produits</Link>
                                </Button>
                            </div>
                        )}

                        <Suspense fallback={<TableSkeleton/>}>
                            <WarehouseProductsTable products={products}/>
                        </Suspense>
                    </div>
                </Card>

                <div className="grid gap-4 md:grid-cols-2">
                    <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer">
                        <Link href="/dashboard/warehouse/movements" className="block">
                            <div className="flex items-start gap-4">
                                <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                                    <TrendingDown className="h-6 w-6 text-blue-600 dark:text-blue-400"/>
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-lg">Mouvements de stock</h3>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Consultez l&apos;historique complet de tous les mouvements d&apos;entrepôt
                                    </p>
                                </div>
                            </div>
                        </Link>
                    </Card>

                    <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer">
                        <Link href="/dashboard/warehouse/transfers" className="block">
                            <div className="flex items-start gap-4">
                                <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/20">
                                    <Package className="h-6 w-6 text-green-600 dark:text-green-400"/>
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-lg">Transferts vers restaurant</h3>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Historique des transferts depuis l&#39;entrepôt vers votre stock opérationnel
                                    </p>
                                </div>
                            </div>
                        </Link>
                    </Card>
                </div>
            </div>
        </FeatureGuard>
    )
}

// Skeletons
function StatsCardsSkeleton() {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
                <Card key={i} className="p-6">
                    <div className="animate-pulse space-y-3">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"/>
                        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"/>
                    </div>
                </Card>
            ))}
        </div>
    )
}

function TableSkeleton() {
    return (
        <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded"/>
            ))}
        </div>
    )
}