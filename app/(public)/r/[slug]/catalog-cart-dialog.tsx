// app/(public)/r/[slug]/catalog-cart-dialog.tsx
'use client'

import {useState} from 'react'
import {useRouter} from 'next/navigation'
import {
    Plus,
    Minus,
    Trash2,
    ShoppingBag,
    Calendar,
    ArrowLeft,
    User,
    Phone,
    Clock,
    Users,
    MessageSquare,
    CheckCircle2,
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
import {toast} from 'sonner'

interface CatalogCartDialogProps {
    restaurantId: string
    restaurantSlug: string
    restaurantName: string
    open: boolean
    onOpenChange: (open: boolean) => void
}

type FulfillmentType = 'takeway' | 'reservation' | null
type Step = 'cart' | 'fulfillment' | 'form'

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
    const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>(null)

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [customerName, setCustomerName] = useState('')
    const [customerPhone, setCustomerPhone] = useState('')
    const [notes, setNotes] = useState('')
    const [pickupTime, setPickupTime] = useState('')
    const [reservationDate, setReservationDate] = useState('')
    const [partySize, setPartySize] = useState(2)

    const isFormValid =
        customerName.trim().length >= 2 &&
        customerPhone.trim().length >= 8 &&
        (fulfillmentType === 'takeway' || (fulfillmentType === 'reservation' && reservationDate.trim().length > 0))

    function handleClose() {
        setStep('cart')
        setFulfillmentType(null)
        setCustomerName('')
        setCustomerPhone('')
        setNotes('')
        setPickupTime('')
        setReservationDate('')
        setPartySize(2)
        onOpenChange(false)
    }

    function handleSelectFulfillment(type: FulfillmentType) {
        setFulfillmentType(type)
        setStep('form')
    }

    function handleBack() {
        if (step === 'form') {
            setStep('fulfillment')
            setFulfillmentType(null)
        } else if (step === 'fulfillment') {
            setStep('cart')
        }
    }

    async function handleCheckout() {
        if (!isFormValid || !fulfillmentType) return

        setIsSubmitting(true)

        try {
            const orderData = {
                restaurantId,
                fulfillmentType,
                customerName,
                customerPhone,
                notes: notes || undefined,
                pickupTime: fulfillmentType === 'takeway' ? pickupTime || undefined : undefined,
                reservationDate: fulfillmentType === 'reservation' ? reservationDate : undefined,
                partySize: fulfillmentType === 'reservation' ? partySize : undefined,
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

            const successMessage = fulfillmentType === 'takeway'
                ? `Commande ${result.orderNumber} confirmée !`
                : `Réservation ${result.orderNumber} confirmée !`

            toast.success(successMessage, {
                description: fulfillmentType === 'takeway'
                    ? 'Préparez-vous à récupérer votre commande'
                    : 'Nous vous contacterons pour confirmer',
            })

            router.push(`/r/${restaurantSlug}/orders/${result.orderId}`)
        } catch (error) {
            console.error('Erreur checkout:', error)
            toast.error(error instanceof Error ? error.message : 'Une erreur est survenue')
        } finally {
            setIsSubmitting(false)
        }
    }

    const stepNumber = step === 'cart' ? 1 : step === 'fulfillment' ? 2 : 3

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
                                onClick={handleBack}
                            >
                                <ArrowLeft className="h-4 w-4"/>
                            </Button>
                        )}
                        <DialogHeader className="flex-1 space-y-0.5">
                            <DialogTitle className="type-card-title">
                                {step === 'cart' && 'Mon panier'}
                                {step === 'fulfillment' && 'Mode de retrait'}
                                {step === 'form' && (fulfillmentType === 'takeway' ? 'Vos coordonnées' : 'Votre réservation')}
                            </DialogTitle>
                            <DialogDescription className="type-caption">
                                {step === 'cart' && `${restaurantName}`}
                                {step === 'fulfillment' && 'Comment souhaitez-vous récupérer votre commande ?'}
                                {step === 'form' && 'Pour vous contacter quand ce sera prêt'}
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    {/* Indicateur d'étapes */}
                    <div className="flex items-center gap-1.5">
                        {[1, 2, 3].map((s) => (
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

                    {/* ÉTAPE 2 : Choix du mode */}
                    {step === 'fulfillment' && (
                        <div className="space-y-3 py-2">
                            <button
                                type="button"
                                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-transparent bg-muted/50 hover:border-primary hover:bg-primary/5 transition-all text-left"
                                onClick={() => handleSelectFulfillment('takeway')}
                            >
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                                    <ShoppingBag className="h-6 w-6 text-primary"/>
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold">À emporter</p>
                                    <p className="type-caption text-muted-foreground mt-0.5 text-sm">
                                        Récupérez votre commande sur place
                                    </p>
                                </div>
                            </button>

                            <button
                                type="button"
                                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-transparent bg-muted/50 hover:border-primary hover:bg-primary/5 transition-all text-left"
                                onClick={() => handleSelectFulfillment('reservation')}
                            >
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                                    <Calendar className="h-6 w-6 text-primary"/>
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold">Réserver une table</p>
                                    <p className="type-caption text-muted-foreground mt-0.5 text-sm">
                                        Garantissez votre place à l'avance
                                    </p>
                                </div>
                            </button>
                        </div>
                    )}

                    {/* ÉTAPE 3 : Formulaire */}
                    {step === 'form' && (
                        <div className="layout-form py-2">
                            {/* Récap compact pour takeway */}
                            {fulfillmentType === 'takeway' && items.length > 0 && (
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

                            {fulfillmentType === 'takeway' && (
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
                            )}

                            {fulfillmentType === 'reservation' && (
                                <>
                                    <div className="layout-field">
                                        <Label htmlFor="catalog-date" className="type-label layout-inline">
                                            <Calendar className="h-3.5 w-3.5 text-muted-foreground"/>
                                            Date et heure
                                        </Label>
                                        <Input
                                            id="catalog-date"
                                            type="datetime-local"
                                            value={reservationDate}
                                            onChange={(e) => setReservationDate(e.target.value)}
                                        />
                                    </div>

                                    <div className="layout-field">
                                        <Label className="type-label layout-inline">
                                            <Users className="h-3.5 w-3.5 text-muted-foreground"/>
                                            Nombre de personnes
                                        </Label>
                                        <div className="flex gap-2 flex-wrap">
                                            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                                                <Button
                                                    key={n}
                                                    type="button"
                                                    variant={partySize === n ? 'default' : 'outline'}
                                                    size="sm"
                                                    onClick={() => setPartySize(n)}
                                                    className="h-9 w-9 rounded-full"
                                                >
                                                    {n}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}

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
                                    placeholder={
                                        fulfillmentType === 'takeway'
                                            ? 'Allergies, préférences...'
                                            : 'Occasion spéciale, allergies...'
                                    }
                                    rows={2}
                                    className="resize-none"
                                />
                            </div>
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
                                onClick={() => setStep('fulfillment')}
                            >
                                <CheckCircle2 className="h-4 w-4"/>
                                Valider le panier
                            </Button>
                        </>
                    )}

                    {step === 'fulfillment' && (
                        <p className="type-caption text-muted-foreground text-center py-1">
                            {totalItems} article{totalItems > 1 ? 's' : ''} &middot; {formatPrice(totalAmount)}
                        </p>
                    )}

                    {step === 'form' && (
                        <LoadingButton
                            className="w-full"
                            size="lg"
                            onClick={handleCheckout}
                            disabled={!isFormValid}
                            isLoading={isSubmitting}
                            loadingText="Envoi en cours..."
                        >
                            {fulfillmentType === 'takeway'
                                ? `Commander \u00b7 ${formatPrice(totalAmount)}`
                                : 'Confirmer la réservation'}
                        </LoadingButton>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
