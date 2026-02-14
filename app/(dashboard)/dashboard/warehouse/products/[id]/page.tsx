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

export default async function WarehouseProductDetailPage({ params }: PageProps) {
    const { id } = await params
    if (!id) notFound()

    const res = await getWarehouseProductById(id)

    /**
     * ✅ CORRECTION : Vérification correcte de l'union discriminée
     *
     * Nous vérifions d'abord si success est false (ce qui signifie qu'il y a une erreur).
     * TypeScript comprend maintenant que dans ce cas, res a la propriété error.
     *
     * Cette approche est appelée "narrowing" : TypeScript rétrécit le type possible
     * de res en fonction de la condition que nous vérifions.
     */
    if (!res.success) {
        // Dans ce bloc, TypeScript sait que res est de type { error: string }
        // On pourrait logger l'erreur si on voulait : console.error(res.error)
        notFound()
    }

    /**
     * À partir d'ici, TypeScript sait que res.success est true,
     * donc res est de type { success: true, data: WarehouseProductDetail }
     *
     * Nous pouvons maintenant accéder à res.data en toute sécurité.
     * TypeScript garantit que data existe et a le bon type.
     */
    const productFromDb = res.data

    /**
     * Interface pour le stock transformé côté client.
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

    interface TransformedLinkedProduct {
        id: string
        name: string
        imageUrl: string | null
        stock: Array<{
            quantity: number
        }>
    }

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
        createdAt: productFromDb.createdAt ? new Date(productFromDb.createdAt) : new Date(),
        updatedAt: productFromDb.updatedAt ? new Date(productFromDb.updatedAt) : new Date(),
        stock,
        isLowStock: productFromDb.isLowStock,
        movements: productFromDb.movements,
        linkedProduct: productFromDb.linkedProduct
            ? ({
                id: productFromDb.linkedProduct.id,
                name: productFromDb.linkedProduct.name,
                imageUrl: productFromDb.linkedProduct.imageUrl,
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