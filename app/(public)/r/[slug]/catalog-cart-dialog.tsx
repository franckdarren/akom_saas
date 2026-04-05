// app/(public)/r/[slug]/catalog-cart-dialog.tsx
'use client'

import {useState, useEffect, useRef} from 'react'
import {useRouter} from 'next/navigation'
import {
    Plus,
    Minus,
    Trash2,
    ShoppingBag,
    ArrowLeft,
    User,
    Phone,
    Clock,
    MessageSquare,
    CheckCircle2,
    Banknote,
    Smartphone,
    Loader2,
    XCircle,
    RefreshCw,
    ExternalLink,
} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {LoadingButton} from '@/components/ui/loading-button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Textarea} from '@/components/ui/textarea'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {Badge} from '@/components/ui/badge'
import {MobileMoneyForm} from '@/components/payment/mobile-money-form'
import {useCart} from './t/[number]/cart-context'
import {formatPrice} from '@/lib/utils/format'
import {toast} from 'sonner'
import {cn} from '@/lib/utils'

interface CatalogCartDialogProps {
    restaurantId: string
    restaurantSlug: string
    restaurantName: string
    singpayEnabled: boolean
    open: boolean
    onOpenChange: (open: boolean) => void
}

type Step = 'cart' | 'info' | 'payment' | 'processing' | 'confirmation'
type PaymentChoice = 'cash' | 'mobile_money'
type CheckoutResult = 'success_cash' | 'success_mm' | 'failed_mm' | 'timeout_mm' | 'redirect_ext'

/** Intervalle de polling inline (3s) */
const POLL_INTERVAL = 3_000
/** Nombre max de polls (40 × 3s = 2min) */
const MAX_POLLS = 40

const STEP_TITLES: Record<Step, string> = {
    cart: 'Mon panier',
    info: 'Vos coordonnées',
    payment: 'Paiement',
    processing: 'Paiement en cours',
    confirmation: 'Confirmation',
}

const STEP_DESCRIPTIONS: Record<Step, string> = {
    cart: '',
    info: 'Pour vous contacter quand ce sera prêt',
    payment: 'Choisissez votre mode de paiement',
    processing: 'Veuillez valider sur votre téléphone',
    confirmation: '',
}

/** Mapping étape → barre de progression (sur 3) */
function stepProgress(step: Step): number {
    switch (step) {
        case 'cart':
        case 'info':
            return 1
        case 'payment':
            return 2
        case 'processing':
        case 'confirmation':
            return 3
    }
}

