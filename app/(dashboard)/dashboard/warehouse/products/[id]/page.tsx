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

    if (!res.success) {
        notFound()
    }

    const productFromDb = res.data

    /**
     * Transformation du stock depuis la Server Action.
     *
     * Au lieu de créer un tableau avec un seul élément, nous travaillons directement
     * avec l'objet stock. Cette approche est plus simple et reflète mieux la réalité :
     * un produit d'entrepôt a toujours exactement un stock associé, jamais zéro, jamais plusieurs.
     *
     * Si le stock n'existe pas (ce qui ne devrait jamais arriver dans une base de données cohérente),
     * nous affichons simplement un message d'erreur plutôt que de créer un tableau vide.
     */

    // Vérifier que le stock existe
    if (!productFromDb.stock) {
        // Dans une application en production, vous devriez logger cette erreur
        // car cela indique un état incohérent de votre base de données
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-2">Erreur de données</h2>
                    <p className="text-muted-foreground">
                        Ce produit n'a pas de stock associé. Contactez le support.
                    </p>
                </div>
            </div>
        )
    }

    /**
     * Créer l'objet stock transformé avec les dates converties.
     *
     * Nous convertissons les ISO strings en objets Date pour l'affichage,
     * et nous calculons la valeur totale si le coût unitaire est disponible.
     */
    const stock = {
        id: productFromDb.stock.id,
        restaurantId: productFromDb.stock.restaurantId,
        warehouseProductId: productFromDb.stock.warehouseProductId,
        quantity: productFromDb.stock.quantity,
        alertThreshold: productFromDb.stock.alertThreshold,
        unitCost: productFromDb.stock.unitCost,
        totalValue: productFromDb.stock.unitCost !== null
            ? productFromDb.stock.quantity * productFromDb.stock.unitCost
            : null,
        lastInventoryDate: productFromDb.stock.lastInventoryDate
            ? new Date(productFromDb.stock.lastInventoryDate)
            : null,
        updatedAt: new Date(productFromDb.stock.updatedAt),
    }

    /**
     * Construire l'objet produit complet pour l'affichage.
     *
     * Nous combinons les données du produit de la base avec le stock transformé
     * et les données du produit lié s'il existe.
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
        createdAt: productFromDb.createdAt ? new Date(productFromDb.createdAt) : new Date(),
        updatedAt: productFromDb.updatedAt ? new Date(productFromDb.updatedAt) : new Date(),
        // Passer le stock comme un tableau pour correspondre aux types attendus par QuickActionsButtons
        stock: [stock],
        isLowStock: productFromDb.isLowStock,
        movements: productFromDb.movements,
        linkedProduct: productFromDb.linkedProduct
            ? {
                id: productFromDb.linkedProduct.id,
                name: productFromDb.linkedProduct.name,
                imageUrl: productFromDb.linkedProduct.imageUrl,
                stock: productFromDb.linkedProduct.stock?.map(s => ({
                    quantity: s.quantity,
                })) ?? [],
            }
            : undefined,
    }

    // Calculer si le stock est bas pour l'affichage
    const isLowStock = stock.quantity < stock.alertThreshold

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

                        {/* Passer le stock singulier au composant, pas le tableau */}
                        <QuickActionsButtons product={product} stock={stock} />
                    </div>
                </div>

                {/* STOCK - Afficher avec Badge si stock bas */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Stock actuel</CardTitle>
                            {isLowStock && (
                                <span className="inline-flex items-center rounded-md bg-orange-50 px-2 py-1 text-xs font-medium text-orange-700 ring-1 ring-inset ring-orange-600/20 dark:bg-orange-900/20 dark:text-orange-400 dark:ring-orange-600/30">
                                    Stock bas
                                </span>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">{stock.quantity}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            Seuil d'alerte : {stock.alertThreshold}
                        </p>
                        {stock.unitCost && (
                            <p className="mt-3 text-muted-foreground">
                                Valeur totale : <span className="font-semibold text-foreground">
                                    {formatPrice(stock.quantity * stock.unitCost)}
                                </span>
                            </p>
                        )}
                        {stock.lastInventoryDate && (
                            <p className="text-xs text-muted-foreground mt-2">
                                Dernier inventaire : {stock.lastInventoryDate.toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                            })}
                            </p>
                        )}
                    </CardContent>
                </Card>

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