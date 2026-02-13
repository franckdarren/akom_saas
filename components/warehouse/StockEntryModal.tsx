// components/warehouse/StockEntryModal.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TrendingUp, Loader2 } from 'lucide-react'
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
import { warehouseStockEntry } from '@/lib/actions/warehouse'

interface StockEntryModalProps {
    warehouseProduct: WarehouseProductWithStock
    onClose: () => void
    onSuccess: () => void
}

export function StockEntryModal({
    warehouseProduct,
    onClose,
    onSuccess,
}: StockEntryModalProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    const [formData, setFormData] = useState({
        quantity: 1,
        supplierName: '',
        invoiceReference: '',
        unitCost: warehouseProduct.stock.unitCost || 0,
        notes: '',
    })

    const newStock = warehouseProduct.stock.quantity + formData.quantity
    const newValue = formData.unitCost
        ? newStock * formData.unitCost
        : null

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        if (formData.quantity <= 0) {
            toast.error('Erreur de validation', {
                description: 'La quantité doit être supérieure à 0',
            })
            return
        }

        setIsLoading(true)

        try {
            const result = await warehouseStockEntry({
                warehouseProductId: warehouseProduct.id,
                quantity: formData.quantity,
                supplierName: formData.supplierName || undefined,
                invoiceReference: formData.invoiceReference || undefined,
                unitCost:
                    formData.unitCost > 0
                        ? formData.unitCost
                        : undefined,
                notes: formData.notes || undefined,
            })

            if (result.success) {
                toast.success('Entrée de stock enregistrée', {
                    description: `+${formData.quantity} ${warehouseProduct.storageUnit} ajoutés au stock`,
                })

                router.refresh()
                onSuccess()
            } else {
                toast.error('Erreur', {
                    description:
                        result.error ||
                        'Une erreur est survenue',
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
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-blue-600" />
                        Entrée de stock
                    </DialogTitle>
                    <DialogDescription>
                        Enregistrez la réception d'une livraison fournisseur pour{" "}
                        {warehouseProduct.name}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    
                    {/* Stock actuel */}
                    <div className="rounded-lg border p-3 bg-muted/50">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                                Stock actuel
                            </span>
                            <span className="font-semibold">
                                {warehouseProduct.stock.quantity}{' '}
                                {warehouseProduct.storageUnit}
                            </span>
                        </div>
                    </div>

                    {/* Quantité */}
                    <div className="space-y-2">
                        <Label htmlFor="quantity">
                            Quantité reçue ({warehouseProduct.storageUnit})
                        </Label>

                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        quantity: Math.max(
                                            1,
                                            prev.quantity - 1
                                        ),
                                    }))
                                }
                                disabled={formData.quantity <= 1}
                            >
                                -
                            </Button>

                            <Input
                                id="quantity"
                                type="number"
                                min={1}
                                value={formData.quantity}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        quantity:
                                            parseInt(
                                                e.target.value
                                            ) || 1,
                                    }))
                                }
                                className="text-center font-semibold"
                                required
                            />

                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        quantity:
                                            prev.quantity + 1,
                                    }))
                                }
                            >
                                +
                            </Button>
                        </div>
                    </div>

                    {/* Fournisseur */}
                    <div className="space-y-2">
                        <Label htmlFor="supplierName">
                            Fournisseur
                        </Label>
                        <Input
                            id="supplierName"
                            placeholder="Ex: Brasseries du Gabon"
                            value={formData.supplierName}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    supplierName:
                                        e.target.value,
                                }))
                            }
                        />
                    </div>

                    {/* Facture */}
                    <div className="space-y-2">
                        <Label htmlFor="invoiceReference">
                            Numéro de facture / BL
                        </Label>
                        <Input
                            id="invoiceReference"
                            placeholder="Ex: FAC-2024-001"
                            value={formData.invoiceReference}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    invoiceReference:
                                        e.target.value,
                                }))
                            }
                        />
                    </div>

                    {/* Coût */}
                    <div className="space-y-2">
                        <Label htmlFor="unitCost">
                            Coût unitaire (FCFA)
                            <span className="text-xs text-muted-foreground ml-1">
                                - optionnel
                            </span>
                        </Label>
                        <Input
                            id="unitCost"
                            type="number"
                            min={0}
                            step={0.01}
                            placeholder="0"
                            value={formData.unitCost || ''}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    unitCost:
                                        parseFloat(
                                            e.target.value
                                        ) || 0,
                                }))
                            }
                        />
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                            id="notes"
                            placeholder="Informations complémentaires..."
                            value={formData.notes}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    notes: e.target.value,
                                }))
                            }
                            rows={2}
                        />
                    </div>

                    {/* Récapitulatif */}
                    <div className="rounded-lg border p-4 bg-green-50 dark:bg-green-950/20">
                        <h4 className="font-semibold text-sm mb-3">
                            Après cette entrée
                        </h4>

                        <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between">
                                <span>Nouveau stock</span>
                                <span className="font-bold">
                                    {newStock}{' '}
                                    {warehouseProduct.storageUnit}
                                    <span className="text-xs ml-2">
                                        (+{formData.quantity})
                                    </span>
                                </span>
                            </div>

                            {newValue !== null && (
                                <div className="flex items-center justify-between">
                                    <span>
                                        Valeur totale
                                    </span>
                                    <span className="font-bold">
                                        {newValue.toLocaleString(
                                            'fr-FR'
                                        )}{' '}
                                        FCFA
                                    </span>
                                </div>
                            )}
                        </div>
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
                            Enregistrer l'entrée
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