export function CatalogCartDialog({
                                      restaurantId,
                                      restaurantSlug,
                                      restaurantName,
                                      singpayEnabled,
                                      open,
                                      onOpenChange,
                                  }: CatalogCartDialogProps) {
    const router = useRouter()
    const {items, totalItems, totalAmount, updateQuantity, removeItem, clearCart} = useCart()

    const [step, setStep] = useState<Step>('cart')
    const [paymentChoice, setPaymentChoice] = useState<PaymentChoice | null>(null)

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [customerName, setCustomerName] = useState('')
    const [customerPhone, setCustomerPhone] = useState('')
    const [notes, setNotes] = useState('')
    const [pickupTime, setPickupTime] = useState('')

    // État checkout
    const [orderId, setOrderId] = useState<string | null>(null)
    const [orderNumber, setOrderNumber] = useState<string | null>(null)
    const [paymentId, setPaymentId] = useState<string | null>(null)
    const [checkoutResult, setCheckoutResult] = useState<CheckoutResult | null>(null)
    const [errorMessage, setErrorMessage] = useState('')
    const [extPaymentLink, setExtPaymentLink] = useState<string | null>(null)
    const [confirmedAmount, setConfirmedAmount] = useState<number>(0)
    const [mmValid, setMmValid] = useState(false)
    const mmSubmitRef = useRef<(() => void) | null>(null)

    const pollCount = useRef(0)

    const isFormValid =
        customerName.trim().length >= 2 &&
        customerPhone.trim().length >= 8

    const progress = stepProgress(step)

    // Description dynamique pour l'étape cart
    const description = step === 'cart' ? restaurantName : STEP_DESCRIPTIONS[step]

    function resetAll() {
        setStep('cart')
        setPaymentChoice(null)
        setCustomerName('')
        setCustomerPhone('')
        setNotes('')
        setPickupTime('')
        setOrderId(null)
        setOrderNumber(null)
        setPaymentId(null)
        setCheckoutResult(null)
        setErrorMessage('')
        setExtPaymentLink(null)
        setConfirmedAmount(0)
        pollCount.current = 0
    }

    function handleClose() {
        resetAll()
        onOpenChange(false)
    }

    function handleGoBack() {
        if (step === 'info') setStep('cart')
        else if (step === 'payment') setStep('info')
    }

    // ── Polling inline pour mobile money ──

    useEffect(() => {
        if (step !== 'processing' || !paymentId) return

        pollCount.current = 0

        const interval = setInterval(async () => {
            pollCount.current++

            if (pollCount.current > MAX_POLLS) {
                setCheckoutResult('timeout_mm')
                setStep('confirmation')
                clearInterval(interval)
                return
            }

            try {
                const res = await fetch(`/api/payments/${paymentId}/status`)
                const data = await res.json()

                if (data.isPaid) {
                    setCheckoutResult('success_mm')
                    setStep('confirmation')
                    clearInterval(interval)
                } else if (data.isFailed) {
                    setCheckoutResult('failed_mm')
                    setErrorMessage(data.errorMessage ?? 'Paiement échoué')
                    setStep('confirmation')
                    clearInterval(interval)
                }
            } catch {
                // Erreur réseau, on continue le polling
            }
        }, POLL_INTERVAL)

        return () => clearInterval(interval)
    }, [step, paymentId])

    // ── Création de commande ──

    async function createOrder(): Promise<{orderId: string; orderNumber: string} | null> {
        const orderData = {
            restaurantId,
            fulfillmentType: 'takeway' as const,
            customerName,
            customerPhone,
            notes: notes || undefined,
            pickupTime: pickupTime || undefined,
            items: items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
            })),
        }

        const response = await fetch('/api/catalog/orders', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(orderData),
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Erreur lors de la création de la commande')
        }

        const result = await response.json()
        setOrderId(result.orderId)
        setOrderNumber(result.orderNumber)
        return result
    }

    // ── Checkout cash ──

    async function handleCheckoutCash() {
        if (!isFormValid) return
        setIsSubmitting(true)

        try {
            await createOrder()
            setConfirmedAmount(totalAmount)
            clearCart()
            setCheckoutResult('success_cash')
            setStep('confirmation')
        } catch (error) {
            console.error('Erreur checkout cash:', error)
            toast.error(error instanceof Error ? error.message : 'Une erreur est survenue')
        } finally {
            setIsSubmitting(false)
        }
    }

    // ── Checkout mobile money ──

    async function handleCheckoutMobileMoney(phoneNumber: string, operator: 'airtel' | 'moov') {
        setIsSubmitting(true)

        try {
            // 1. Créer la commande si elle n'existe pas encore
            let currentOrderId = orderId
            if (!currentOrderId) {
                const order = await createOrder()
                if (!order) throw new Error('Erreur lors de la création de la commande')
                currentOrderId = order.orderId
            }

            // 2. Initier le paiement SingPay (USSD Push)
            const {initiateOrderPayment} = await import('@/lib/actions/singpay-payment')
            const paymentResult = await initiateOrderPayment({
                orderId: currentOrderId,
                phoneNumber,
                operator,
            })

            if (paymentResult.error) {
                // USSD Push échoué → tenter le fallback /ext
                console.warn('[SingPay] USSD Push échoué, tentative fallback /ext:', paymentResult.error)
                await handleFallbackToExt(currentOrderId)
                return
            }

            setConfirmedAmount(totalAmount)
            clearCart()
            setPaymentId(paymentResult.paymentId!)
            setStep('processing')
        } catch (error) {
            console.error('Erreur checkout mobile money:', error)
            toast.error(error instanceof Error ? error.message : 'Une erreur est survenue')
        } finally {
            setIsSubmitting(false)
        }
    }

    /** Fallback : génère un lien de paiement externe SingPay */
    async function handleFallbackToExt(targetOrderId: string) {
        try {
            const {getExternalPaymentLink} = await import('@/lib/actions/singpay-payment')
            const result = await getExternalPaymentLink(targetOrderId)

            if (result.link) {
                setConfirmedAmount(totalAmount)
                clearCart()
                setExtPaymentLink(result.link)
                setCheckoutResult('redirect_ext')
                setStep('confirmation')
            } else {
                toast.error(result.error ?? 'Impossible de générer le lien de paiement')
            }
        } catch {
            toast.error('Impossible de générer le lien de paiement')
        }
    }

    // ── Actions confirmation ──

    function handleConfirmationClose() {
        resetAll()
        clearCart()
        onOpenChange(false)
    }

    function handleGoToOrder() {
        if (orderId) {
            router.push(`/r/${restaurantSlug}/orders/${orderId}`)
        }
        handleClose()
    }

    function handleRetryPayment() {
        setCheckoutResult(null)
        setErrorMessage('')
        setPaymentId(null)
        pollCount.current = 0
        setStep('payment')
    }

    function handleRetryPolling() {
        setCheckoutResult(null)
        pollCount.current = 0
        setStep('processing')
    }

    /** Fallback vers cash après échec/timeout mobile money */
    async function handleFallbackToCash() {
        // La commande existe déjà, on redirige simplement vers le suivi
        setCheckoutResult('success_cash')
    }

    // ── Rendu ──

    const canGoBack = step === 'info' || step === 'payment'

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md max-h-[85vh] flex flex-col gap-0 p-0">

                {/* ── Header avec indicateur d'étape ── */}
                <div className="px-6 pt-6 pb-4">
                    <div className="flex items-center gap-3 mb-3">
                        {canGoBack && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0"
                                onClick={handleGoBack}
                            >
                                <ArrowLeft className="h-4 w-4"/>
                            </Button>
                        )}
                        <DialogHeader className="flex-1 space-y-0.5">
                            <DialogTitle className="type-card-title">
                                {STEP_TITLES[step]}
                            </DialogTitle>
                            {description && (
                                <DialogDescription className="type-caption">
                                    {description}
                                </DialogDescription>
                            )}
                        </DialogHeader>
                    </div>

                    {/* Indicateur d'étapes — 3 barres */}
                    <div className="flex items-center gap-1.5">
                        {[1, 2, 3].map((s) => (
                            <div
                                key={s}
                                className={cn(
                                    'h-1 flex-1 rounded-full transition-colors',
                                    s <= progress ? 'bg-primary' : 'bg-muted',
                                )}
                            />
                        ))}
                    </div>
                </div>

                {/* ── Contenu scrollable ── */}
                <div className="flex-1 overflow-y-auto px-6">

                    {/* ÉTAPE 1 : Panier */}
                    {step === 'cart' && (
                        <>
                            {items.length === 0 ? (
                                <div className="layout-empty-state">
                                    <ShoppingBag className="h-10 w-10 text-muted-foreground"/>
                                    <p className="type-body-muted">Votre panier est vide</p>
                                    <Button variant="outline" onClick={handleClose}>
                                        Voir le menu
                                    </Button>
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {items.map((item) => (
                                        <div key={item.productId} className="py-3 space-y-2">
                                            <div className="flex items-start gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium leading-snug">{item.name}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {formatPrice(item.price)} / unité
                                                    </p>
                                                </div>
                                                <span className="font-semibold tabular-nums shrink-0 pt-0.5">
                                                    {formatPrice(item.price * item.quantity)}
                                                </span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                                                    onClick={() => removeItem(item.productId)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5"/>
                                                </Button>
                                            </div>
                                            <div className="flex items-center gap-1.5 w-fit">
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-8 w-8 rounded-full"
                                                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                                >
                                                    <Minus className="h-3.5 w-3.5"/>
                                                </Button>
                                                <span className="w-8 text-center font-semibold tabular-nums">
                                                    {item.quantity}
                                                </span>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-8 w-8 rounded-full"
                                                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                                >
                                                    <Plus className="h-3.5 w-3.5"/>
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {/* ÉTAPE 2 : Coordonnées */}
                    {step === 'info' && (
                        <div className="layout-form py-2">
                            {/* Récap compact */}
                            {items.length > 0 && (
                                <div className="rounded-lg bg-muted/50 p-3 space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <span className="type-label-meta">Récapitulatif</span>
                                        <Badge variant="secondary">
                                            {totalItems} article{totalItems > 1 ? 's' : ''}
                                        </Badge>
                                    </div>
                                    <div className="space-y-1">
                                        {items.map((item) => (
                                            <div key={item.productId} className="flex justify-between type-caption">
                                                <span className="text-muted-foreground">
                                                    {item.quantity}x {item.name}
                                                </span>
                                                <span className="font-medium tabular-nums">
                                                    {formatPrice(item.price * item.quantity)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                    <div
                                        className="flex justify-between pt-1.5 border-t border-border/50 font-semibold text-sm">
                                        <span>Total</span>
                                        <span>{formatPrice(totalAmount)}</span>
                                    </div>
                                </div>
                            )}

                            <div className="layout-field">
                                <Label htmlFor="catalog-name" className="type-label layout-inline">
                                    <User className="h-3.5 w-3.5 text-muted-foreground"/>
                                    Prénom & Nom
                                </Label>
                                <Input
                                    id="catalog-name"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    placeholder="Jean-Baptiste Moussavou"
                                />
                            </div>

                            <div className="layout-field">
                                <Label htmlFor="catalog-phone" className="type-label layout-inline">
                                    <Phone className="h-3.5 w-3.5 text-muted-foreground"/>
                                    Téléphone
                                </Label>
                                <Input
                                    id="catalog-phone"
                                    type="tel"
                                    value={customerPhone}
                                    onChange={(e) => setCustomerPhone(e.target.value)}
                                    placeholder="07 12 34 56"
                                />
                            </div>

                            <div className="layout-field">
                                <Label htmlFor="catalog-pickup" className="type-label layout-inline">
                                    <Clock className="h-3.5 w-3.5 text-muted-foreground"/>
                                    Heure de retrait
                                    <span className="text-muted-foreground font-normal">(optionnel)</span>
                                </Label>
                                <Input
                                    id="catalog-pickup"
                                    type="time"
                                    value={pickupTime}
                                    onChange={(e) => setPickupTime(e.target.value)}
                                />
                            </div>

                            <div className="layout-field">
                                <Label htmlFor="catalog-notes" className="type-label layout-inline">
                                    <MessageSquare className="h-3.5 w-3.5 text-muted-foreground"/>
                                    Notes
                                    <span className="text-muted-foreground font-normal">(optionnel)</span>
                                </Label>
                                <Textarea
                                    id="catalog-notes"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Allergies, préférences..."
                                    rows={2}
                                    className="resize-none"
                                />
                            </div>
                        </div>
                    )}

                    {/* ÉTAPE 3 : Paiement */}
                    {step === 'payment' && (
                        <div className="layout-form py-2">
                            {/* Total rappel */}
                            <div className="flex justify-between items-center rounded-lg bg-muted/50 p-3">
                                <span className="type-label-meta">Total à payer</span>
                                <span className="text-lg font-bold">{formatPrice(totalAmount)}</span>
                            </div>

                            {/* Choix du mode de paiement */}
                            <div className="layout-field">
                                <Label className="type-label">Mode de paiement</Label>
                                <div className={cn(
                                    'grid gap-3',
                                    singpayEnabled ? 'grid-cols-2' : 'grid-cols-1',
                                )}>
                                    <button
                                        type="button"
                                        onClick={() => setPaymentChoice('cash')}
                                        className={cn(
                                            'flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors',
                                            paymentChoice === 'cash'
                                                ? 'border-primary bg-primary/5'
                                                : 'border-border hover:border-muted-foreground/30',
                                        )}
                                    >
                                        <Banknote className="h-6 w-6"/>
                                        <span className="text-sm font-semibold">Payer à la caisse</span>
                                        <span className="type-caption text-muted-foreground">
                                            Espèces au retrait
                                        </span>
                                    </button>
                                    {singpayEnabled && (
                                        <button
                                            type="button"
                                            onClick={() => setPaymentChoice('mobile_money')}
                                            className={cn(
                                                'flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors',
                                                paymentChoice === 'mobile_money'
                                                    ? 'border-primary bg-primary/5'
                                                    : 'border-border hover:border-muted-foreground/30',
                                            )}
                                        >
                                            <Smartphone className="h-6 w-6"/>
                                            <span className="text-sm font-semibold">Mobile Money</span>
                                            <span className="type-caption text-muted-foreground">
                                                Airtel / Moov
                                            </span>
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Sous-formulaire Mobile Money */}
                            {paymentChoice === 'mobile_money' && (
                                <MobileMoneyForm
                                    amount={totalAmount}
                                    defaultPhone={customerPhone}
                                    isLoading={isSubmitting}
                                    onSubmit={handleCheckoutMobileMoney}
                                    externalSubmit
                                    onValidityChange={(valid, submit) => {
                                        setMmValid(valid)
                                        mmSubmitRef.current = submit
                                    }}
                                />
                            )}
                        </div>
                    )}

                    {/* ÉTAPE 4 : Processing (mobile money) */}
                    {step === 'processing' && (
                        <div className="flex flex-col items-center gap-4 py-8">
                            <div className="relative">
                                <Smartphone className="h-12 w-12 text-muted-foreground"/>
                                <Loader2 className="h-5 w-5 text-primary animate-spin absolute -top-1 -right-1"/>
                            </div>
                            <div className="text-center space-y-1">
                                <p className="font-semibold">En attente de validation</p>
                                <p className="type-body-muted">
                                    Composez le code PIN sur votre téléphone pour valider le paiement
                                </p>
                            </div>
                            <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-4 py-2">
                                <span className="type-caption text-muted-foreground">Montant :</span>
                                <span className="font-semibold">{formatPrice(confirmedAmount)}</span>
                            </div>
                        </div>
                    )}

                    {/* ÉTAPE 5 : Confirmation */}
                    {step === 'confirmation' && (
                        <div className="flex flex-col items-center gap-4 py-8">
                            {/* Succès cash */}
                            {checkoutResult === 'success_cash' && (
                                <>
                                    <CheckCircle2 className="h-14 w-14 text-success"/>
                                    <div className="text-center space-y-1">
                                        <p className="font-semibold">Commande envoyée !</p>
                                        <p className="type-body-muted">
                                            {orderNumber && `Commande ${orderNumber} — `}Présentez-vous à la caisse pour le paiement
                                        </p>
                                    </div>
                                </>
                            )}

                            {/* Succès mobile money */}
                            {checkoutResult === 'success_mm' && (
                                <>
                                    <CheckCircle2 className="h-14 w-14 text-success"/>
                                    <div className="text-center space-y-1">
                                        <p className="font-semibold">Paiement confirmé !</p>
                                        <p className="type-body-muted">
                                            {orderNumber && `Commande ${orderNumber} — `}Votre commande est en cours de préparation
                                        </p>
                                    </div>
                                </>
                            )}

                            {/* Échec mobile money */}
                            {checkoutResult === 'failed_mm' && (
                                <>
                                    <XCircle className="h-14 w-14 text-destructive"/>
                                    <div className="text-center space-y-1">
                                        <p className="font-semibold">Paiement échoué</p>
                                        <p className="type-body-muted">{errorMessage}</p>
                                    </div>
                                </>
                            )}

                            {/* Timeout mobile money */}
                            {checkoutResult === 'timeout_mm' && (
                                <>
                                    <Loader2 className="h-14 w-14 text-warning"/>
                                    <div className="text-center space-y-1">
                                        <p className="font-semibold">Délai dépassé</p>
                                        <p className="type-body-muted">
                                            Nous n'avons pas reçu de confirmation. Si vous avez validé le paiement,
                                            il sera traité automatiquement.
                                        </p>
                                    </div>
                                </>
                            )}

                            {/* Redirection vers paiement externe SingPay */}
                            {checkoutResult === 'redirect_ext' && (
                                <>
                                    <Smartphone className="h-14 w-14 text-primary"/>
                                    <div className="text-center space-y-1">
                                        <p className="font-semibold">Paiement en ligne</p>
                                        <p className="type-body-muted">
                                            Vous allez être redirigé vers la page de paiement sécurisée SingPay
                                            pour finaliser votre commande.
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-4 py-2">
                                        <span className="type-caption text-muted-foreground">Montant :</span>
                                        <span className="font-semibold">{formatPrice(confirmedAmount)}</span>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* ── Footer fixe ── */}
                <div className="border-t px-6 py-4 space-y-2">
                    {/* Cart → Valider */}
                    {step === 'cart' && items.length > 0 && (
                        <>
                            <div className="flex justify-between items-center mb-1">
                                <span className="type-body font-semibold">Total</span>
                                <span className="text-lg font-bold">{formatPrice(totalAmount)}</span>
                            </div>
                            <Button
                                className="w-full mt-2"
                                size="lg"
                                onClick={() => setStep('info')}
                            >
                                <CheckCircle2 className="h-4 w-4"/>
                                Passer la commande
                            </Button>
                        </>
                    )}

                    {/* Info → Continuer vers le paiement */}
                    {step === 'info' && (
                        <LoadingButton
                            className="w-full"
                            size="lg"
                            onClick={() => setStep('payment')}
                            disabled={!isFormValid}
                        >
                            Continuer
                        </LoadingButton>
                    )}

                    {/* Payment → Commander (cash) */}
                    {step === 'payment' && paymentChoice === 'cash' && (
                        <LoadingButton
                            className="w-full"
                            size="lg"
                            onClick={handleCheckoutCash}
                            isLoading={isSubmitting}
                            loadingText="Envoi en cours..."
                        >
                            {`Commander · ${formatPrice(totalAmount)}`}
                        </LoadingButton>
                    )}

                    {/* Payment → Payer (mobile money) */}
                    {step === 'payment' && paymentChoice === 'mobile_money' && (
                        <LoadingButton
                            className="w-full"
                            size="lg"
                            onClick={() => mmSubmitRef.current?.()}
                            disabled={!mmValid}
                            isLoading={isSubmitting}
                            loadingText="Initiation du paiement..."
                        >
                            {`Payer · ${formatPrice(totalAmount)}`}
                        </LoadingButton>
                    )}

                    {/* Processing → pas de bouton footer (attente) */}

                    {/* Confirmation — actions selon le résultat */}
                    {step === 'confirmation' && checkoutResult === 'success_cash' && (
                        <div className="flex flex-col gap-2">
                            <Button className="w-full" size="lg" onClick={handleGoToOrder}>
                                Suivre ma commande
                            </Button>
                            <Button variant="outline" className="w-full" onClick={handleConfirmationClose}>
                                Fermer
                            </Button>
                        </div>
                    )}

                    {step === 'confirmation' && checkoutResult === 'success_mm' && (
                        <Button className="w-full" size="lg" onClick={handleGoToOrder}>
                            Suivre ma commande
                        </Button>
                    )}

                    {step === 'confirmation' && checkoutResult === 'failed_mm' && (
                        <div className="flex flex-col gap-2">
                            <Button className="w-full" size="lg" onClick={handleRetryPayment}>
                                <RefreshCw className="h-4 w-4"/>
                                Réessayer
                            </Button>
                            <Button variant="outline" className="w-full" onClick={handleFallbackToCash}>
                                Payer à la caisse
                            </Button>
                        </div>
                    )}

                    {step === 'confirmation' && checkoutResult === 'redirect_ext' && extPaymentLink && (
                        <div className="flex flex-col gap-2">
                            <Button className="w-full" size="lg" asChild>
                                <a href={extPaymentLink} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-4 w-4"/>
                                    Payer maintenant
                                </a>
                            </Button>
                            <Button variant="outline" className="w-full" onClick={handleFallbackToCash}>
                                Payer à la caisse
                            </Button>
                        </div>
                    )}

                    {step === 'confirmation' && checkoutResult === 'timeout_mm' && (
                        <div className="flex flex-col gap-2">
                            <Button className="w-full" size="lg" onClick={handleRetryPolling}>
                                <RefreshCw className="h-4 w-4"/>
                                Vérifier à nouveau
                            </Button>
                            <Button variant="outline" className="w-full" onClick={handleGoToOrder}>
                                Voir ma commande
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
