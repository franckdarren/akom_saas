// app/(dashboard)/dashboard/menu/products/products-list.tsx
'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Edit, Trash2, Power, Package } from 'lucide-react'
import { toggleProductAvailability, deleteProduct } from '@/lib/actions/product'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatPrice } from '@/lib/utils/format'

type Product = {
    id: string
    name: string
    description: string | null
    price: number
    imageUrl: string | null
    isAvailable: boolean
    category: { name: string } | null
    stock: { quantity: number } | null
}

export function ProductsList({ products }: { products: Product[] }) {
    const router = useRouter()
    const [loading, setLoading] = useState<string | null>(null)

    async function handleToggleAvailability(id: string) {
        setLoading(id)
        await toggleProductAvailability(id)
        setLoading(null)
        router.refresh()
    }

    async function handleDelete(id: string, name: string) {
        if (!confirm(`Voulez-vous vraiment supprimer "${name}" ?`)) {
            return
        }

        setLoading(id)
        const result = await deleteProduct(id)
        setLoading(null)

        if (result.error) {
            alert(result.error)
        } else {
            router.refresh()
        }
    }

    if (products.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                    <p className="text-muted-foreground text-center">
                        Aucun produit pour le moment.
                        <br />
                        Créez votre premier produit pour compléter votre menu.
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
                <Card key={product.id} className="overflow-hidden">
                    {/* Image du produit */}
                    <div className="relative h-48 bg-muted">
                        {product.imageUrl ? (
                            <Image
                                src={product.imageUrl}
                                alt={product.name}
                                fill
                                className="object-cover"
                            />
                        ) : (
                            <div className="flex h-full items-center justify-center">
                                <Package className="h-12 w-12 text-muted-foreground" />
                            </div>
                        )}
                    </div>

                    <CardContent className="p-4">
                        {/* En-tête */}
                        <div className="flex items-start justify-between mb-2">
                            <div className="space-y-1 flex-1">
                                <h3 className="font-semibold text-lg">{product.name}</h3>
                                {product.description && (
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                        {product.description}
                                    </p>
                                )}
                            </div>
                            <Badge variant={product.isAvailable ? 'default' : 'secondary'}>
                                {product.isAvailable ? 'Disponible' : 'Indisponible'}
                            </Badge>
                        </div>

                        {/* Informations */}
                        <div className="space-y-2 mb-4">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Prix</span>
                                <span className="font-semibold">{formatPrice(product.price)}</span>
                            </div>

                            {product.category && (
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Catégorie</span>
                                    <span>{product.category.name}</span>
                                </div>
                            )}

                            {product.stock && (
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Stock</span>
                                    <span className={product.stock.quantity < 5 ? 'text-red-500 font-medium' : ''}>
                                        {product.stock.quantity}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                            <Link href={`/dashboard/menu/products/${product.id}/edit`} className="flex-1">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full"
                                    disabled={loading === product.id}
                                >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Modifier
                                </Button>
                            </Link>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleAvailability(product.id)}
                                disabled={loading === product.id}
                            >
                                <Power className="h-4 w-4" />
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(product.id, product.name)}
                                disabled={loading === product.id}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}