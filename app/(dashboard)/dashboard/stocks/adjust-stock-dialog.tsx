// app/(dashboard)/dashboard/stocks/adjust-stock-dialog.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Loader2, Plus, Minus, RefreshCw } from 'lucide-react'
import { adjustStock } from '@/lib/actions/stock'
import { formatNumber } from '@/lib/utils/slug'

type Stock = {
    id: string
    quantity: number
    product: {
        id: string
        name: string
    }
}

export function AdjustStockDialog({
    stock,
    children,
    onSuccess,
}: {
    stock: Stock
    children: React.ReactNode
    onSuccess?: () => void
}) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [type, setType] = useState<'manual_in' | 'manual_out' | 'adjustment'>('manual_in')
    const [quantity, setQuantity] = useState<string>('')

    function handleOpenChange(newOpen: boolean) {
        setOpen(newOpen)
        if (!newOpen) {
            setIsLoading(false)
            setError(null)
            setType('manual_in')
            setQuantity('')
        }
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        const formData = new FormData(e.currentTarget)
        const qty = parseInt(formData.get('quantity') as string)
        const reason = formData.get('reason') as string

        if (isNaN(qty) || qty <= 0) {
            setError('La quantité doit être supérieure à 0')
            setIsLoading(false)
            return
        }

        const result = await adjustStock(stock.product.id, qty, type, reason)

        if (result.error) {
            setError(result.error)
            setIsLoading(false)
        } else {
            setOpen(false)
            router.refresh()
            onSuccess?.()
        }
    }

    const getPreview = () => {
        const qty = parseInt(quantity) || 0
        if (type === 'manual_in') {
            return stock.quantity + qty
        } else if (type === 'manual_out') {
            return Math.max(0, stock.quantity - qty)
        } else {
            return qty
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Ajuster le stock</DialogTitle>
                    <DialogDescription>{stock.product.name}</DialogDescription>
                </DialogHeader>

                <div className="bg-muted p-4 rounded-lg">
                    <div className="text-sm text-muted-foreground">Stock actuel</div>
                    <div className="text-3xl font-bold">{formatNumber(stock.quantity)}</div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Type de mouvement</Label>
                        <Select value={type} onValueChange={(v: any) => setType(v)} disabled={isLoading}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="manual_in">
                                    <div className="flex items-center gap-2">
                                        <Plus className="h-4 w-4 text-green-500" />
                                        <span>Entrée (livraison, production)</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="manual_out">
                                    <div className="flex items-center gap-2">
                                        <Minus className="h-4 w-4 text-red-500" />
                                        <span>Sortie (casse, perte)</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="adjustment">
                                    <div className="flex items-center gap-2">
                                        <RefreshCw className="h-4 w-4 text-blue-500" />
                                        <span>Ajustement (inventaire)</span>
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="quantity">
                            {type === 'adjustment' ? 'Nouvelle quantité' : 'Quantité'}
                            <span className="text-red-500"> *</span>
                        </Label>
                        <Input
                            id="quantity"
                            name="quantity"
                            type="number"
                            min="1"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            placeholder={type === 'adjustment' ? 'Nouvelle quantité totale' : 'Quantité à ajouter/retirer'}
                            required
                            disabled={isLoading}
                        />
                        {quantity && (
                            <p className="text-sm text-muted-foreground">
                                Nouveau stock : <strong>{formatNumber(getPreview())}</strong>
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="reason">Motif (optionnel)</Label>
                        <Textarea
                            id="reason"
                            name="reason"
                            placeholder="Ex: Livraison fournisseur X, Inventaire mensuel, Casse..."
                            disabled={isLoading}
                            rows={2}
                        />
                    </div>

                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={isLoading}
                        >
                            Annuler
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Enregistrement...
                                </>
                            ) : (
                                'Enregistrer'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}