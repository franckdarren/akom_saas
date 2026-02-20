'use client'

import {useState, useTransition, useRef, useEffect} from 'react'
import {toast} from 'sonner'
import {ChevronDown, ChevronUp, Package, Zap} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Textarea} from '@/components/ui/textarea'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {cn} from '@/lib/utils'
import {addManualRevenue} from '@/lib/actions/cash/add-revenue'
import type {ProductWithStock} from '../../_types'

const DESCRIPTION_SUGGESTIONS = [
    'Vente comptoir',
    'Livraison',
    'Take-away',
    'Vente en gros',
    'Événement / Traiteur',
    'Boissons',
    'Plats du jour',
]

interface AddRevenueFormProps {
    sessionId: string
    products: ProductWithStock[]
    onAdded: () => void
    onCancel: () => void
}

export function AddRevenueForm({sessionId, products, onAdded, onCancel}: AddRevenueFormProps) {
    const [isPending, startTransition] = useTransition()
    const amountRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        amountRef.current?.focus()
    }, [])

    const [unitAmount, setUnitAmount] = useState('')
    const [quantity, setQuantity] = useState('1')
    const [description, setDescription] = useState('')
    const [paymentMethod, setPaymentMethod] = useState('cash')
    const [revenueType, setRevenueType] = useState<'service' | 'good'>('service')
    const [productId, setProductId] = useState('')
    const [notes, setNotes] = useState('')
    const [showProductLink, setShowProductLink] = useState(false)

    const totalAmount = (parseFloat(unitAmount || '0') * parseInt(quantity || '1', 10))
    const selectedProduct = products.find(p => p.id === productId)

    function handleRevenueTypeChange(type: 'service' | 'good') {
        setRevenueType(type)
        if (type === 'good') setShowProductLink(true)
    }

    function reset() {
        setUnitAmount('')
        setQuantity('1')
        setDescription('')
        setPaymentMethod('cash')
        setRevenueType('service')
        setProductId('')
        setNotes('')
        setShowProductLink(false)
        setTimeout(() => amountRef.current?.focus(), 50)
    }

    function handleSubmit() {
        const amount = parseFloat(unitAmount)
        if (!amount || amount <= 0) {
            toast.error('Saisissez un montant valide')
            return
        }
        if (!description.trim()) {
            toast.error('La description est obligatoire')
            return
        }
        if (revenueType === 'good' && !productId) {
            toast.error('Sélectionnez un produit pour une vente de bien')
            return
        }

        startTransition(async () => {
            try {
                await addManualRevenue({
                    sessionId,
                    description: description.trim(),
                    quantity: parseInt(quantity, 10),
                    unitAmount: Math.round(amount),
                    paymentMethod,
                    revenueType,
                    productId: productId || undefined,
                    notes: notes || undefined,
                })
                toast.success('Recette enregistrée')
                reset()
                onAdded()
            } catch (e: any) {
                toast.error(e.message ?? 'Erreur lors de l\'enregistrement')
            }
        })
    }

    return (
        <div className="space-y-4 p-4 rounded-xl bg-card border border-border">
            {/* Montant + Quantité */}
            <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2 space-y-1.5">
                    <Label className="text-xs">Montant unitaire (FCFA)</Label>
                    <div className="relative">
                        <Input
                            ref={amountRef}
                            type="number"
                            value={unitAmount}
                            onChange={e => setUnitAmount(e.target.value)}
                            placeholder="0"
                            min="0"
                            className="text-xl font-bold h-12 pr-16"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              FCFA
            </span>
                    </div>
                </div>
                <div className="space-y-1.5">
                    <Label className="text-xs">Qté</Label>
                    <Input
                        type="number"
                        value={quantity}
                        onChange={e => setQuantity(e.target.value)}
                        min="1"
                        className="h-12 text-center font-bold text-lg"
                    />
                </div>
            </div>

            {/* Total calculé */}
            {totalAmount > 0 && (
                <p className="text-sm font-medium text-success text-right -mt-2">
                    Total : {new Intl.NumberFormat('fr-FR').format(totalAmount)} FCFA
                </p>
            )}

            {/* Type de recette */}
            <div className="space-y-1.5">
                <Label className="text-xs">Type</Label>
                <div className="grid grid-cols-2 gap-2">
                    <Button
                        variant={revenueType === 'service' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleRevenueTypeChange('service')}
                        className="gap-2"
                    >
                        <Zap className="h-3.5 w-3.5"/>
                        Service
                    </Button>
                    <Button
                        variant={revenueType === 'good' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleRevenueTypeChange('good')}
                        className="gap-2"
                    >
                        <Package className="h-3.5 w-3.5"/>
                        Bien physique
                    </Button>
                </div>
            </div>

            {/* Description avec suggestions */}
            <div className="space-y-1.5">
                <Label className="text-xs">Description</Label>
                <Input
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Ex: Vente comptoir midi"
                    onKeyDown={e => {
                        if (e.key === 'Enter') handleSubmit()
                    }}
                />
                <div className="flex flex-wrap gap-1.5 mt-1">
                    {DESCRIPTION_SUGGESTIONS.map(s => (
                        <Button
                            className="flex flex-col items-center gap-1 text-center"
                            key={s}
                            size="sm"
                            variant="outline"
                            onClick={() => setDescription(s)}
                        >
                            <span className="text-xs font-medium leading-none">{s}</span>
                        </Button>
                    ))}
                </div>
            </div>

            {/* Mode de paiement */}
            <div className="space-y-1.5">
                <Label className="text-xs">Mode de paiement</Label>
                <div className="grid grid-cols-3 gap-2">
                    {[
                        {value: 'cash', label: '💵 Cash'},
                        {value: 'airtel_money', label: '📱 Airtel'},
                        {value: 'moov_money', label: '📱 Moov'},
                    ].map(m => (
                        <Button
                            key={m.value}
                            size="sm"
                            variant={paymentMethod === m.value ? 'default' : 'outline'}
                            onClick={() => setPaymentMethod(m.value)}
                            className="gap-2"
                        >
                            {m.label}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Lien produit — accordéon */}
            {(revenueType === 'good' || showProductLink) && (
                <div className="space-y-3 pt-1 border-t border-border">
                    <Button
                        variant="link"
                        size="sm"
                        onClick={() => setShowProductLink(!showProductLink)}
                        className="flex items-center gap-1.5 text-xs"
                    >
                        <Package className="h-3.5 w-3.5"/>
                        Lier à un produit du stock
                        {showProductLink ? <ChevronUp className="h-3.5 w-3.5"/> :
                            <ChevronDown className="h-3.5 w-3.5"/>}
                    </Button>

                    {showProductLink && (
                        <div className="space-y-2">
                            <Select value={productId} onValueChange={setProductId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Sélectionner un produit"/>
                                </SelectTrigger>
                                <SelectContent>
                                    {products.map(p => (
                                        <SelectItem key={p.id} value={p.id}>
                                            <span>{p.name}</span>
                                            <span className="ml-2 text-xs text-muted-foreground">
                        (stock : {p.stock?.quantity ?? 0})
                      </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {selectedProduct && (
                                <p className={cn(
                                    'text-xs',
                                    (selectedProduct.stock?.quantity ?? 0) < parseInt(quantity, 10)
                                        ? 'text-destructive font-medium'
                                        : 'text-muted-foreground'
                                )}>
                                    Stock actuel : {selectedProduct.stock?.quantity ?? 0} unité(s)
                                    {(selectedProduct.stock?.quantity ?? 0) < parseInt(quantity, 10) && ' — ⚠️ quantité insuffisante'}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Boutons */}
            <div className="flex gap-2 pt-1">
                <Button onClick={handleSubmit} disabled={isPending} className="flex-1">
                    {isPending ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
                <Button variant="outline" onClick={onCancel} disabled={isPending}>
                    Annuler
                </Button>
            </div>
        </div>
    )
}