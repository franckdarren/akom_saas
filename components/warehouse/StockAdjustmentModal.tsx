'use client'

import {useState} from 'react'
import {useRouter} from 'next/navigation'
import {Edit, Loader2, AlertTriangle} from 'lucide-react'
import {toast} from 'sonner'

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Textarea} from '@/components/ui/textarea'
import {WarehouseProductWithStock} from '@/types/warehouse'
import {adjustWarehouseStock} from '@/lib/actions/warehouse'

interface StockAdjustmentModalProps {
    warehouseProduct: WarehouseProductWithStock
    onClose: () => void
    onSuccess: () => void
}

export function StockAdjustmentModal({
                                         warehouseProduct,
                                         onClose,
                                         onSuccess,
                                     }: StockAdjustmentModalProps) {

    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    const [newQuantity, setNewQuantity] = useState(
        warehouseProduct.stock.quantity
    )
    const [reason, setReason] = useState('')

    const currentStock = warehouseProduct.stock.quantity
    const difference = newQuantity - currentStock
    const isDifferent = difference !== 0

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        if (!isDifferent) {
            toast("Aucun changement", {
                description:
                    "La nouvelle quantité est identique au stock actuel",
            })
            return
        }

        if (!reason.trim()) {
            toast.error("Raison requise", {
                description:
                    "Veuillez indiquer la raison de cet ajustement",
            })
            return
        }

        if (newQuantity < 0) {
            toast.error("Erreur de validation", {
                description:
                    "La quantité ne peut pas être négative",
            })
            return
        }

        setIsLoading(true)

        try {
            const result = await adjustWarehouseStock({
                warehouseProductId: warehouseProduct.id,
                newQuantity,
                reason,
            })

            if (result.success) {
                toast.success("Stock ajusté", {
                    description: `Le stock a été mis à jour : ${
                        difference > 0 ? '+' : ''
                    }${difference} ${warehouseProduct.storageUnit}`,
                })

                router.refresh()
                onSuccess()
            } else {
                toast.error("Erreur", {
                    description:
                        result.error || "Une erreur est survenue",
                })
            }
        } catch {
            toast.error("Erreur", {
                description:
                    "Une erreur inattendue est survenue",
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
                        <Edit className="h-5 w-5 text-orange-600"/>
                        Ajuster l'inventaire
                    </DialogTitle>
                    <DialogDescription>
                        Mettez à jour le stock après un comptage physique pour{" "}
                        {warehouseProduct.name}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-4">

                    {/* Stock actuel */}
                    <div className="rounded-lg border p-4 bg-muted/50">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Stock actuel
                                </p>
                                <p className="text-2xl font-bold mt-1">
                                    {currentStock} {warehouseProduct.storageUnit}
                                </p>
                            </div>
                            <div className="text-right text-xs text-muted-foreground">
                                <p>Dernière mise à jour</p>
                                <p>
                                    {new Date(
                                        warehouseProduct.stock.updatedAt
                                    ).toLocaleDateString("fr-FR")}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Nouveau stock */}
                    <div className="space-y-2">
                        <Label htmlFor="newQuantity">
                            Stock réel compté ({warehouseProduct.storageUnit})
                        </Label>
                        <Input
                            id="newQuantity"
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            min={0}
                            step={0.01}
                            value={newQuantity}
                            onChange={(e) =>
                                setNewQuantity(parseFloat(e.target.value) || 0)
                            }
                            className="text-lg font-semibold"
                            required
                            autoFocus
                        />
                    </div>

                    {/* Raison */}
                    <div className="space-y-2">
                        <Label htmlFor="reason">
                            Raison de l'ajustement
                        </Label>
                        <Textarea
                            id="reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={3}
                            required
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
                            disabled={isLoading || !isDifferent}
                            className="gap-2"
                            variant={difference < 0 ? "destructive" : "default"}
                        >
                            {isLoading && (
                                <Loader2 className="h-4 w-4 animate-spin"/>
                            )}
                            Confirmer
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
