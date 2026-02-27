'use client'

import {Plus} from 'lucide-react'
import {cn} from '@/lib/utils'
import type {POSProduct} from '../_types/index'
import Image from 'next/image'

interface ProductGridProps {
    products: POSProduct[]
    onAdd: (product: POSProduct) => void
}

export function ProductGrid({products, onAdd}: ProductGridProps) {
    return (
        <div className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {products.map(product => {
                    const unavailable = product.price == null || !product.isAvailable

                    return (
                        <button
                            key={product.id}
                            onClick={() => !unavailable && onAdd(product)}
                            disabled={unavailable}
                            className={cn(
                                'group relative flex flex-col rounded-xl overflow-hidden',
                                'border bg-background text-left',
                                'transition-all duration-150',
                                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                                unavailable
                                    ? 'opacity-50 cursor-not-allowed'
                                    : 'hover:border-primary/50 hover:shadow-md active:scale-[0.98]'
                            )}
                        >
                            {/* Image ou placeholder */}
                            {/* ✅ FIX 1 : aspect-[4/3] avec crochets (arbitrary value Tailwind) */}
                            <div className="relative w-full aspect-[4/3] bg-muted overflow-hidden">
                                {product.imageUrl ? (
                                    // ✅ FIX 2 : next/image requiert fill + sizes OU width/height
                                    // On utilise fill avec un conteneur relatif (déjà en place)
                                    <Image
                                        src={product.imageUrl}
                                        alt={product.name}
                                        fill
                                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                        className="object-contain transition-transform duration-200 group-hover:scale-105"
                                    />
                                ) : (
                                    // ✅ FIX 3 : bg-gradient-to-br (bg-linear-to-br n'existe pas en Tailwind v3)
                                    <div
                                        className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                                        <span className="text-4xl select-none">🍽️</span>
                                    </div>
                                )}

                                {/* Badge rupture */}
                                {!product.isAvailable && (
                                    <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                                        <span
                                            className="text-xs font-semibold text-muted-foreground bg-background px-2 py-1 rounded-full border">
                                            Indisponible
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Infos + bouton ajouter */}
                            <div className="flex items-end justify-between gap-2 p-3">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold leading-tight line-clamp-2 mb-1">
                                        {product.name}
                                    </p>
                                    <p className={cn(
                                        'text-xs font-medium',
                                        product.price != null
                                            ? 'text-primary'
                                            : 'text-muted-foreground italic'
                                    )}>
                                        {product.price != null
                                            ? `${product.price.toLocaleString('fr-FR')} FCFA`
                                            : 'Sur devis'
                                        }
                                    </p>
                                </div>

                                {/* Bouton + */}
                                {!unavailable && (
                                    <div className={cn(
                                        'shrink-0 w-7 h-7 rounded-lg flex items-center justify-center',
                                        'bg-primary/10 text-primary',
                                        'transition-colors duration-150',
                                        'group-hover:bg-primary group-hover:text-primary-foreground'
                                    )}>
                                        <Plus className="h-3.5 w-3.5"/>
                                    </div>
                                )}
                            </div>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}