// app/r/[slug]/t/[number]/components/fixed-bottom-bar.tsx
'use client'

import { ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'

interface FixedBottomBarProps {
    itemCount: number
    totalAmount: number
    onViewCart: () => void
}

export function FixedBottomBar({ itemCount, totalAmount, onViewCart }: FixedBottomBarProps) {
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'XAF',
            minimumFractionDigits: 0,
        }).format(price)
    }

    return (
        <AnimatePresence>
            {itemCount > 0 && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-zinc-900 border-t shadow-lg"
                >
                    <div className="max-w-3xl mx-auto px-4 py-3">
                        <div className="flex items-center justify-between gap-4">
                            {/* Infos panier */}
                            <div className="flex items-center gap-3">
                                <div className="bg-primary/10 p-2 rounded-full">
                                    <ShoppingBag className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">
                                        {itemCount} {itemCount === 1 ? 'produit' : 'produits'}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatPrice(totalAmount)}
                                    </p>
                                </div>
                            </div>

                            {/* Bouton Voir */}
                            <Button
                                onClick={onViewCart}
                                size="lg"
                                className="font-semibold"
                            >
                                Voir le panier
                            </Button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}