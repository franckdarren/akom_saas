// app/(public)/r/[slug]/catalog-cart-dialog.tsx
'use client'

import {useState} from 'react'
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

type Step = 'cart' | 'form' | 'payment'
type PaymentChoice = 'cash' | 'mobile_money'

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

    const isFormValid =
        customerName.trim().length >= 2 &&
        customerPhone.trim().length >= 8

    const totalSteps = singpayEnabled ? 3 : 2
    const stepNumber = step === 'cart' ? 1 : step === 'form' ? 2 : 3

    function handleClose() {
        setStep('cart')
        setPaymentChoice(null)
        setCustomerName('')
        setCustomerPhone('')
        setNotes('')
        setPickupTime('')
        onOpenChange(false)
    }

    function handleGoBack() {
        if (step === 'form') setStep('cart')
        else if (step === 'payment') setStep('form')
    }

    function handleFormNext() {
        if (!isFormValid) return
        if (singpayEnabled) {
            setStep('payment')
        } else {
            handleCheckoutCash()
        }
    }

    /** Crée la commande (paiement en espèces ou sans paiement en ligne) */
    async function handleCheckoutCash() {
        if (!isFormValid) return
        setIsSubmitting(true)

        try {
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

            clearCart()

            toast.success(`Commande ${result.orderNumber} confirmée !`, {
                description: 'Préparez-vous à récupérer votre commande',
            })

            router.push(`/r/${restaurantSlug}/orders/${result.orderId}`)
        } catch (error) {
            console.error('Erreur checkout:', error)
            toast.error(error instanceof Error ? error.message : 'Une erreur est survenue')
        } finally {
            setIsSubmitting(false)
        }
    }

    /** Crée la commande PUIS initie le paiement mobile money */
    async function handleCheckoutMobileMoney(phoneNumber: string, operator: 'airtel' | 'moov') {
        setIsSubmitting(true)

        try {
            // 1. Créer la commande
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

            const orderResponse = await fetch('/api/catalog/orders', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(orderData),
            })

            if (!orderResponse.ok) {
                const error = await orderResponse.json()
                throw new Error(error.error || 'Erreur lors de la création de la commande')
            }

            const order = await orderResponse.json()

            // 2. Initier le paiement SingPay
            const { initiateOrderPayment } = await import('@/lib/actions/singpay-payment')
            const paymentResult = await initiateOrderPayment({
                orderId: order.orderId,
                phoneNumber,
                operator,
            })

            if (paymentResult.error) {
                throw new Error(paymentResult.error)
            }

            clearCart()

            // 3. Rediriger vers la page de suivi du paiement
            router.push(
                `/r/${restaurantSlug}/orders/${order.orderId}/payment?paymentId=${paymentResult.paymentId}`,
            )
        } catch (error) {
            console.error('Erreur checkout mobile money:', error)
            toast.error(error instanceof Error ? error.message : 'Une erreur est survenue')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md max-h-[85vh] flex flex-col gap-0 p-0">

                {/* ── Header avec indicateur d'étape ── */}
                <div className="px-6 pt-6 pb-4">
                    <div className="flex items-center gap-3 mb-3">
                        {step !== 'cart' && (
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
                                {step === 'cart' && 'Mon panier'}
                                {step === 'form' && 'Vos coordonnées'}
                                {step === 'payment' && 'Paiement'}
                            </DialogTitle>
                            <DialogDescription className="type-caption">
                                {step === 'cart' && `${restaurantName}`}
                                {step === 'form' && 'Pour vous contacter quand ce sera prêt'}
                                {step === 'payment' && 'Choisissez votre mode de paiement'}
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    {/* Indicateur d'étapes */}
                    <div className="flex items-center gap-1.5">
                        {Array.from({length: totalSteps}, (_, i) => i + 1).map((s) => (
                            <div
                                key={s}
                                className={`h-1 flex-1 rounded-full transition-colors ${
                                    s <= stepNumber ? 'bg-primary' : 'bg-muted'
                                }`}
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
                                            {/* Ligne 1 : Nom + sous-total + supprimer */}
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
                                            {/* Ligne 2 : Contrôles quantité */}
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

                    {/* ÉTAPE 2 : Formulaire */}
                    {step === 'form' && (
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
                                    <div className="flex justify-between pt-1.5 border-t border-border/50 font-semibold text-sm">
                                        <span>Total</span>
                                        <span>{formatPrice(totalAmount)}</span>
                                    </div>
                                </div>
                            )}

                            {/* Champs coordonnées */}
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
                                <div className="grid grid-cols-2 gap-3">
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
                                        <span className="text-sm font-semibold">Espèces</span>
                                        <span className="type-caption text-muted-foreground">
                                            Payer au retrait
                                        </span>
                                    </button>
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
                                </div>
                            </div>

                            {/* Sous-formulaire Mobile Money */}
                            {paymentChoice === 'mobile_money' && (
                                <MobileMoneyForm
                                    amount={totalAmount}
                                    defaultPhone={customerPhone}
                                    isLoading={isSubmitting}
                                    onSubmit={handleCheckoutMobileMoney}
                                />
                            )}
                        </div>
                    )}
                </div>

                {/* ── Footer fixe ── */}
                <div className="border-t px-6 py-4 space-y-2">
                    {step === 'cart' && items.length > 0 && (
                        <>
                            <div className="flex justify-between items-center mb-1">
                                <span className="type-body font-semibold">Total</span>
                                <span className="text-lg font-bold">{formatPrice(totalAmount)}</span>
                            </div>
                            <Button
                                className="w-full mt-2"
                                size="lg"
                                onClick={() => setStep('form')}
                            >
                                <CheckCircle2 className="h-4 w-4"/>
                                Valider le panier
                            </Button>
                        </>
                    )}

                    {step === 'form' && (
                        <LoadingButton
                            className="w-full"
                            size="lg"
                            onClick={handleFormNext}
                            disabled={!isFormValid}
                            isLoading={!singpayEnabled && isSubmitting}
                            loadingText="Envoi en cours..."
                        >
                            {singpayEnabled
                                ? 'Continuer vers le paiement'
                                : `Commander · ${formatPrice(totalAmount)}`}
                        </LoadingButton>
                    )}

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
                </div>
            </DialogContent>
        </Dialog>
    )
}
