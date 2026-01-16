// app/r/[slug]/t/[number]/product-card.tsx
'use client'

import Image from 'next/image'
import { Plus, Package, Minus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useCart } from './cart-context'
import { formatPrice } from '@/lib/utils/format'

interface Product {
    id: string
    name: string
    description: string | null
    price: number
    imageUrl: string | null
    stock: { quantity: number } | null
}

export function ProductCard({ product }: { product: Product }) {
    const { items, addItem, updateQuantity } = useCart()

    // Trouver si le produit est dans le panier
    const cartItem = items.find((item) => item.productId === product.id)
    const quantity = cartItem?.quantity || 0

    // Vérifier la disponibilité
    const stockQuantity = product.stock?.quantity || 0
    const isAvailable = stockQuantity > 0
    const isLowStock = stockQuantity > 0 && stockQuantity <= 3

    function handleAdd() {
        addItem({
            productId: product.id,
            name: product.name,
            price: product.price,
            imageUrl: product.imageUrl,
        })
    }

    function handleIncrement() {
        if (quantity >= stockQuantity) return
        updateQuantity(product.id, quantity + 1)
    }

    function handleDecrement() {
        updateQuantity(product.id, quantity - 1)
    }

    return (
        <Card className={!isAvailable ? 'opacity-60' : ''}>
            <CardContent className="px-2">
                <div className="flex gap-2 items-center">
                    {/* Image */}
                    <div className="relative h-24 w-24 shrink-0 bg-muted rounded-lg overflow-hidden">
                        {product.imageUrl ? (
                            <Image
                                src={product.imageUrl}
                                alt={product.name}
                                fill
                                className="object-cover"
                                sizes="96px"
                            />
                        ) : (
                            <div className="h-full w-full flex items-center justify-center">
                                <Package className="h-10 w-10 text-muted-foreground" />
                            </div>
                        )}

                        {/* Badge rupture */}
                        {!isAvailable && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <Badge variant="destructive" className="text-xs">
                                    Rupture
                                </Badge>
                            </div>
                        )}
                    </div>

                    {/* Infos */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-lg">{product.name}</h3>
                            {/* Badge stock faible */}
                            {isLowStock && (
                                <Badge variant="destructive" className="text-xs shrink-0">
                                    Plus que {stockQuantity}
                                </Badge>
                            )}
                        </div>

                        {product.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                {product.description}
                            </p>
                        )}

                        <div className="flex items-center justify-between mt-2">
                            <span className="text-lg font-bold">
                                {formatPrice(product.price)}
                            </span>

                            {/* Actions : bouton Ajouter OU contrôles quantité */}
                            {quantity === 0 ? (
                                <Button
                                    onClick={handleAdd}
                                    size="sm"
                                    disabled={!isAvailable}
                                >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Ajouter
                                </Button>
                            ) : (
                                <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={handleDecrement}
                                    >
                                        <Minus className="h-4 w-4" />
                                    </Button>

                                    <span className="font-semibold text-sm w-6 text-center">
                                        {quantity}
                                    </span>

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={handleIncrement}
                                        disabled={quantity >= stockQuantity}
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}