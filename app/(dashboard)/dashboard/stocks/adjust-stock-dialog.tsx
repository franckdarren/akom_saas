// app/(dashboard)/dashboard/stocks/adjust-stock-dialog.tsx
'use client'

import {useState} from 'react'
import {useRouter} from 'next/navigation'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {Button} from '@/components/ui/button'
import {LoadingButton} from '@/components/ui/loading-button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Textarea} from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {Plus, Minus, RefreshCw, ChevronDown, ArrowRight} from 'lucide-react'
import {adjustStock} from '@/lib/actions/stock'
import {formatNumber, formatPrice} from '@/lib/utils/format'
import {computeEntryUnitCost, computeNewAvgCost} from '@/lib/stock/costing'

type Stock = {
    id: string
    quantity: number
    avgCost: number | null
    lastPurchasePrice: number | null
    product: {
        id: string
        name: string
        purchasePrice: number | null
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

    // Pré-rempli avec le dernier coût connu, puis le prix d'achat de référence de
    // l'article : dans le cas courant (même fournisseur, même prix) l'utilisateur
    // n'a rien à ressaisir.
    const defaultPurchasePrice =
        stock.lastPurchasePrice ?? stock.product.purchasePrice ?? null
    const [purchasePrice, setPurchasePrice] = useState<string>(
        defaultPurchasePrice !== null ? String(defaultPurchasePrice) : ''
    )
    const [extraCosts, setExtraCosts] = useState<string>('')
    const [showExtraCosts, setShowExtraCosts] = useState(false)

    function handleOpenChange(newOpen: boolean) {
        setOpen(newOpen)
        if (!newOpen) {
            setIsLoading(false)
            setError(null)
            setType('manual_in')
            setQuantity('')
            setPurchasePrice(defaultPurchasePrice !== null ? String(defaultPurchasePrice) : '')
            setExtraCosts('')
            setShowExtraCosts(false)
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

        const result = await adjustStock(
            stock.product.id,
            qty,
            type,
            reason,
            isEntry ? {purchasePrice: parsedPurchasePrice, extraCosts: parsedExtraCosts} : undefined
        )

        if (result.error) {
            setError(result.error)
            setIsLoading(false)
        } else {
            setOpen(false)
            router.refresh()
            onSuccess?.()
            setIsLoading(false)
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

    // ------------------------------------------------------------
    // Valorisation — aperçu en temps réel
    // ------------------------------------------------------------
    // Un ajustement à la hausse est une entrée de marchandise au même titre
    // qu'une livraison : on propose donc aussi la saisie du prix d'achat.
    const parsedQty = parseInt(quantity) || 0
    const entryQty = type === 'manual_in' ? parsedQty : getPreview() - stock.quantity
    const isEntry = (type === 'manual_in' || type === 'adjustment') && entryQty > 0

    const parsedPurchasePrice = purchasePrice.trim() === '' ? null : Number(purchasePrice)
    const parsedExtraCosts = extraCosts.trim() === '' ? null : Number(extraCosts)

    const entryUnitCost = isEntry
        ? computeEntryUnitCost(parsedPurchasePrice, parsedExtraCosts, entryQty)
        : null
    const newAvgCost = computeNewAvgCost(stock.quantity, stock.avgCost, entryQty, entryUnitCost)
    const avgCostChanged = entryUnitCost !== null && newAvgCost !== stock.avgCost

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Ajuster le stock</DialogTitle>
                    <DialogDescription>{stock.product.name}</DialogDescription>
                </DialogHeader>

                <div className="bg-muted p-4 rounded-lg flex items-end justify-between gap-4">
                    <div>
                        <div className="text-sm text-muted-foreground">Stock actuel</div>
                        <div className="text-3xl font-bold">{formatNumber(stock.quantity)}</div>
                    </div>
                    {stock.avgCost !== null && (
                        <div className="text-right">
                            <div className="text-sm text-muted-foreground">Coût de revient</div>
                            <div className="text-lg font-semibold">{formatPrice(stock.avgCost)}</div>
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Type de mouvement</Label>
                        <Select value={type} onValueChange={(v) => setType(v as typeof type)} disabled={isLoading}>
                            <SelectTrigger>
                                <SelectValue/>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="manual_in">
                                    <div className="flex items-center gap-2">
                                        <Plus className="h-4 w-4 text-success"/>
                                        <span>Entrée (livraison, production)</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="manual_out">
                                    <div className="flex items-center gap-2">
                                        <Minus className="h-4 w-4 text-destructive"/>
                                        <span>Sortie (casse, perte)</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="adjustment">
                                    <div className="flex items-center gap-2">
                                        <RefreshCw className="h-4 w-4 text-info"/>
                                        <span>Ajustement (inventaire)</span>
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="quantity">
                            {type === 'adjustment' ? 'Nouvelle quantité' : 'Quantité'}
                            <span className="text-destructive"> *</span>
                        </Label>
                        <Input
                            id="quantity"
                            name="quantity"
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
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

                    {/* Valorisation — visible uniquement quand de la marchandise entre */}
                    {isEntry && (
                        <div className="rounded-lg border border-dashed p-4 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="purchasePrice">Prix d&apos;achat unitaire</Label>
                                <div className="relative">
                                    <Input
                                        id="purchasePrice"
                                        name="purchasePrice"
                                        type="text"
                                        inputMode="numeric"
                                        value={purchasePrice}
                                        onChange={(e) => setPurchasePrice(e.target.value)}
                                        placeholder="Laisser vide pour ne pas valoriser"
                                        disabled={isLoading}
                                        className="pr-14"
                                    />
                                    <span
                                        className="absolute right-3 top-1/2 -translate-y-1/2 type-caption text-muted-foreground pointer-events-none">
                                        FCFA
                                    </span>
                                </div>
                            </div>

                            <Collapsible open={showExtraCosts} onOpenChange={setShowExtraCosts}>
                                <CollapsibleTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-auto px-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
                                        disabled={isLoading}
                                    >
                                        <ChevronDown
                                            className={`h-4 w-4 transition-transform ${showExtraCosts ? 'rotate-180' : ''}`}
                                        />
                                        Frais annexes (transport, douane…)
                                    </Button>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <div className="space-y-2 pt-3">
                                        <Label htmlFor="extraCosts">Total des frais pour ce lot</Label>
                                        <div className="relative">
                                            <Input
                                                id="extraCosts"
                                                name="extraCosts"
                                                type="text"
                                                inputMode="numeric"
                                                value={extraCosts}
                                                onChange={(e) => setExtraCosts(e.target.value)}
                                                placeholder="0"
                                                disabled={isLoading}
                                                className="pr-14"
                                            />
                                            <span
                                                className="absolute right-3 top-1/2 -translate-y-1/2 type-caption text-muted-foreground pointer-events-none">
                                                FCFA
                                            </span>
                                        </div>
                                        <p className="type-caption text-muted-foreground">
                                            Répartis au prorata sur les {formatNumber(entryQty)} unités entrantes.
                                        </p>
                                    </div>
                                </CollapsibleContent>
                            </Collapsible>

                            {/* Impact sur le coût de revient, avant validation */}
                            {entryUnitCost !== null && (
                                <div className="rounded-md bg-muted p-3 space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Coût de ce lot</span>
                                        <span className="font-medium">{formatPrice(entryUnitCost)} / unité</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Coût de revient moyen</span>
                                        {avgCostChanged && stock.avgCost !== null ? (
                                            <span className="layout-inline font-medium">
                                                <span className="text-muted-foreground line-through">
                                                    {formatPrice(stock.avgCost)}
                                                </span>
                                                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground"/>
                                                <span>{formatPrice(newAvgCost ?? 0)}</span>
                                            </span>
                                        ) : (
                                            <span className="font-medium">{formatPrice(newAvgCost ?? 0)}</span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

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
                        <div
                            className="bg-destructive-subtle text-destructive p-3 rounded-lg text-sm">
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
                        <LoadingButton type="submit" isLoading={isLoading} loadingText="Enregistrement...">
                            Enregistrer
                        </LoadingButton>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}