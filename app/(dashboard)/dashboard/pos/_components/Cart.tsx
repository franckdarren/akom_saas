'use client'

import {useState, useTransition} from 'react'
import {Minus, Plus, Trash2, ShoppingCart, RefreshCw, Banknote, Smartphone, Clock, Zap} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {Separator} from '@/components/ui/separator'
import {Badge} from '@/components/ui/badge'
import {Textarea} from '@/components/ui/textarea'
import {Label} from '@/components/ui/label'
import {
    Dialog, DialogContent, DialogHeader,
    DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import {cn} from '@/lib/utils'
import {toast} from 'sonner'
import {createPOSOrder} from '../_actions/create-pos-order'
import type {CartItem, POSOrderMode, POSPaymentMethod} from '../_types'

// ============================================================
// TYPES INTERNES
// ============================================================

interface CartProps {
    items: CartItem[]
    total: number
    onUpdateQty: (productId: string, qty: number) => void
    onClear: () => void
    onOrderComplete: () => void
}

const PAYMENT_METHODS: { value: POSPaymentMethod; label: string; icon: React.ElementType }[] = [
    {value: 'cash', label: 'Espèces', icon: Banknote},
    {value: 'airtel_money', label: 'Airtel Money', icon: Smartphone},
    {value: 'moov_money', label: 'Moov Money', icon: Smartphone},
]

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

export function Cart({items, total, onUpdateQty, onClear, onOrderComplete}: CartProps) {
    const [dialogOpen, setDialogOpen] = useState(false)
    const [note, setNote] = useState('')
    const [mode, setMode] = useState<POSOrderMode | null>(null)
    const [paymentMethod, setPaymentMethod] = useState<POSPaymentMethod | null>(null)
    const [isPending, startTransition] = useTransition()

    function openDialog() {
        // Réinitialiser les choix à chaque ouverture
        setMode(null)
        setPaymentMethod(null)
        setDialogOpen(true)
    }

    function handleClose() {
        if (isPending) return
        setDialogOpen(false)
    }

    async function handleConfirm() {
        if (!mode) return
        if (mode === 'pay_now' && !paymentMethod) {
            toast.error('Choisissez un mode de paiement')
            return
        }

        startTransition(async () => {
            const result = await createPOSOrder({
                items,
                mode,
                paymentMethod: mode === 'pay_now' ? paymentMethod! : undefined,
                note: note.trim() || undefined,
            })

            if (!result.success) {
                toast.error(result.error ?? 'Erreur lors de la commande')
                return
            }

            toast.success(
                mode === 'pay_now'
                    ? '✅ Commande enregistrée et payée'
                    : '🕐 Commande enregistrée — paiement en attente'
            )
            setNote('')
            setDialogOpen(false)
            onOrderComplete()
        })
    }

    // ── Panier vide ──────────────────────────────────────────
    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center flex-1 gap-3 text-muted-foreground py-12">
                <ShoppingCart className="h-10 w-10 opacity-20"/>
                <p className="text-sm">Le panier est vide</p>
                <p className="text-xs opacity-60">Ajoutez des produits depuis le catalogue</p>
            </div>
        )
    }

    // ── Panier rempli ────────────────────────────────────────
    return (
        <>
            {/* ── Liste des articles ── */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
                {items.map(item => (
                    <div
                        key={item.productId}
                        className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                        {/* Nom + prix unitaire */}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium leading-tight truncate">{item.name}</p>
                            <p className="text-xs text-muted-foreground">
                                {item.price.toLocaleString('fr-FR')} FCFA / unité
                            </p>
                        </div>

                        {/* Contrôles quantité */}
                        <div className="flex items-center gap-1.5 shrink-0">
                            <button
                                onClick={() => onUpdateQty(item.productId, item.quantity - 1)}
                                className="w-6 h-6 rounded-md bg-muted flex items-center justify-center hover:bg-muted-foreground/20 transition-colors"
                            >
                                {item.quantity === 1
                                    ? <Trash2 className="h-3 w-3 text-destructive"/>
                                    : <Minus className="h-3 w-3"/>
                                }
                            </button>
                            <span className="w-6 text-center text-sm font-semibold">
                                {item.quantity}
                            </span>
                            <button
                                onClick={() => onUpdateQty(item.productId, item.quantity + 1)}
                                className="w-6 h-6 rounded-md bg-muted flex items-center justify-center hover:bg-muted-foreground/20 transition-colors"
                            >
                                <Plus className="h-3 w-3"/>
                            </button>
                        </div>

                        {/* Sous-total */}
                        <span className="text-sm font-semibold w-20 text-right shrink-0">
                            {(item.price * item.quantity).toLocaleString('fr-FR')} F
                        </span>
                    </div>
                ))}
            </div>

            <Separator/>

            {/* ── Note commande ── */}
            <div className="px-4 py-3">
                <Textarea
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="Note pour la cuisine (optionnel)…"
                    className="text-sm resize-none h-16"
                />
            </div>

            <Separator/>

            {/* ── Total + actions ── */}
            <div className="px-4 py-4 space-y-3 shrink-0">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total</span>
                    <span className="text-lg font-bold">
                        {total.toLocaleString('fr-FR')} FCFA
                    </span>
                </div>

                <Button className="w-full" size="lg" onClick={openDialog}>
                    Valider la commande
                </Button>

                <Button
                    variant="ghost" size="sm"
                    className="w-full text-muted-foreground hover:text-destructive"
                    onClick={onClear}
                >
                    <Trash2 className="h-3.5 w-3.5 mr-1.5"/>
                    Vider le panier
                </Button>
            </div>

            {/* ============================================================
                DIALOG DE VALIDATION
                Étape 1 : choisir pay_now ou pay_later
                Étape 2 (si pay_now) : choisir la méthode de paiement
            ============================================================ */}
            <Dialog open={dialogOpen} onOpenChange={open => !open && handleClose()}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Valider la commande</DialogTitle>
                        <DialogDescription>
                            {total.toLocaleString('fr-FR')} FCFA
                            {' · '}{items.reduce((s, i) => s + i.quantity, 0)} article
                            {items.reduce((s, i) => s + i.quantity, 0) > 1 ? 's' : ''}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-5 pt-1">

                        {/* ── ÉTAPE 1 : Mode de paiement ── */}
                        <div className="space-y-2">
                            <Label className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
                                Le client paie…
                            </Label>
                            <div className="grid grid-cols-2 gap-3">

                                {/* Payer maintenant */}
                                <button
                                    onClick={() => {
                                        setMode('pay_now')
                                        setPaymentMethod(null)
                                    }}
                                    className={cn(
                                        'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center',
                                        mode === 'pay_now'
                                            ? 'border-primary bg-primary/5 text-primary'
                                            : 'border-border hover:border-muted-foreground/40 hover:bg-muted/40'
                                    )}
                                >
                                    <Zap
                                        className={cn('h-6 w-6', mode === 'pay_now' ? 'text-primary' : 'text-muted-foreground')}/>
                                    <div>
                                        <p className="font-semibold text-sm">Maintenant</p>
                                        <p className="text-xs text-muted-foreground leading-tight mt-0.5">
                                            Paie avant de partir
                                        </p>
                                    </div>
                                    {mode === 'pay_now' && (
                                        <Badge variant="default" className="text-[10px] px-2">Sélectionné</Badge>
                                    )}
                                </button>

                                {/* Payer après */}
                                <button
                                    onClick={() => {
                                        setMode('pay_later')
                                        setPaymentMethod(null)
                                    }}
                                    className={cn(
                                        'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center',
                                        mode === 'pay_later'
                                            ? 'border-primary bg-primary/5 text-primary'
                                            : 'border-border hover:border-muted-foreground/40 hover:bg-muted/40'
                                    )}
                                >
                                    <Clock
                                        className={cn('h-6 w-6', mode === 'pay_later' ? 'text-primary' : 'text-muted-foreground')}/>
                                    <div>
                                        <p className="font-semibold text-sm">Après service</p>
                                        <p className="text-xs text-muted-foreground leading-tight mt-0.5">
                                            Paie après avoir reçu
                                        </p>
                                    </div>
                                    {mode === 'pay_later' && (
                                        <Badge variant="default" className="text-[10px] px-2">Sélectionné</Badge>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* ── ÉTAPE 2 : Méthode de paiement (pay_now uniquement) ── */}
                        {mode === 'pay_now' && (
                            <div className="space-y-2">
                                <Label className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
                                    Moyen de paiement
                                </Label>
                                <div className="flex flex-col gap-2">
                                    {PAYMENT_METHODS.map(({value, label, icon: Icon}) => (
                                        <button
                                            key={value}
                                            onClick={() => setPaymentMethod(value)}
                                            className={cn(
                                                'flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all text-left',
                                                paymentMethod === value
                                                    ? 'border-primary bg-primary/5'
                                                    : 'border-border hover:border-muted-foreground/40 hover:bg-muted/40'
                                            )}
                                        >
                                            <Icon className={cn(
                                                'h-4 w-4 shrink-0',
                                                paymentMethod === value ? 'text-primary' : 'text-muted-foreground'
                                            )}/>
                                            <span className={cn(
                                                'font-medium text-sm',
                                                paymentMethod === value && 'text-primary'
                                            )}>
                                                {label}
                                            </span>
                                            {paymentMethod === value && (
                                                <span className="ml-auto text-primary text-xs font-semibold">✓</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ── Bouton de confirmation ── */}
                        <Button
                            className="w-full"
                            size="lg"
                            disabled={
                                isPending ||
                                !mode ||
                                (mode === 'pay_now' && !paymentMethod)
                            }
                            onClick={handleConfirm}
                        >
                            {isPending ? (
                                <>
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin"/>
                                    Enregistrement…
                                </>
                            ) : mode === 'pay_now' ? (
                                `Encaisser ${total.toLocaleString('fr-FR')} FCFA`
                            ) : mode === 'pay_later' ? (
                                'Envoyer en cuisine'
                            ) : (
                                'Confirmer'
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}