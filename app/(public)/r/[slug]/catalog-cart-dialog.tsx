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
import {useCart} from './t/[number]/cart-context'
import {formatPrice} from '@/lib/utils/format'
import {saveCatalogOrder} from '@/lib/utils/catalog-orders-storage'
import {toast} from 'sonner'
import {cn} from '@/lib/utils'

interface CatalogCartDialogProps {
    restaurantId: string
    restaurantSlug: string
    restaurantName: string
    open: boolean
    onOpenChange: (open: boolean) => void
}

type Step = 'cart' | 'info' | 'confirmation'

const STEP_TITLES: Record<Step, string> = {
    cart: 'Mon panier',
    info: 'Vos coordonnées',
    confirmation: 'Confirmation',
}

const STEP_DESCRIPTIONS: Record<Step, string> = {
    cart: '',
    info: 'Pour vous contacter quand ce sera prêt',
    confirmation: '',
}

/** Mapping étape → barre de progression (sur 2) */
function stepProgress(step: Step): number {
    switch (step) {
        case 'cart':
            return 1
        case 'info':
        case 'confirmation':
            return 2
    }
}

export function CatalogCartDialog({
                                      restaurantId,
                                      restaurantSlug,
                                      restaurantName,
                                      open,
                                      onOpenChange,
                                  }: CatalogCartDialogProps) {
    const router = useRouter()
    const {items, totalItems, totalAmount, updateQuantity, removeItem, clearCart} = useCart()

    const [step, setStep] = useState<Step>('cart')

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [customerName, setCustomerName] = useState('')
    const [customerPhone, setCustomerPhone] = useState('')
    const [notes, setNotes] = useState('')
    const [pickupTime, setPickupTime] = useState('')

    // État checkout
    const [orderId, setOrderId] = useState<string | null>(null)
    const [orderNumber, setOrderNumber] = useState<string | null>(null)

    const isFormValid =
        customerName.trim().length >= 2 &&
        customerPhone.trim().length >= 8

    const progress = stepProgress(step)

    // Description dynamique pour l'étape cart
    const description = step === 'cart' ? restaurantName : STEP_DESCRIPTIONS[step]

    function resetAll() {
        setStep('cart')
        setCustomerName('')
        setCustomerPhone('')
        setNotes('')
        setPickupTime('')
        setOrderId(null)
        setOrderNumber(null)
    }

    function handleClose() {
        resetAll()
        onOpenChange(false)
    }

    function handleGoBack() {
        if (step === 'info') setStep('cart')
    }

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

    // ── Checkout (paiement à la caisse) ──

    async function handleCheckout() {
        if (!isFormValid) return
        setIsSubmitting(true)

        try {
            const order = await createOrder()
            if (order) saveCatalogOrder(restaurantSlug, order.orderId, order.orderNumber)
            clearCart()
            setStep('confirmation')
        } catch (error) {
            console.error('Erreur checkout:', error)
            toast.error(error instanceof Error ? error.message : 'Une erreur est survenue')
        } finally {
            setIsSubmitting(false)
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

    // ── Rendu ──

    const canGoBack = step === 'info'

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

                    {/* Indicateur d'étapes — 2 barres */}
                    <div className="flex items-center gap-1.5">
                        {[1, 2].map((s) => (
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
                                    placeholder="077 12 34 56"
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

                            {/* Mode de paiement — espèces à la caisse */}
                            <div className="layout-inline rounded-lg border bg-muted/50 p-3">
                                <Banknote className="h-5 w-5 shrink-0 text-muted-foreground"/>
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold">Paiement à la caisse</p>
                                    <p className="type-caption text-muted-foreground">
                                        Réglez votre commande au moment du retrait
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ÉTAPE 3 : Confirmation */}
                    {step === 'confirmation' && (
                        <div className="flex flex-col items-center gap-4 py-8">
                            <CheckCircle2 className="h-14 w-14 text-success"/>
                            <div className="text-center space-y-1">
                                <p className="font-semibold">Commande envoyée !</p>
                                <p className="type-body-muted">
                                    {orderNumber && `Commande ${orderNumber} — `}Présentez-vous à la caisse pour le paiement
                                </p>
                            </div>
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

                    {/* Info → Commander */}
                    {step === 'info' && (
                        <LoadingButton
                            className="w-full"
                            size="lg"
                            onClick={handleCheckout}
                            disabled={!isFormValid}
                            isLoading={isSubmitting}
                            loadingText="Envoi en cours..."
                        >
                            {`Commander · ${formatPrice(totalAmount)}`}
                        </LoadingButton>
                    )}

                    {/* Confirmation */}
                    {step === 'confirmation' && (
                        <div className="flex flex-col gap-2">
                            <Button className="w-full" size="lg" onClick={handleGoToOrder}>
                                Suivre ma commande
                            </Button>
                            <Button variant="outline" className="w-full" onClick={handleConfirmationClose}>
                                Fermer
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
