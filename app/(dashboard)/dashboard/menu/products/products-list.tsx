'use client'

import Link from 'next/link'
import Image from 'next/image'
import {Card, CardContent} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogFooter,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogCancel,
    AlertDialogAction,
} from '@/components/ui/alert-dialog'

import {Edit, Trash2, Power, Package, Wrench} from 'lucide-react'
import {toggleProductAvailability, deleteProduct} from '@/lib/actions/product'
import {useState} from 'react'
import {useRouter} from 'next/navigation'
import {toast} from 'sonner'

import {
    getPriceDisplay,
    getAvailabilityStatus,
    PRODUCT_TYPE_LABELS,
} from '@/types/product'

import type {ProductType} from '@/types/product'

type Product = {
    id: string
    name: string
    description: string | null
    price: number | null
    imageUrl: string | null
    isAvailable: boolean
    category: { name: string } | null
    family: { name: string } | null
    stock: { quantity: number } | null
    productType: ProductType
    includePrice: boolean
    hasStock: boolean
}

export function ProductsList({products}: { products: Product[] }) {
    const router = useRouter()

    const [loading, setLoading] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)

    async function handleToggleAvailability(id: string) {
        setLoading(id)

        const result = await toggleProductAvailability(id)

        if (result?.error) {
            toast.error(result.error)
        } else {
            toast.success('Le produit a été mis à jour avec succès.')
        }

        setLoading(null)
        router.refresh()
    }

    function handleDelete(id: string, name: string) {
        setDeleteTarget({id, name})
    }

    async function confirmDelete() {
        if (!deleteTarget) return

        setIsLoading(true)
        setLoading(deleteTarget.id)

        const result = await deleteProduct(deleteTarget.id)

        setLoading(null)
        setIsLoading(false)

        if (result?.error) {
            toast.error(result.error)
            return
        }

        toast.success('Le produit a été supprimé avec succès.')
        router.refresh()
        setDeleteTarget(null)
    }

    if (products.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                    <p className="text-muted-foreground text-center">
                        Aucun produit pour le moment.
                        <br/>
                        Créez votre premier produit pour compléter votre menu.
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {products.map((product) => {
                    const availability = getAvailabilityStatus({
                        isAvailable: product.isAvailable,
                        hasStock: product.hasStock,
                        stockQuantity: product.stock?.quantity ?? null,
                        stockAlertThreshold: 5,
                        productType: 'good'
                    })

                    const priceDisplay = getPriceDisplay(product)

                    return (
                        <Card
                            key={product.id}
                            className="overflow-hidden hover:shadow-md transition-shadow flex flex-col"
                        >
                            {/* Image / visuel */}
                            <div className="relative h-48 bg-muted">
                                {product.imageUrl ? (
                                    <Image
                                        src={product.imageUrl}
                                        alt={product.name}
                                        fill
                                        className="object-contain"
                                    />
                                ) : (
                                    <div className="flex h-full items-center justify-center">
                                        {product.productType === 'good' ? (
                                            <Package className="h-12 w-12 text-muted-foreground"/>
                                        ) : (
                                            <Wrench className="h-12 w-12 text-muted-foreground"/>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Contenu principal */}
                            <CardContent className="px-4 flex-1 flex flex-col">
                                <div className="flex items-start justify-between mb-2 gap-2">
                                    <div className="space-y-1 flex-1 min-w-0">
                                        <h3 className="font-semibold text-lg truncate">{product.name}</h3>
                                        {product.description && (
                                            <p className="text-sm text-muted-foreground line-clamp-2">
                                                {product.description}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex flex-col gap-1 shrink-0">
                                        <Badge
                                            variant={product.productType === 'good' ? 'default' : 'secondary'}
                                        >
                                            {PRODUCT_TYPE_LABELS[product.productType]}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="space-y-2 mb-4">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Prix</span>
                                        <span className="font-semibold">
                    {priceDisplay.showPrice
                        ? `${priceDisplay.label ? priceDisplay.label + ' ' : ''}${priceDisplay.formattedPrice}`
                        : priceDisplay.label}
                </span>
                                    </div>

                                    {product.category && (
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Catégorie</span>
                                            <span className="truncate ml-2">{product.category.name}</span>
                                        </div>
                                    )}

                                    {product.family && (
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Famille</span>
                                            <span className="truncate ml-2">{product.family.name}</span>
                                        </div>
                                    )}

                                    {product.hasStock && product.stock && (
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Stock</span>
                                            <Badge variant={availability.variant as any}>{availability.status}</Badge>
                                        </div>
                                    )}
                                </div>

                                {/* ⚡ Boutons fixés en bas */}
                                <div className="flex gap-2 mt-auto">
                                    <Link href={`/dashboard/menu/products/${product.id}/edit`} className="flex-1">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full"
                                            disabled={loading === product.id}
                                        >
                                            <Edit className="h-4 w-4 mr-2"/>
                                            Modifier
                                        </Button>
                                    </Link>

                                    <Button
                                        size="sm"
                                        onClick={() => handleToggleAvailability(product.id)}
                                        disabled={loading === product.id}
                                    >
                                        <Power className="h-4 w-4"/>
                                    </Button>

                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => handleDelete(product.id, product.name)}
                                        disabled={loading === product.id}
                                    >
                                        <Trash2 className="h-4 w-4"/>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                    )
                })}
            </div>

            <AlertDialog
                open={!!deleteTarget}
                onOpenChange={() => setDeleteTarget(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Supprimer le produit {deleteTarget?.name} ?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Cette action est irréversible.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>

                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={isLoading}
                        >
                            Supprimer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
