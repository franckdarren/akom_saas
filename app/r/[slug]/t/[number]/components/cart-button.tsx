// app/r/[slug]/t/[number]/components/cart-button.tsx
'use client'

import { ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'

interface CartButtonProps {
    itemCount: number
    onClick: () => void
}

export function CartButton({ itemCount, onClick }: CartButtonProps) {
    return (
        <motion.div
            className="relative"
            // Animation pulse quand itemCount change
            animate={itemCount > 0 ? { scale: [1, 1.15, 1] } : { scale: 1 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
        >
            <Button
                size="icon"
                onClick={onClick}
                className="rounded-full bg-white hover:bg-white shadow-lg text-black"
            >
                <ShoppingCart className="w-5 h-5" />
            </Button>

            {/* Badge animé qui apparaît/disparaît */}
            <AnimatePresence mode="wait">
                {itemCount > 0 && (
                    <motion.span
                        key={itemCount} // Force re-render à chaque changement
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                        className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium shadow-md"
                    >
                        {itemCount}
                    </motion.span>
                )}
            </AnimatePresence>
        </motion.div>
    )
}