'use client'

import {useState, useTransition, useRef, useEffect} from 'react'
import {toast} from 'sonner'
import {Package} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {addExpense} from '@/lib/actions/cash/add-expense'
import type {ProductWithStock} from '../../_types'

const CATEGORIES = [
    {value: 'stock_purchase', label: 'Achat stock'},
    {value: 'salary', label: 'Salaire'},
    {value: 'utilities', label: 'Charges'},
    {value: 'transport', label: 'Transport'},
    {value: 'maintenance', label: 'Maintenance'},
    {value: 'marketing', label: 'Marketing'},
    {value: 'rent', label: 'Loyer'},
    {value: 'other', label: 'Autre'},
]

interface AddExpenseFormProps {
    sessionId: string
    products: ProductWithStock[]
    onAdded: () => void
    onCancel: () => void
}

export function AddExpenseForm({
                                   sessionId,
                                   products,
                                   onAdded,
                                   onCancel,
                               }: AddExpenseFormProps) {
    const [isPending, startTransition] = useTransition()
    const amountRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        amountRef.current?.focus()
    }, [])

    const [amount, setAmount] = useState('')
    const [description, setDescription] = useState('')
    const [category, setCategory] = useState('')
    const [paymentMethod, setPaymentMethod] = useState('cash')
    const [productId, setProductId] = useState('')
    const [quantityAdded, setQuantityAdded] = useState('1')

    const isStockPurchase = category === 'stock_purchase'
    const selectedProduct = products.find(p => p.id === productId)

    function reset() {
        setAmount('')
        setDescription('')
        setCategory('')
        setPaymentMethod('cash')
        setProductId('')
        setQuantityAdded('1')
        setTimeout(() => amountRef.current?.focus(), 50)
    }

    function handleSubmit() {
        const amountValue = parseFloat(amount)

        if (!amountValue || amountValue <= 0) {
            toast.error('Saisissez un montant valide')
            return
        }

        if (!description.trim()) {
            toast.error('La description est obligatoire')
            return
        }

        if (!category) {
            toast.error('Sélectionnez une catégorie')
            return
        }

        if (isStockPurchase && !productId) {
            toast.error('Sélectionnez le produit reçu en stock')
            return
        }

        startTransition(async () => {
            try {
                await addExpense({
                    sessionId,
                    description: description.trim(),
                    amount: Math.round(amountValue),
                    category,
                    paymentMethod,
                    productId: productId || undefined,
                    quantityAdded: isStockPurchase
                        ? parseInt(quantityAdded, 10)
                        : undefined,
                })

                toast.success('Dépense enregistrée')
                reset()
                onAdded()
            } catch (e: any) {
                toast.error(e.message ?? "Erreur lors de l'enregistrement")
            }
        })
    }

    return (
        <div className="space-y-4 p-4 rounded-xl bg-card border border-border">
            {/* Montant */}
            <div className="space-y-1.5">
                <Label className="text-xs">Montant (FCFA)</Label>
                <Input
                    ref={amountRef}
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0"
                    min="0"
                    className="text-xl font-bold h-12"
                />
            </div>

            {/* Catégories */}
            <div className="space-y-1.5">
                <Label className="text-xs">Catégorie</Label>
                <div className="grid grid-cols-2 gap-2">
                    {CATEGORIES.map(cat => (
                        <Button
                            key={cat.value}
                            size="sm"
                            variant={category === cat.value ? 'default' : 'outline'}
                            onClick={() => {
                                setCategory(cat.value)
                                if (cat.value !== 'stock_purchase') setProductId('')
                            }}
                            className="justify-start"
                        >
                            {cat.value === 'stock_purchase' && (
                                <Package className="h-3.5 w-3.5 mr-2"/>
                            )}
                            {cat.label}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
                <Label className="text-xs">Description</Label>
                <Input
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Ex: Achat légumes marché"
                />
            </div>

            {/* Bloc stock (comme revenueForm) */}
            {isStockPurchase && (
                <div className="space-y-3 pt-1 border-t border-border">
                    <p className="text-xs font-medium text-muted-foreground">
                        Lier à un produit du stock
                    </p>

                    <Select value={productId} onValueChange={setProductId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un produit"/>
                        </SelectTrigger>
                        <SelectContent>
                            {products.map(p => (
                                <SelectItem key={p.id} value={p.id}>
                                    {p.name}
                                    <span className="ml-2 text-xs text-muted-foreground">
                    (stock actuel : {p.stock?.quantity ?? 0})
                  </span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Input
                        type="number"
                        value={quantityAdded}
                        onChange={e => setQuantityAdded(e.target.value)}
                        min="1"
                        placeholder="Quantité reçue"
                    />

                    {selectedProduct && (
                        <p className="text-xs text-muted-foreground">
                            Stock après réception :{' '}
                            {(selectedProduct.stock?.quantity ?? 0) +
                                parseInt(quantityAdded || '0', 10)}{' '}
                            unité(s)
                        </p>
                    )}
                </div>
            )}

            {/* Paiement */}
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
                        >
                            {m.label}
                        </Button>
                    ))}
                </div>
            </div>

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