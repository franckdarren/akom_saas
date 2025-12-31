// app/r/[slug]/t/[number]/product-card.tsx
'use client'

import Image from 'next/image'
import { Plus, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useCart } from './cart-context'

interface Product {
    id: string
    name: string
    description: string | null
    price: number
    imageUrl: string | null
    stock: { quantity: number } | null
}

export function ProductCard({ product }: { product: Product }) {
    const { addItem } = useCart()

    function handleAdd() {
        addItem({
            productId: product.id,
            name: product.name,
            price: product.price,
            imageUrl: product.imageUrl,
        })
    }

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'XAF',
            minimumFractionDigits: 0,
        }).format(price)
    }

    return (
        <Card>
            <CardContent className="p-4">
                <div className="flex gap-4">
                    {/* Image */}
                    <div className="relative h-24 w-24 flex-shrink-0 bg-muted rounded-lg overflow-hidden">
                        {product.imageUrl ? (
                            <Image
                                src={product.imageUrl}
                                alt={product.name}
                                fill
                                className="object-cover"
                            />
                        ) : (
                            <div className="h-full w-full flex items-center justify-center">
                                <Package className="h-8 w-8 text-muted-foreground" />
                            </div>
                        )}
                    </div>

                    {/* Infos */}
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg">{product.name}</h3>
                        {product.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                {product.description}
                            </p>
                        )}
                        <div className="flex items-center justify-between mt-2">
                            <span className="text-lg font-bold">{formatPrice(product.price)}</span>
                            <Button onClick={handleAdd} size="sm">
                                <Plus className="h-4 w-4 mr-1" />
                                Ajouter
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}