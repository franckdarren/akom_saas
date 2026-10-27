'use client'

import {useState, useTransition} from 'react'
import {Minus, Plus, Trash2, ShoppingCart, RefreshCw, Banknote, Smartphone, Clock, Zap, Coins, X} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {Separator} from '@/components/ui/separator'
import {Badge} from '@/components/ui/badge'
import {Textarea} from '@/components/ui/textarea'
import {Label} from '@/components/ui/label'
import {Input} from '@/components/ui/input'
import {Checkbox} from '@/components/ui/checkbox'
import {
    Dialog, DialogContent, DialogHeader,
    DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import {cn} from '@/lib/utils'
import {toast} from 'sonner'
import {createPOSOrder} from '../_actions/create-pos-order'
import {findChangeDueByCode} from '@/lib/actions/change-due'
import type {CartItem, POSOrderMode, POSPaymentMethod, POSChangeDueResult} from '../_types'

// ============================================================
// TYPES INTERNES
// ============================================================

interface CartProps {
    items: CartItem[]
    total: number
    onUpdateQty: (productId: string, qty: number) => void
    onClear: () => void
    onOrderComplete: () => void
    /**
     * Remonte la monnaie due générée par la vente. Le ticket est affiché par
     * POSShell et non ici : `onOrderComplete` vide le panier (et ferme le
     * sheet sur mobile), ce qui démonterait ce composant avant que le client
     * ait sa preuve.
     */
    onChangeDue: (changeDue: POSChangeDueResult) => void
}

const PAYMENT_METHODS: { value: POSPaymentMethod; label: string; icon: React.ElementType }[] = [
    {value: 'cash', label: 'Espèces', icon: Banknote},
    {value: 'airtel_money', label: 'Airtel Money', icon: Smartphone},
    {value: 'moov_money', label: 'Moov Money', icon: Smartphone},
]

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

function formatAmount(n: number) {
    return n.toLocaleString('fr-FR')
}

export function Cart({items, total, onUpdateQty, onClear, onOrderComplete, onChangeDue}: CartProps) {
    const [dialogOpen, setDialogOpen] = useState(false)
    const [note, setNote] = useState('')
    const [mode, setMode] = useState<POSOrderMode | null>(null)
    const [paymentMethod, setPaymentMethod] = useState<POSPaymentMethod | null>(null)
    const [isPending, startTransition] = useTransition()

    // ── Encaissement en espèces ──────────────────────────────
    const [amountGiven, setAmountGiven] = useState('')
    const [keepChange, setKeepChange] = useState(false)
    const [changeDueInput, setChangeDueInput] = useState('')
    const [customerName, setCustomerName] = useState('')
    const [customerPhone, setCustomerPhone] = useState('')

    // Monnaie due d'un passage précédent, déduite de cet achat
    const [codeInput, setCodeInput] = useState('')
    const [appliedCode, setAppliedCode] = useState<{code: string; amount: number} | null>(null)
    const [isLookingUp, startLookup] = useTransition()

    const isCash = mode === 'pay_now' && paymentMethod === 'cash'

    // Ce que le client doit sortir de sa poche, déduction faite
    const cashToCollect = total - (appliedCode?.amount ?? 0)
    const given = parseInt(amountGiven, 10) || 0
    const change = isCash ? given - cashToCollect : 0

    // Montant enregistré comme dette envers le client
    const changeDueAmount = keepChange
        ? Math.min(parseInt(changeDueInput, 10) || 0, Math.max(change, 0))
        : 0
    const changeToReturn = Math.max(change, 0) - changeDueAmount

    // Le montant reçu n'est pas obligatoire : la caissière qui a la monnaie
    // peut encaisser sans le saisir, comme avant. Il ne le devient que si elle
    // déclare ne pas pouvoir rendre la monnaie.
    const cashIncomplete = isCash && amountGiven !== '' && given < cashToCollect
    const changeDueIncomplete = keepChange && (amountGiven === '' || changeDueAmount <= 0)

    function resetCashState() {
        setAmountGiven('')
        setKeepChange(false)
        setChangeDueInput('')
        setCustomerName('')
        setCustomerPhone('')
        setCodeInput('')
        setAppliedCode(null)
    }

    function openDialog() {
        // Réinitialiser les choix à chaque ouverture
        setMode(null)
        setPaymentMethod(null)
        resetCashState()
        setDialogOpen(true)
    }

    function handleClose() {
        if (isPending) return
        setDialogOpen(false)
    }

    function handleApplyCode() {
        const code = codeInput.trim()
        if (!code) return

        startLookup(async () => {
            const result = await findChangeDueByCode(code)
            if (!result.success) {
                toast.error(result.error)
                return
            }
            if (result.data.amount > total) {
                toast.error(
                    `La monnaie due (${formatAmount(result.data.amount)} FCFA) dépasse le total — rendez-la en espèces depuis la page Monnaie due`,
                )
                return
            }
            setAppliedCode({code: result.data.code, amount: result.data.amount})
            setCodeInput('')
            toast.success(`${formatAmount(result.data.amount)} FCFA déduits`)
        })
    }

    async function handleConfirm() {
        if (!mode) return
        if (mode === 'pay_now' && !paymentMethod) {
            toast.error('Choisissez un mode de paiement')
            return
        }
        if (cashIncomplete) {
            toast.error('Montant reçu insuffisant')
            return
        }
        if (changeDueIncomplete) {
            toast.error('Saisissez le montant reçu et la monnaie à enregistrer')
            return
        }

        startTransition(async () => {
            const result = await createPOSOrder({
                items,
                mode,
                paymentMethod: mode === 'pay_now' ? paymentMethod! : undefined,
                note: note.trim() || undefined,
                amountTendered: isCash && amountGiven !== '' ? given : undefined,
                changeDue: changeDueAmount > 0
                    ? {
                        amount: changeDueAmount,
                        customerName: customerName.trim() || undefined,
                        customerPhone: customerPhone.trim() || undefined,
                    }
                    : undefined,
                appliedChangeDueCode: appliedCode?.code,
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
            if (result.changeDue) onChangeDue(result.changeDue)
            setNote('')
            resetCashState()
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
                <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
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
                                        <Badge variant="default" className="text-2xs px-2">Sélectionné</Badge>
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
                                        <Badge variant="default" className="text-2xs px-2">Sélectionné</Badge>
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

                        {/* ── ÉTAPE 3 : Espèces — montant reçu et monnaie ── */}
                        {isCash && (
                            <div className="layout-form">
                                <Separator/>

                                {/* Monnaie due d'un passage précédent */}
                                {appliedCode ? (
                                    <div
                                        className="flex items-center justify-between gap-2 rounded-lg bg-info-subtle p-2.5">
                                        <div className="layout-inline">
                                            <Coins className="h-4 w-4 shrink-0 text-info"/>
                                            <div>
                                                <p className="text-sm font-medium">Monnaie due déduite</p>
                                                <p className="type-caption">Code {appliedCode.code}</p>
                                            </div>
                                        </div>
                                        <div className="layout-inline">
                                            <span className="text-sm font-bold text-info tabular-nums">
                                                −{formatAmount(appliedCode.amount)}
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7"
                                                onClick={() => setAppliedCode(null)}
                                                aria-label="Retirer la déduction"
                                            >
                                                <X className="h-3.5 w-3.5"/>
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="layout-field">
                                        <Label htmlFor="change-due-code" className="type-label">
                                            Code de monnaie due (optionnel)
                                        </Label>
                                        <div className="layout-inline">
                                            <Input
                                                id="change-due-code"
                                                value={codeInput}
                                                onChange={e => setCodeInput(e.target.value.toUpperCase())}
                                                placeholder="Ex : K7M2PQ"
                                                className="font-mono uppercase"
                                            />
                                            <Button
                                                variant="outline"
                                                onClick={handleApplyCode}
                                                disabled={!codeInput.trim() || isLookingUp}
                                            >
                                                {isLookingUp ? '…' : 'Appliquer'}
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* Montant reçu */}
                                <div className="layout-field">
                                    <Label htmlFor="amount-given" className="type-label">
                                        Montant reçu (optionnel)
                                    </Label>
                                    <Input
                                        id="amount-given"
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        placeholder={`Min. ${formatAmount(cashToCollect)}`}
                                        value={amountGiven}
                                        onChange={e => setAmountGiven(e.target.value.replace(/\D/g, ''))}
                                        className="text-lg"
                                    />
                                    {appliedCode && (
                                        <p className="type-caption">
                                            À encaisser après déduction :{' '}
                                            <strong>{formatAmount(cashToCollect)} FCFA</strong>
                                        </p>
                                    )}
                                    {cashIncomplete && (
                                        <p className="type-caption text-destructive">
                                            Montant insuffisant — minimum {formatAmount(cashToCollect)} FCFA
                                        </p>
                                    )}
                                </div>

                                {/* Monnaie à rendre + pénurie de petite monnaie */}
                                {change > 0 && (
                                    <div className="layout-form">
                                        <div
                                            className="flex items-center justify-between rounded-lg bg-success-subtle p-2 text-sm">
                                            <span className="text-muted-foreground">Monnaie à rendre</span>
                                            <span className="font-bold text-success tabular-nums">
                                                {formatAmount(change)} FCFA
                                            </span>
                                        </div>

                                        <div className="layout-inline">
                                            <Checkbox
                                                id="keep-change"
                                                checked={keepChange}
                                                onCheckedChange={checked => {
                                                    const next = checked === true
                                                    setKeepChange(next)
                                                    // Pré-rempli au total : le cas le plus fréquent
                                                    // est de ne rien pouvoir rendre du tout.
                                                    setChangeDueInput(next ? String(change) : '')
                                                }}
                                            />
                                            <Label htmlFor="keep-change" className="type-label cursor-pointer">
                                                Je ne peux pas rendre toute la monnaie
                                            </Label>
                                        </div>

                                        {keepChange && (
                                            <div className="layout-form rounded-lg bg-warning-subtle p-3">
                                                <div className="layout-field">
                                                    <Label htmlFor="change-due-amount" className="type-label">
                                                        Monnaie enregistrée (non rendue)
                                                    </Label>
                                                    <Input
                                                        id="change-due-amount"
                                                        type="text"
                                                        inputMode="numeric"
                                                        pattern="[0-9]*"
                                                        value={changeDueInput}
                                                        onChange={e => setChangeDueInput(e.target.value.replace(/\D/g, ''))}
                                                    />
                                                    <p className="type-caption">
                                                        Reste à rendre maintenant :{' '}
                                                        <strong>{formatAmount(changeToReturn)} FCFA</strong>
                                                    </p>
                                                </div>

                                                <div className="layout-field">
                                                    <Label htmlFor="customer-name" className="type-label">
                                                        Nom du client (optionnel)
                                                    </Label>
                                                    <Input
                                                        id="customer-name"
                                                        value={customerName}
                                                        onChange={e => setCustomerName(e.target.value)}
                                                        placeholder="Ex : Mme Ndong"
                                                    />
                                                </div>

                                                <div className="layout-field">
                                                    <Label htmlFor="customer-phone" className="type-label">
                                                        Téléphone (optionnel)
                                                    </Label>
                                                    <Input
                                                        id="customer-phone"
                                                        type="tel"
                                                        inputMode="tel"
                                                        value={customerPhone}
                                                        onChange={e => setCustomerPhone(e.target.value)}
                                                        placeholder="Ex : 077 00 00 00"
                                                    />
                                                </div>

                                                <p className="type-caption">
                                                    Un code de retrait sera remis au client sur son ticket.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── Bouton de confirmation ── */}
                        <Button
                            className="w-full"
                            size="lg"
                            disabled={
                                isPending ||
                                !mode ||
                                (mode === 'pay_now' && !paymentMethod) ||
                                cashIncomplete ||
                                changeDueIncomplete
                            }
                            onClick={handleConfirm}
                        >
                            {isPending ? (
                                <>
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin"/>
                                    Enregistrement…
                                </>
                            ) : mode === 'pay_now' ? (
                                `Encaisser ${formatAmount(cashToCollect)} FCFA`
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