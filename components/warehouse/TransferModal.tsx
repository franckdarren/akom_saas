// components/warehouse/TransferModal.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Package, ArrowRight, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { WarehouseProductWithStock } from '@/types/warehouse'
import { transferWarehouseToOps } from '@/lib/actions/warehouse'

interface TransferModalProps {
    warehouseProduct: WarehouseProductWithStock
    onClose: () => void
    onSuccess: () => void
}

export function TransferModal({
    warehouseProduct,
    onClose,
    onSuccess,
}: TransferModalProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [quantity, setQuantity] = useState(1)
    const [notes, setNotes] = useState('')

    if (!warehouseProduct.linkedProduct) {
        return null
    }

    const linkedProduct = warehouseProduct.linkedProduct
    const maxQuantity = warehouseProduct.stock.quantity
    const convertedQuantity =
        quantity * warehouseProduct.conversionRatio
    const newWarehouseStock =
        warehouseProduct.stock.quantity - quantity
    const newOpsStock =
        linkedProduct.currentStock + convertedQuantity

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        if (quantity <= 0) {
            toast.error('Erreur de validation', {
                description:
                    'La quantité doit être supérieure à 0',
            })
            return
        }

        if (quantity > maxQuantity) {
            toast.error('Stock insuffisant', {
                description: `Vous ne pouvez pas transférer plus de ${maxQuantity} ${warehouseProduct.storageUnit}`,
            })
            return
        }

        setIsLoading(true)

        try {
            const result = await transferWarehouseToOps({
                warehouseProductId: warehouseProduct.id,
                warehouseQuantity: quantity,
                opsProductId: linkedProduct.id,
                notes: notes || undefined,
            })

            if (result.success) {
                toast.success('Transfert réussi', {
                    description: `${quantity} ${warehouseProduct.storageUnit} (${convertedQuantity} unités) transférés avec succès`,
                })

                router.refresh()
                onSuccess()
            } else {
                toast.error('Erreur', {
                    description:
                        result.error ||
                        'Une erreur est survenue lors du transfert',
                })
            }
        } catch {
            toast.error('Erreur', {
                description:
                    'Une erreur inattendue est survenue',
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>
                        Transférer vers le stock opérationnel
                    </DialogTitle>
                    <DialogDescription>
                        Prélevez du stock de votre entrepôt
                        pour réapprovisionner votre restaurant
                    </DialogDescription>
                </DialogHeader>

                <form
                    onSubmit={handleSubmit}
                    className="space-y-6 mt-4"
                >
                    {/* Depuis le magasin */}
                    <div className="rounded-lg border p-4 bg-blue-50 dark:bg-blue-950/20">
                        <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/40">
                                <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-sm">
                                    Depuis le magasin
                                </h3>
                                <p className="text-sm mt-1">
                                    {warehouseProduct.name}
                                </p>
                                <p className="text-xs mt-0.5">
                                    Stock actuel:{' '}
                                    {
                                        warehouseProduct.stock
                                            .quantity
                                    }{' '}
                                    {
                                        warehouseProduct.storageUnit
                                    }
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 space-y-2">
                            <Label htmlFor="quantity">
                                Quantité à prélever (
                                {warehouseProduct.storageUnit})
                            </Label>

                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        setQuantity(
                                            Math.max(
                                                1,
                                                quantity - 1
                                            )
                                        )
                                    }
                                    disabled={quantity <= 1}
                                >
                                    -
                                </Button>

                                <Input
                                    id="quantity"
                                    type="number"
                                    min={1}
                                    max={maxQuantity}
                                    value={quantity}
                                    onChange={(e) =>
                                        setQuantity(
                                            parseInt(
                                                e.target.value
                                            ) || 1
                                        )
                                    }
                                    className="text-center font-semibold"
                                />

                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        setQuantity(
                                            Math.min(
                                                maxQuantity,
                                                quantity + 1
                                            )
                                        )
                                    }
                                    disabled={
                                        quantity >= maxQuantity
                                    }
                                >
                                    +
                                </Button>
                            </div>

                            <p className="text-xs text-muted-foreground">
                                Maximum disponible: {maxQuantity}{' '}
                                {
                                    warehouseProduct.storageUnit
                                }
                            </p>
                        </div>
                    </div>

                    {/* Conversion */}
                    <div className="flex items-center justify-center">
                        <div className="flex items-center gap-3 text-muted-foreground">
                            <ArrowRight className="h-5 w-5" />
                            <span className="text-sm font-medium">
                                Conversion: ×
                                {
                                    warehouseProduct.conversionRatio
                                }
                            </span>
                            <ArrowRight className="h-5 w-5" />
                        </div>
                    </div>

                    {/* Vers le stock opérationnel */}
                    <div className="rounded-lg border p-4 bg-green-50 dark:bg-green-950/20">
                        <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/40">
                                <Package className="h-5 w-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-sm">
                                    Vers le stock opérationnel
                                </h3>
                                <p className="text-sm mt-1">
                                    🔗 {linkedProduct.name}
                                </p>
                                <p className="text-xs mt-0.5">
                                    Stock actuel:{' '}
                                    {
                                        linkedProduct.currentStock
                                    }{' '}
                                    unités
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 p-3 bg-white dark:bg-gray-900 rounded-lg border">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">
                                    Quantité ajoutée
                                </span>
                                <span className="text-lg font-bold text-green-600 dark:text-green-400">
                                    +{convertedQuantity} unités
                                </span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                                {quantity}{' '}
                                {
                                    warehouseProduct.storageUnit
                                }{' '}
                                ×{' '}
                                {
                                    warehouseProduct.conversionRatio
                                }{' '}
                                = {convertedQuantity}
                            </div>
                        </div>
                    </div>

                    {/* Résumé */}
                    <div className="rounded-lg border p-4 bg-muted/50">
                        <h4 className="font-semibold text-sm mb-3">
                            Résumé après transfert
                        </h4>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-muted-foreground">
                                    Magasin
                                </p>
                                <p className="font-semibold mt-1">
                                    {newWarehouseStock}{' '}
                                    {
                                        warehouseProduct.storageUnit
                                    }
                                </p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">
                                    Stock opérationnel
                                </p>
                                <p className="font-semibold mt-1">
                                    {newOpsStock} unités
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label htmlFor="notes">
                            Notes (optionnel)
                        </Label>
                        <Textarea
                            id="notes"
                            placeholder="Ex: Réapprovisionnement pour le week-end..."
                            value={notes}
                            onChange={(e) =>
                                setNotes(e.target.value)
                            }
                            rows={3}
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 justify-end pt-4 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isLoading}
                        >
                            Annuler
                        </Button>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="gap-2"
                        >
                            {isLoading && (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            )}
                            Transférer
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
