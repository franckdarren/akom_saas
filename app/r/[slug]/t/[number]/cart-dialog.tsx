// app/r/[slug]/t/[number]/cart-dialog.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Minus, Plus, Trash2, Loader2 } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useCart } from './cart-context'
import { formatPrice } from '@/lib/utils/format'
import { toast } from "sonner"

interface CartDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    restaurantId: string
    tableId: string
}

export function CartDialog({
    open,
    onOpenChange,
    restaurantId,
    tableId,
}: CartDialogProps) {
    const router = useRouter()
    const { items, updateQuantity, removeItem, clearCart, totalAmount } = useCart()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleCheckout() {
        setIsSubmitting(true)
        setError(null)

        try {
            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    restaurantId,
                    tableId,
                    items: items.map((item) => ({
                        productId: item.productId,
                        quantity: item.quantity,
                    })),
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Erreur lors de la commande')
            }

            // Succès ! Vider le panier et afficher confirmation
            clearCart()
            onOpenChange(false)

            // Afficher message de succès
            toast.success(
                `La commande ${data.order.orderNumber} a bien été enregistrée !`,
                {
                    duration: 15000, // 15 secondes
                }
            )

        } catch (err: any) {
            setError(err.message || 'Une erreur est survenue')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md max-h-[80vh]">
                <DialogHeader>
                    <DialogTitle>Mon panier</DialogTitle>
                    <DialogDescription>
                        Vérifiez votre commande avant de valider
                    </DialogDescription>
                </DialogHeader>

                {items.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground">
                        Votre panier est vide
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Liste des items */}
                        <div className="space-y-3 max-h-[50vh] overflow-y-auto">
                            {items.map((item) => (
                                <div
                                    key={item.productId}
                                    className="flex items-center gap-3 py-3 shadow-xs"
                                >
                                    <div className="flex-1">
                                        <p className="font-medium">{item.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {formatPrice(item.price)}
                                        </p>
                                    </div>

                                    {/* Contrôles quantité */}
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                            disabled={isSubmitting}
                                        >
                                            <Minus className="h-4 w-4" />
                                        </Button>

                                        <span className="w-8 text-center font-medium">
                                            {item.quantity}
                                        </span>

                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                            disabled={isSubmitting}
                                        >
                                            <Plus className="h-4 w-4" />
                                        </Button>

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => removeItem(item.productId)}
                                            disabled={isSubmitting}
                                        >
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Total */}
                        <div className="border-t pt-4">
                            <div className="flex items-center justify-between text-lg font-bold">
                                <span>Total</span>
                                <span>{formatPrice(totalAmount)}</span>
                            </div>
                        </div>

                        {/* Erreur */}
                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => onOpenChange(false)}
                                disabled={isSubmitting}
                            >
                                Continuer
                            </Button>
                            <Button
                                className="flex-1"
                                onClick={handleCheckout}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Envoi...
                                    </>
                                ) : (
                                    'Commander'
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}