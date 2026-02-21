// app/(public)/r/[slug]/catalog-cart-dialog.tsx
'use client'

import {useState} from 'react'
import {useRouter} from 'next/navigation'
import {Loader2, Plus, Minus, Trash2, ShoppingBag, Calendar, AlertCircle} from 'lucide-react'
import {Button} from '@/components/ui/button'
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
import {Card} from '@/components/ui/card'
import {useCart} from './t/[number]/cart-context'
import {formatPrice} from '@/lib/utils/format'
import {toast} from 'sonner'

interface CatalogCartDialogProps {
    restaurantSlug: string
    restaurantName: string
    open: boolean
    onOpenChange: (open: boolean) => void
}

type FulfillmentType = 'takeway' | 'reservation' | null

export function CatalogCartDialog({
                                      restaurantSlug,
                                      restaurantName,
                                      open,
                                      onOpenChange,
                                  }: CatalogCartDialogProps) {
    const router = useRouter()
    // ✅ CORRECTION : totalAmount au lieu de totalPrice
    const {items, totalItems, totalAmount, updateQuantity, removeItem, clearCart} = useCart()

    // État pour le fulfillment (étape 1)
    const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>(null)

    // État pour le checkout (étape 2)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [customerName, setCustomerName] = useState('')
    const [customerPhone, setCustomerPhone] = useState('')
    const [notes, setNotes] = useState('')

    // Pour les commandes à emporter
    const [pickupTime, setPickupTime] = useState('')

    // Pour les réservations
    const [reservationDate, setReservationDate] = useState('')
    const [partySize, setPartySize] = useState(2)

    // Calculer si le formulaire est valide
    const isFormValid =
        customerName.trim().length >= 2 &&
        customerPhone.trim().length >= 8 &&
        (fulfillmentType === 'takeway' ? true : (fulfillmentType === 'reservation' ? reservationDate.trim().length > 0 : false))

    function handleClose() {
        // Réinitialiser l'état quand on ferme
        setFulfillmentType(null)
        setCustomerName('')
        setCustomerPhone('')
        setNotes('')
        setPickupTime('')
        setReservationDate('')
        setPartySize(2)
        onOpenChange(false)
    }

    async function handleCheckout() {
        if (!isFormValid || !fulfillmentType) return

        setIsSubmitting(true)

        try {
            // Préparer les données de la commande
            const orderData = {
                restaurantSlug,
                source: 'publik_link',
                fulfillmentType,
                customerName,
                customerPhone,
                notes: notes || undefined,
                pickupTime: fulfillmentType === 'takeway' ? pickupTime || undefined : undefined,
                reservationDate: fulfillmentType === 'reservation' ? reservationDate : undefined,
                partySize: fulfillmentType === 'reservation' ? partySize : undefined,
                items: items.map((item) => ({
                    // ✅ CORRECTION : productId au lieu de id
                    productId: item.productId,
                    quantity: item.quantity,
                })),
            }

            // Appeler l'API pour créer la commande
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

            // Vider le panier
            clearCart()

            // Afficher un message de succès
            const successMessage = fulfillmentType === 'takeway'
                ? `Commande ${result.orderNumber} confirmée ! Préparez-vous à récupérer votre commande.`
                : `Réservation ${result.orderNumber} confirmée ! Nous vous contacterons pour confirmer.`

            toast.success(successMessage)

            // Rediriger vers la page de suivi
            router.push(`/r/${restaurantSlug}/orders/${result.orderId}`)
        } catch (error) {
            console.error('Erreur checkout:', error)
            toast.error(error instanceof Error ? error.message : 'Une erreur est survenue')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                {/* ÉTAPE 1 : Choix du fulfillment (si pas encore choisi) */}
                {!fulfillmentType && (
                    <>
                        <DialogHeader>
                            <DialogTitle>Comment souhaitez-vous commander ?</DialogTitle>
                            <DialogDescription>
                                Choisissez votre mode de service pour continuer
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-3 py-4">
                            {/* Option : À emporter */}
                            <Card
                                className="p-4 cursor-pointer hover:border-primary transition-all"
                                onClick={() => setFulfillmentType('takeway')}
                            >
                                <div className="flex items-start gap-3">
                                    <div
                                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                        <ShoppingBag className="h-5 w-5 text-primary"/>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-sm">Commander à emporter</h4>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Passez votre commande maintenant, récupérez-la au restaurant
                                        </p>
                                        {totalItems > 0 && (
                                            <div className="mt-2 flex items-center gap-2 text-xs">
                                                <Badge variant="secondary">
                                                    {totalItems} article{totalItems > 1 ? 's' : ''}
                                                </Badge>
                                                {/* ✅ CORRECTION : totalAmount au lieu de totalPrice */}
                                                <span className="font-semibold">{formatPrice(totalAmount)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Card>

                            {/* Option : Réservation */}
                            <Card
                                className="p-4 cursor-pointer hover:border-primary transition-all"
                                onClick={() => setFulfillmentType('reservation')}
                            >
                                <div className="flex items-start gap-3">
                                    <div
                                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                        <Calendar className="h-5 w-5 text-primary"/>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-sm">Réserver une table</h4>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Réservez votre table à l'avance pour garantir votre place
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            <AlertCircle className="inline h-3 w-3 mr-1"/>
                                            Un acompte de 2 000 FCFA vous sera demandé
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </>
                )}

                {/* ÉTAPE 2 : Formulaire de commande (si fulfillment choisi) */}
                {fulfillmentType && (
                    <>
                        <DialogHeader>
                            <div className="flex items-center justify-between">
                                <DialogTitle>
                                    {fulfillmentType === 'takeway' ? 'Finaliser la commande' : 'Réserver une table'}
                                </DialogTitle>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setFulfillmentType(null)}
                                    className="text-xs"
                                >
                                    ← Retour
                                </Button>
                            </div>
                            <DialogDescription>
                                {fulfillmentType === 'takeway'
                                    ? `${totalItems} article${totalItems > 1 ? 's' : ''} · ${formatPrice(totalAmount)}`
                                    : `Réservation chez ${restaurantName}`
                                }
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            {/* Récap des articles (seulement pour takeway) */}
                            {fulfillmentType === 'takeway' && items.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="font-semibold text-sm">Votre commande</h4>
                                    <div className="space-y-2 max-h-32 overflow-y-auto">
                                        {items.map((item) => (
                                            // ✅ CORRECTION : productId au lieu de id
                                            <div key={item.productId} className="flex items-center gap-2 text-sm">
                                                <span className="flex-1">{item.name}</span>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="h-6 w-6"
                                                        // ✅ CORRECTION : productId au lieu de id
                                                        onClick={() => updateQuantity(item.productId, Math.max(0, item.quantity - 1))}
                                                    >
                                                        <Minus className="h-3 w-3"/>
                                                    </Button>
                                                    <span
                                                        className="w-6 text-center font-semibold">{item.quantity}</span>
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="h-6 w-6"
                                                        // ✅ CORRECTION : productId au lieu de id
                                                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                                    >
                                                        <Plus className="h-3 w-3"/>
                                                    </Button>
                                                </div>
                                                <span className="font-semibold w-20 text-right">
                                                    {formatPrice(item.price * item.quantity)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex justify-between pt-2 border-t font-semibold">
                                        <span>Total</span>
                                        {/* ✅ CORRECTION : totalAmount au lieu de totalPrice */}
                                        <span>{formatPrice(totalAmount)}</span>
                                    </div>
                                </div>
                            )}

                            {/* Formulaire */}
                            <div className="space-y-3">
                                <div>
                                    <Label htmlFor="name" className="text-xs">Prénom & Nom *</Label>
                                    <Input
                                        id="name"
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                        placeholder="Ex: Jean-Baptiste Moussavou"
                                        required
                                        className="mt-1"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="phone" className="text-xs">Numéro de téléphone *</Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        value={customerPhone}
                                        onChange={(e) => setCustomerPhone(e.target.value)}
                                        placeholder="+241 07 12 34 56"
                                        required
                                        className="mt-1"
                                    />
                                </div>

                                {fulfillmentType === 'takeway' && (
                                    <div>
                                        <Label htmlFor="pickupTime" className="text-xs">Heure de récupération
                                            souhaitée</Label>
                                        <Input
                                            id="pickupTime"
                                            type="time"
                                            value={pickupTime}
                                            onChange={(e) => setPickupTime(e.target.value)}
                                            className="mt-1"
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Optionnel - Nous vous contacterons pour confirmer
                                        </p>
                                    </div>
                                )}

                                {fulfillmentType === 'reservation' && (
                                    <>
                                        <div>
                                            <Label htmlFor="reservationDate" className="text-xs">Date et heure de
                                                réservation *</Label>
                                            <Input
                                                id="reservationDate"
                                                type="datetime-local"
                                                value={reservationDate}
                                                onChange={(e) => setReservationDate(e.target.value)}
                                                required
                                                className="mt-1"
                                            />
                                        </div>

                                        <div>
                                            <Label className="text-xs">Nombre de personnes</Label>
                                            <div className="flex gap-2 mt-1 flex-wrap">
                                                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                                                    <Button
                                                        key={n}
                                                        type="button"
                                                        variant={partySize === n ? 'default' : 'outline'}
                                                        size="sm"
                                                        onClick={() => setPartySize(n)}
                                                        className="w-10 h-10"
                                                    >
                                                        {n}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}

                                <div>
                                    <Label htmlFor="notes" className="text-xs">Notes supplémentaires</Label>
                                    <Textarea
                                        id="notes"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder={
                                            fulfillmentType === 'takeway'
                                                ? 'Allergies, préférences de préparation...'
                                                : 'Occasion spéciale, allergies, préférences...'
                                        }
                                        rows={2}
                                        className="mt-1 resize-none"
                                    />
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 pt-2">
                                <Button
                                    variant="outline"
                                    onClick={handleClose}
                                    disabled={isSubmitting}
                                    className="flex-1"
                                >
                                    Annuler
                                </Button>
                                <Button
                                    onClick={handleCheckout}
                                    disabled={!isFormValid || isSubmitting}
                                    className="flex-1"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                                            Confirmation...
                                        </>
                                    ) : fulfillmentType === 'takeway' ? (
                                        // ✅ CORRECTION : totalAmount au lieu de totalPrice + takeway en majuscules
                                        `Confirmer · ${formatPrice(totalAmount)}`
                                    ) : (
                                        'Confirmer la réservation'
                                    )}
                                </Button>
                            </div>

                            {!isFormValid && (
                                <p className="text-xs text-center text-muted-foreground">
                                    <AlertCircle className="inline h-3 w-3 mr-1"/>
                                    Veuillez remplir tous les champs obligatoires
                                </p>
                            )}
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}