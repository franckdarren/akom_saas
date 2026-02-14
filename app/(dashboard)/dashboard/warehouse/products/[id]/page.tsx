// app/(dashboard)/dashboard/warehouse/products/[id]/page.tsx
import { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Edit, Package } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

import { getWarehouseProductById } from "@/lib/actions/warehouse"
import { formatPrice } from "@/lib/utils/format"
import { WarehouseMovementsTimeline } from "@/components/warehouse/WarehouseMovementsTimeline"
import { QuickActionsButtons } from "@/components/warehouse/QuickActionsButtons"

export const metadata: Metadata = {
    title: "Détail produit entrepôt | Akôm",
}

interface PageProps {
    params: Promise<{ id: string }>
}

/**
 * Cette page affiche les détails complets d'un produit d'entrepôt.
 *
 * Elle récupère les données depuis la Server Action getWarehouseProductById qui retourne
 * des données déjà transformées avec les Decimal convertis en number et les dates sérialisées.
 *
 * Pour éviter les erreurs TypeScript, nous devons typer explicitement toutes les transformations
 * supplémentaires que nous effectuons côté client, notamment la conversion des ISO strings
 * en objets Date pour l'affichage.
 */
export default async function WarehouseProductDetailPage({ params }: PageProps) {
    const { id } = await params
    if (!id) notFound()

    const res = await getWarehouseProductById(id)
    if (res.error || !res.data) notFound()

    const productFromDb = res.data

    /**
     * Interface pour le stock transformé côté client.
     *
     * Cette interface définit exactement la structure que nous créons après avoir
     * converti les ISO strings en objets Date. Elle garantit que TypeScript comprend
     * précisément ce que nous manipulons et peut vérifier la cohérence des types.
     */
    interface TransformedStock {
        id: string
        restaurantId: string
        warehouseProductId: string
        quantity: number
        alertThreshold: number
        unitCost: number | null
        totalValue: number | null
        lastInventoryDate: Date | null
        updatedAt: Date
    }

    /**
     * Transformation du stock avec typage explicite.
     *
     * Nous créons un tableau de TransformedStock en convertissant les ISO strings
     * en objets Date. Le typage explicite permet à TypeScript de vérifier que chaque
     * propriété est correctement définie et utilisée.
     */
    const stock: TransformedStock[] = productFromDb.stock
        ? [
            {
                id: productFromDb.stock.id,
                restaurantId: productFromDb.stock.restaurantId,
                warehouseProductId: productFromDb.stock.warehouseProductId,
                quantity: productFromDb.stock.quantity,
                alertThreshold: productFromDb.stock.alertThreshold,
                unitCost: productFromDb.stock.unitCost,
                totalValue:
                    productFromDb.stock.unitCost !== null
                        ? productFromDb.stock.quantity * productFromDb.stock.unitCost
                        : null,
                lastInventoryDate: productFromDb.stock.lastInventoryDate
                    ? new Date(productFromDb.stock.lastInventoryDate)
                    : null,
                updatedAt: new Date(productFromDb.stock.updatedAt),
            },
        ]
        : []

    /**
     * Interface pour le produit lié transformé.
     *
     * Cette interface définit la structure du produit menu lié après transformation.
     * Elle inclut un tableau de stock typé explicitement pour éviter les erreurs
     * de type implicite any dans les fonctions map.
     */
    interface TransformedLinkedProduct {
        id: string
        name: string
        imageUrl: string | null
        stock: Array<{
            quantity: number
        }>
    }

    /**
     * Transformation du produit avec typage explicite complet.
     *
     * Nous définissons chaque propriété du produit transformé avec son type exact.
     * Pour le linkedProduct, nous utilisons l'interface TransformedLinkedProduct
     * qui type explicitement le tableau stock, éliminant ainsi l'erreur any.
     */
    const product = {
        id: productFromDb.id,
        restaurantId: productFromDb.restaurantId,
        name: productFromDb.name,
        sku: productFromDb.sku,
        description: productFromDb.description,
        storageUnit: productFromDb.storageUnit,
        unitsPerStorage: productFromDb.unitsPerStorage,
        category: productFromDb.category,
        imageUrl: productFromDb.imageUrl,
        linkedProductId: productFromDb.linkedProductId,
        conversionRatio: productFromDb.conversionRatio,
        notes: productFromDb.notes,
        isActive: productFromDb.isActive,
        createdAt: new Date(productFromDb.createdAt!),
        updatedAt: new Date(productFromDb.updatedAt!),
        stock,
        isLowStock: productFromDb.isLowStock,
        movements: productFromDb.movements,
        linkedProduct: productFromDb.linkedProduct
            ? ({
                id: productFromDb.linkedProduct.id,
                name: productFromDb.linkedProduct.name,
                imageUrl: productFromDb.linkedProduct.imageUrl,
                // ✅ CORRECTION : Typage explicite du paramètre s dans map
                // En définissant le type du paramètre, nous éliminons l'erreur any
                stock: productFromDb.linkedProduct.stock?.map((s: { quantity: number }) => ({
                    quantity: s.quantity,
                })) ?? [],
            } as TransformedLinkedProduct)
            : undefined,
    }

    const mainStock = stock[0]
    const isLowStock = mainStock ? mainStock.quantity < mainStock.alertThreshold : false

    return (
        <>
            {/* HEADER */}
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
                                <BreadcrumbPage>Détails d&apos;un produit</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header>

            <div className="flex flex-1 flex-col gap-4 p-4">
                {/* IMAGE + INFOS */}
                <div className="grid gap-6 md:grid-cols-[300px_1fr]">
                    <div className="relative aspect-square rounded-lg border overflow-hidden bg-muted">
                        {product.imageUrl ? (
                            <Image
                                src={product.imageUrl}
                                alt={product.name}
                                fill
                                className="object-contain"
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <Package className="h-24 w-24 text-muted-foreground" />
                            </div>
                        )}
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
                                {product.sku && (
                                    <p className="text-sm text-muted-foreground font-mono mt-1">
                                        SKU: {product.sku}
                                    </p>
                                )}
                            </div>

                            <Button asChild size="sm" variant="outline">
                                <Link href={`/dashboard/warehouse/products/${product.id}/edit`}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Modifier
                                </Link>
                            </Button>
                        </div>

                        <QuickActionsButtons product={product} stock={stock} />
                    </div>
                </div>

                {/* STOCK */}
                {mainStock && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Stock actuel</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold">{mainStock.quantity}</p>
                            <p className="text-sm text-muted-foreground">
                                Seuil : {mainStock.alertThreshold}
                            </p>
                            {mainStock.unitCost && (
                                <p className="mt-2">
                                    Valeur : {formatPrice(mainStock.quantity * mainStock.unitCost)}
                                </p>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* HISTORIQUE */}
                <Card>
                    <CardHeader>
                        <CardTitle>Historique des mouvements</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <WarehouseMovementsTimeline movements={product.movements} />
                    </CardContent>
                </Card>
            </div>
        </>
    )
}