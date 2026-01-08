// app/r/[slug]/t/[number]/components/menu-item.tsx
'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Minus, Plus, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { useCart } from '../cart-context'

interface Product {
    id: string
    name: string
    description: string | null
    price: number
    imageUrl: string | null
    stock: { quantity: number } | null
}

interface MenuItemProps {
    product: Product
}

export function MenuItem({ product }: MenuItemProps) {
    const { items, addItem, updateQuantity } = useCart()

    // Trouver la quantité actuelle dans le panier
    const cartItem = items.find(item => item.productId === product.id)
    const quantity = cartItem?.quantity || 0

    const formatPrice = (price: number) => {
        return `${new Intl.NumberFormat('fr-FR', {
            minimumFractionDigits: 0,
        }).format(price)} FCFA`
    }

    const isOutOfStock = product.stock !== null && product.stock.quantity === 0

    const handleAdd = () => {
        if (quantity === 0) {
            // Première fois : ajouter au panier
            addItem({
                productId: product.id,
                name: product.name,
                price: product.price,
                imageUrl: product.imageUrl,
            })
        } else {
            // Incrémenter
            updateQuantity(product.id, quantity + 1)
        }
    }

    const handleRemove = () => {
        if (quantity > 0) {
            updateQuantity(product.id, quantity - 1)
        }
    }

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-center gap-2 bg-white dark:bg-zinc-800 p-3 shadow-sm ${isOutOfStock ? 'opacity-60' : ''
                }`}
        >
            {/* Image */}
            <div className="relative w-20 h-20 flex-shrink-0 bg-muted rounded-lg overflow-hidden">
                {product.imageUrl ? (
                    <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        className="object-contain"
                    />
                ) : (
                    <div className="h-full w-full flex items-center justify-center">
                        <Package className="h-8 w-8 text-muted-foreground" />
                    </div>
                )}

                {/* Badge rupture de stock */}
                {isOutOfStock && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Badge variant="destructive" className="text-xs">
                            Épuisé
                        </Badge>
                    </div>
                )}
            </div>

            {/* Infos */}
            <div className="flex-1 min-w-0">
                <h3 className="font-regular text-[14px]">{product.name}</h3>

                {product.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {product.description}
                    </p>
                )}

                <p className="font-bold text-primary text-[14px] mt-2">
                    {formatPrice(product.price)}
                </p>
            </div>

            {/* Contrôles +/- */}
            <div className="flex items-center gap-1">
                {quantity > 0 && (
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                    >
                        <Button
                            size="icon"
                            variant="outline"
                            onClick={handleRemove}
                            disabled={isOutOfStock}
                            className="h-8 w-8"
                        >
                            <Minus className="h-4 w-4" />
                        </Button>
                    </motion.div>
                )}

                {quantity > 0 && (
                    <motion.span
                        key={quantity}
                        initial={{ scale: 1.5 }}
                        animate={{ scale: 1 }}
                        className="w-6 text-center font-semibold"
                    >
                        {quantity}
                    </motion.span>
                )}

                <Button
                    size="icon"
                    variant={quantity > 0 ? 'outline' : 'default'}
                    onClick={handleAdd}
                    disabled={isOutOfStock}
                    className="h-8 w-8"
                >
                    <Plus className="h-4 w-4" />
                </Button>
            </div>
        </motion.div>
    )
}