import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Edit, Package, TrendingUp, History } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

import { getWarehouseProductById } from '@/lib/actions/warehouse' // ✅ nouvelle action serveur
import { formatPrice } from '@/lib/utils/format'
import { WarehouseMovementsTimeline } from '@/components/warehouse/WarehouseMovementsTimeline'
import { QuickActionsButtons } from '@/components/warehouse/QuickActionsButtons'

export const metadata: Metadata = {
    title: 'Détail produit entrepôt | Akôm',
}

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function WarehouseProductDetailPage({ params }: PageProps) {
    const { id } = await params
    if (!id) notFound()

    // ✅ Utilisation de l'action serveur centralisée
    const res = await getWarehouseProductById(id)
    if (res.error || !res.data) notFound()
    const product = res.data

    const stock = product.stock
    const isLowStock = stock ? stock.quantity < stock.alertThreshold : false
    const linkedProduct = product.linkedProduct
    const linkedProductStock = linkedProduct?.stock?.[0]

    return (
        <>
            {/* Header avec navigation */}
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
                                <BreadcrumbPage>Détails d&#39;un produit</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header>

            <div className="flex flex-1 flex-col gap-4 p-4">
                {/* Section principale : Infos produit + Image */}
                <div className="grid gap-6 md:grid-cols-[300px_1fr]">
                    <div className="relative aspect-square rounded-lg border overflow-hidden bg-muted">
                        {product.imageUrl ? (
                            <Image src={product.imageUrl} alt={product.name} fill className="object-contain" />
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <Package className="h-24 w-24 text-muted-foreground" />
                            </div>
                        )}
                    </div>

                    <div className="space-y-6">
                        <div>
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
                                    {product.sku && (
                                        <p className="text-sm text-muted-foreground font-mono mt-1">SKU: {product.sku}</p>
                                    )}
                                </div>
                                <Button asChild size="sm" variant="outline">
                                    <Link href={`/dashboard/warehouse/products/${product.id}/edit`}>
                                        <Edit className="h-4 w-4 mr-2" />
                                        Modifier
                                    </Link>
                                </Button>
                            </div>

                            <div className="flex items-center gap-2 mt-3">
                                {product.category && <Badge variant="secondary">{product.category}</Badge>}
                                {isLowStock && (
                                    <Badge variant="destructive" className="gap-1">
                                        <TrendingUp className="h-3 w-3" />
                                        Stock bas
                                    </Badge>
                                )}
                                {!product.isActive && <Badge variant="outline">Inactif</Badge>}
                            </div>
                        </div>

                        {product.description && (
                            <>
                                <Separator />
                                <div>
                                    <h3 className="font-semibold mb-2">Description</h3>
                                    <p className="text-muted-foreground">{product.description}</p>
                                </div>
                            </>
                        )}

                        <Separator />
                        <div>
                            <h3 className="font-semibold mb-3">Configuration de l&apos;emballage</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Type d&apos;emballage</p>
                                    <p className="font-semibold capitalize mt-1">{product.storageUnit}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Unités par emballage</p>
                                    <p className="font-semibold mt-1">{product.unitsPerStorage} unités</p>
                                </div>
                            </div>
                        </div>

                        <Separator />
                        <QuickActionsButtons product={product} stock={stock} />
                    </div>
                </div>

                {/* Section stock */}
                {stock && (
                    <div className="grid gap-6 md:grid-cols-3">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Stock actuel</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div>
                                        <p className={`text-3xl font-bold ${isLowStock ? 'text-orange-600' : ''}`}>
                                            {stock.quantity ?? 0}
                                        </p>
                                        <p className="text-sm text-muted-foreground capitalize">{product.storageUnit}</p>
                                    </div>
                                    <Separator />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Seuil d'alerte</p>
                                        <p className="font-medium mt-1">{stock.alertThreshold ?? 0}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Valorisation</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {stock.unitCost ? (
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-3xl font-bold">
                                                {formatPrice(stock.quantity * stock.unitCost)}
                                            </p>
                                            <p className="text-sm text-muted-foreground">Valeur totale</p>
                                        </div>
                                        <Separator />
                                        <div>
                                            <p className="text-sm text-muted-foreground">Coût unitaire</p>
                                            <p className="font-medium mt-1">{formatPrice(stock.unitCost)}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">Aucun coût défini</p>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Dernier inventaire</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {stock.lastInventoryDate ? (
                                    <div className="space-y-2">
                                        <p className="text-2xl font-bold">
                                            {new Date(stock.lastInventoryDate).toLocaleDateString('fr-FR')}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Il y a {getDaysSince(stock.lastInventoryDate)} jours
                                        </p>
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">Aucun inventaire enregistré</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Linked product */}
                {linkedProduct && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Lien avec le menu</CardTitle>
                            <CardDescription>
                                Ce produit d&apos;entrepôt peut réapprovisionner un produit du menu
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-start gap-4 p-4 rounded-lg border bg-muted/50">
                                {linkedProduct.imageUrl && (
                                    <div className="relative h-16 w-16 rounded-md overflow-hidden bg-background">
                                        <Image
                                            src={linkedProduct.imageUrl}
                                            alt={linkedProduct.name}
                                            fill
                                            className="object-contain"
                                        />
                                    </div>
                                )}

                                <div className="flex-1">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="font-semibold">{linkedProduct.name}</p>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                Stock opérationnel actuel:{' '}
                                                {linkedProductStock?.quantity ?? 0} unités
                                            </p>
                                        </div>
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={`/dashboard/menu/products/${linkedProduct.id}`}>
                                                Voir produit
                                            </Link>
                                        </Button>
                                    </div>

                                    <div className="mt-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                            Conversion automatique
                                        </p>
                                        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                                            1 {product.storageUnit} → {product.conversionRatio} ×{' '}
                                            {linkedProduct.name}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Movements */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Historique des mouvements</CardTitle>
                            <CardDescription>Derniers mouvements de stock pour ce produit</CardDescription>
                        </div>
                        {product.movements.length > 0 && (
                            <Button variant="outline" size="sm" asChild>
                                <Link href={`/dashboard/warehouse/movements?productId=${product.id}`}>
                                    <History className="h-4 w-4 mr-2" />
                                    Voir tout
                                </Link>
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent>
                        <WarehouseMovementsTimeline movements={product.movements} />
                    </CardContent>
                </Card>
            </div>
        </>
    )
}

/** Calcule le nombre de jours depuis une date ISO string */
function getDaysSince(date: string | Date): number {
    const now = new Date()
    const d = typeof date === 'string' ? new Date(date) : date
    const diff = now.getTime() - d.getTime()
    return Math.floor(diff / (1000 * 60 * 60 * 24))
}
