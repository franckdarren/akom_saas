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
    if (res.error || !res.data) notFound()

    const productFromDb = res.data

    // 🔹 Transformer le stock en tableau avec toutes les dates en Date
    const stock = productFromDb.stock
        ? [
            {
                ...productFromDb.stock,
                quantity: Number(productFromDb.stock.quantity),
                alertThreshold: Number(productFromDb.stock.alertThreshold),
                unitCost:
                    productFromDb.stock.unitCost !== null
                        ? Number(productFromDb.stock.unitCost)
                        : null,
                totalValue:
                    productFromDb.stock.unitCost !== null
                        ? Number(productFromDb.stock.quantity) * Number(productFromDb.stock.unitCost)
                        : null,
                lastInventoryDate: productFromDb.stock.lastInventoryDate
                    ? new Date(productFromDb.stock.lastInventoryDate)
                    : null,
                updatedAt: new Date(productFromDb.stock.updatedAt),
                createdAt: productFromDb.stock.createdAt
                    ? new Date(productFromDb.stock.createdAt)
                    : new Date(),
            },
        ]
        : []

    // 🔹 Transformer le produit principal
    const product = {
        ...productFromDb,
        conversionRatio: Number(productFromDb.conversionRatio),
        createdAt: new Date(productFromDb.createdAt),
        updatedAt: new Date(productFromDb.updatedAt),
        stock,
        linkedProduct: productFromDb.linkedProduct
            ? {
                id: productFromDb.linkedProduct.id,
                name: productFromDb.linkedProduct.name,
                imageUrl: productFromDb.linkedProduct.imageUrl,
                stock: productFromDb.linkedProduct.stock?.map((s) => ({
                    quantity: Number(s.quantity),
                })) ?? [],
            }
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
                            <Image src={product.imageUrl} alt={product.name} fill className="object-contain" />
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
                            <p className="text-sm text-muted-foreground">Seuil : {mainStock.alertThreshold}</p>
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
