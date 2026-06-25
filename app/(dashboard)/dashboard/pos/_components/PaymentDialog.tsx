'use client'

import {useState, useTransition} from 'react'
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription} from '@/components/ui/dialog'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {toast} from 'sonner'
import {createPOSOrder} from '../_actions/create-pos-order'
import type {CartItem, POSPaymentMethod, POSOrderMode} from '../_types'
import {Banknote, Smartphone, CheckCircle, Clock, Zap} from 'lucide-react'
import {cn} from '@/lib/utils'

// ============================================================
// CONFIG
// ============================================================

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

// ============================================================
// COMPOSANT
// ============================================================

export function PaymentDialog({open, onClose, items, total, onSuccess}: Props) {
    const [mode, setMode] = useState<POSOrderMode>('pay_now')
    const [method, setMethod] = useState<POSPaymentMethod>('cash')
    const [amountGiven, setAmountGiven] = useState('')
    const [isPending, startTransition] = useTransition()

    const given = parseFloat(amountGiven) || 0
    const change = mode === 'pay_now' && method === 'cash' ? given - total : 0

    function handleClose() {
        if (isPending) return
        onClose()
    }

    function handleConfirm() {
        // Validation cash
        if (mode === 'pay_now' && method === 'cash' && given < total) {
            toast.error('Montant insuffisant')
            return
        }

        startTransition(async () => {
            const result = await createPOSOrder({
                items,
                mode,
                // paymentMethod uniquement si pay_now
                paymentMethod: mode === 'pay_now' ? method : undefined,
            })

            if (result.success) {
                toast.success(
                    mode === 'pay_now'
                        ? '✅ Commande enregistrée et payée'
                        : '🕐 Commande enregistrée — paiement en attente'
                )
                onSuccess()
                // Reset du state pour la prochaine commande
                setAmountGiven('')
                setMethod('cash')
                setMode('pay_now')
            } else {
                toast.error(result.error ?? 'Erreur lors de l\'enregistrement')
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={open => !open && handleClose()}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>Valider la commande</DialogTitle>
                    <DialogDescription>
                        Total : <strong>{total.toLocaleString('fr-FR')} FCFA</strong>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5">

                    {/* ── Récap total ── */}
                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                        <p className="text-sm text-muted-foreground">Total à payer</p>
                        <p className="text-3xl font-bold">{total.toLocaleString('fr-FR')} FCFA</p>
                    </div>

                    {/* ── Choix du mode : payer maintenant ou après ── */}
                    <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
                            Le client paie…
                        </Label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => setMode('pay_now')}
                                className={cn(
                                    'flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 text-xs font-medium transition-all',
                                    mode === 'pay_now'
                                        ? 'border-primary bg-primary/10 text-primary'
                                        : 'border-border hover:bg-muted'
                                )}
                            >
                                <Zap className="h-5 w-5"/>
                                <span>Maintenant</span>
                            </button>
                            <button
                                onClick={() => setMode('pay_later')}
                                className={cn(
                                    'flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 text-xs font-medium transition-all',
                                    mode === 'pay_later'
                                        ? 'border-primary bg-primary/10 text-primary'
                                        : 'border-border hover:bg-muted'
                                )}
                            >
                                <Clock className="h-5 w-5"/>
                                <span>Après service</span>
                            </button>
                        </div>
                    </div>

                    {/* ── Mode de paiement + montant reçu (pay_now uniquement) ── */}
                    {mode === 'pay_now' && (
                        <>
                            <div className="space-y-2">
                                <Label className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
                                    Moyen de paiement
                                </Label>
                                <div className="grid grid-cols-3 gap-2">
                                    {PAYMENT_METHODS.map(m => (
                                        <button
                                            key={m.value}
                                            onClick={() => setMethod(m.value)}
                                            className={cn(
                                                'flex flex-col items-center gap-1.5 p-3 rounded-lg border text-xs font-medium transition-all',
                                                method === m.value
                                                    ? 'border-primary bg-primary/10 text-primary'
                                                    : 'border-border hover:bg-muted'
                                            )}
                                        >
                                            {m.icon}
                                            {m.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Montant reçu — cash uniquement */}
                            {method === 'cash' && (
                                <div className="space-y-1">
                                    <Label>Montant reçu</Label>
                                    <Input
                                        type="number"
                                        placeholder={`Min. ${total.toLocaleString('fr-FR')}`}
                                        value={amountGiven}
                                        onChange={e => setAmountGiven(e.target.value)}
                                        className="text-lg"
                                        autoFocus
                                    />
                                    {change > 0 && (
                                        <div
                                            className="flex justify-between items-center bg-success-subtle rounded-lg p-2 text-sm mt-1">
                                            <span className="text-muted-foreground">Monnaie à rendre</span>
                                            <span className="font-bold text-success">
                                                {change.toLocaleString('fr-FR')} FCFA
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}

                    {/* ── Bouton confirmer ── */}
                    <Button
                        className="w-full"
                        size="lg"
                        disabled={
                            isPending ||
                            (mode === 'pay_now' && method === 'cash' && given < total)
                        }
                        onClick={handleConfirm}
                    >
                        {isPending ? (
                            'Enregistrement...'
                        ) : mode === 'pay_now' ? (
                            <span className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4"/>
                                Encaisser {total.toLocaleString('fr-FR')} FCFA
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <Clock className="h-4 w-4"/>
                                Envoyer en cuisine
                            </span>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}