'use client'
import {useState, useTransition} from 'react'
import {Dialog, DialogContent, DialogHeader, DialogTitle} from '@/components/ui/dialog'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {toast} from 'sonner'
import {createPOSOrder} from '../_actions/create-pos-order'
import type {CartItem, POSPaymentMethod} from '../_types'
import {Banknote, Smartphone, CheckCircle} from 'lucide-react'

const PAYMENT_METHODS: { value: POSPaymentMethod; label: string; icon: React.ReactNode }[] = [
    {value: 'cash', label: 'Espèces', icon: <Banknote className="h-5 w-5"/>},
    {value: 'airtel_money', label: 'Airtel Money', icon: <Smartphone className="h-5 w-5"/>},
    {value: 'moov_money', label: 'Moov Money', icon: <Smartphone className="h-5 w-5"/>},
]

interface Props {
    open: boolean
    onClose: () => void
    items: CartItem[]
    total: number
    onSuccess: () => void
}

export function PaymentDialog({open, onClose, items, total, onSuccess}: Props) {
    const [method, setMethod] = useState<POSPaymentMethod>('cash')
    const [amountGiven, setAmountGiven] = useState('')
    const [isPending, startTransition] = useTransition()

    const given = parseFloat(amountGiven) || 0
    const change = method === 'cash' ? given - total : 0

    function handleConfirm() {
        if (method === 'cash' && given < total) {
            toast.error('Montant insuffisant')
            return
        }

        startTransition(async () => {
            const result = await createPOSOrder({
                items,
                paymentMethod: method,
                amountPaid: method === 'cash' ? given : total,
            })

            if (result.success) {
                toast.success('Commande enregistrée ✓')
                onSuccess()
                setAmountGiven('')
                setMethod('cash')
            } else {
                toast.error('Erreur lors de l\'enregistrement')
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>Encaissement</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Récap */}
                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                        <p className="text-sm text-muted-foreground">Total à payer</p>
                        <p className="text-3xl font-bold">{total.toLocaleString()} FCFA</p>
                    </div>

                    {/* Mode de paiement */}
                    <div>
                        <Label className="mb-2 block">Mode de paiement</Label>
                        <div className="grid grid-cols-3 gap-2">
                            {PAYMENT_METHODS.map(m => (
                                <button
                                    key={m.value}
                                    onClick={() => setMethod(m.value)}
                                    className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border text-xs font-medium transition
                    ${method === m.value ? 'border-primary bg-primary/10 text-primary' : 'hover:bg-muted'}`}
                                >
                                    {m.icon}
                                    {m.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Montant donné (cash uniquement) */}
                    {method === 'cash' && (
                        <div>
                            <Label>Montant reçu</Label>
                            <Input
                                type="number"
                                placeholder={`Min. ${total.toLocaleString()}`}
                                value={amountGiven}
                                onChange={e => setAmountGiven(e.target.value)}
                                className="mt-1 text-lg"
                                autoFocus
                            />
                            {change > 0 && (
                                <div
                                    className="mt-2 flex justify-between items-center bg-green-50 dark:bg-green-950 rounded-lg p-2 text-sm">
                                    <span className="text-muted-foreground">Monnaie à rendre</span>
                                    <span className="font-bold text-green-600">{change.toLocaleString()} FCFA</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Bouton confirmer */}
                    <Button
                        className="w-full"
                        size="lg"
                        disabled={isPending || (method === 'cash' && given < total)}
                        onClick={handleConfirm}
                    >
                        {isPending ? 'Enregistrement...' : (
                            <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4"/>
                Confirmer le paiement
              </span>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}