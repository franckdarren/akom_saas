'use client'

import Link from 'next/link'
import Image from 'next/image'
import {Card, CardContent} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription,
    AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {Edit, Trash2, Power, Package, Wrench} from 'lucide-react'
import {toggleProductAvailability, deleteProduct} from '@/lib/actions/product'
import {useState} from 'react'
import {useRouter} from 'next/navigation'
import {toast} from 'sonner'
import {getPriceDisplay, getAvailabilityStatus, PRODUCT_TYPE_LABELS} from '@/types/product'
import {cn} from '@/lib/utils'
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
        if (result?.error) toast.error(result.error)
        else toast.success('Produit mis à jour.')
        setLoading(null)
        router.refresh()
    }

    async function confirmDelete() {
        if (!deleteTarget) return
        setIsLoading(true)
        setLoading(deleteTarget.id)
        const result = await deleteProduct(deleteTarget.id)
        setLoading(null)
        setIsLoading(false)
        if (result?.error) {
            toast.error(result.error);
            return
        }
        toast.success('Produit supprimé.')
        router.refresh()
        setDeleteTarget(null)
    }

    // ── État vide ────────────────────────────────────────────
    if (products.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                    <p className="text-muted-foreground text-center">
                        Aucun produit pour le moment.<br/>
                        Créez votre premier produit pour compléter votre menu.
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products.map(product => {
                    const isLoading_item = loading === product.id
                    const unavailable = !product.isAvailable

                    const availability = getAvailabilityStatus({
                        isAvailable: product.isAvailable,
                        hasStock: product.hasStock,
                        stockQuantity: product.stock?.quantity ?? null,
                        stockAlertThreshold: 5,
                        productType: 'good',
                    })

                    const priceDisplay = getPriceDisplay(product)

                    return (
                        // ── div remplace Card : on reconstruit manuellement les styles
                        // de Card (border, radius, shadow, bg) pour que l'image
                        // soit parfaitement collée aux bords sans aucun espace ──
                        <div
                            key={product.id}
                            className={cn(
                                'group relative flex flex-col overflow-hidden',
                                'rounded-xl border bg-card text-card-foreground shadow-sm',
                                'transition-shadow hover:border-primary/50 hover:shadow-md',
                                unavailable && 'opacity-60'
                            )}
                        >
                            {/* ── Zone image : collée aux bords haut/gauche/droit grâce au
                                overflow-hidden + rounded-xl sur le parent. Pas de padding,
                                pas de margin, pas de CardContent entre les deux ── */}
                            <div className="relative h-48 bg-muted overflow-hidden">
                                {product.imageUrl ? (
                                    <Image
                                        src={product.imageUrl}
                                        alt={product.name}
                                        fill
                                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                        className="object-contain transition-transform duration-200 group-hover:scale-105"
                                    />
                                ) : (
                                    <div
                                        className="flex h-full items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                                        {product.productType === 'good'
                                            ? <Package className="h-12 w-12 text-muted-foreground/50"/>
                                            : <Wrench className="h-12 w-12 text-muted-foreground/50"/>
                                        }
                                    </div>
                                )}

                                {/* Badge indisponible en overlay */}
                                {unavailable && (
                                    <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                                        <span
                                            className="text-xs font-semibold text-muted-foreground bg-background px-2 py-1 rounded-full border">
                                            Indisponible
                                        </span>
                                    </div>
                                )}

                                {/* Badge type produit — haut droite */}
                                <div className="absolute top-2 right-2">
                                    <Badge
                                        variant={product.productType === 'good' ? 'default' : 'secondary'}
                                        className="text-[10px] shadow-sm"
                                    >
                                        {PRODUCT_TYPE_LABELS[product.productType]}
                                    </Badge>
                                </div>
                            </div>

                            {/* ── Contenu : padding manuel équivalent à CardContent ── */}
                            <div className="flex flex-1 flex-col gap-3 p-4">

                                {/* Nom + description */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold leading-tight line-clamp-1">
                                        {product.name}
                                    </h3>
                                    {product.description && (
                                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                                            {product.description}
                                        </p>
                                    )}
                                </div>

                                {/* Méta */}
                                <div className="space-y-1.5 text-sm">
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Prix</span>
                                        <span className={cn(
                                            'font-semibold',
                                            priceDisplay.showPrice
                                                ? 'text-primary'
                                                : 'text-muted-foreground italic text-xs'
                                        )}>
                                            {priceDisplay.showPrice
                                                ? `${priceDisplay.label ? priceDisplay.label + ' ' : ''}${priceDisplay.formattedPrice}`
                                                : priceDisplay.label
                                            }
                                        </span>
                                    </div>

                                    {product.category && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">Catégorie</span>
                                            <span className="truncate ml-2 text-xs">{product.category.name}</span>
                                        </div>
                                    )}

                                    {product.family && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">Famille</span>
                                            <span className="truncate ml-2 text-xs">{product.family.name}</span>
                                        </div>
                                    )}

                                    {product.hasStock && product.stock && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">Stock</span>
                                            <Badge variant={availability.variant as any} className="text-xs">
                                                {availability.status}
                                            </Badge>
                                        </div>
                                    )}
                                </div>

                                {/* Actions fixées en bas */}
                                <div className="flex gap-2 mt-auto pt-1">
                                    <Link href={`/dashboard/menu/products/${product.id}/edit`} className="flex-1">
                                        <Button
                                            variant="outline" size="sm"
                                            className="w-full"
                                            disabled={isLoading_item}
                                        >
                                            <Edit className="h-3.5 w-3.5 mr-1.5"/>
                                            Modifier
                                        </Button>
                                    </Link>

                                    <Button
                                        size="sm"
                                        variant={product.isAvailable ? 'default' : 'secondary'}
                                        onClick={() => handleToggleAvailability(product.id)}
                                        disabled={isLoading_item}
                                        title={product.isAvailable ? 'Désactiver' : 'Activer'}
                                    >
                                        <Power className="h-3.5 w-3.5"/>
                                    </Button>

                                    <Button
                                        variant="destructive" size="sm"
                                        onClick={() => setDeleteTarget({id: product.id, name: product.name})}
                                        disabled={isLoading_item}
                                        title="Supprimer"
                                    >
                                        <Trash2 className="h-3.5 w-3.5"/>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* ── Dialog confirmation suppression ── */}
            <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Supprimer «&nbsp;{deleteTarget?.name}&nbsp;» ?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Cette action est irréversible. Le produit sera définitivement supprimé.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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