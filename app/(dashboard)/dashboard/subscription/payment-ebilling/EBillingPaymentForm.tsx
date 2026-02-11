// app/dashboard/subscription/payment-ebilling/EBillingPaymentForm.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { initiateSubscriptionPayment } from '@/lib/actions/payment' // ✅ CORRECTION ICI
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Loader2, CreditCard, Smartphone, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { formatPrice } from '@/lib/subscription/config'
import { calculateCommissionBreakdown } from '@/lib/payment/fees'
import type { SubscriptionPlan, BillingCycle } from '@/lib/subscription/config'

interface EBillingPaymentFormProps {
    restaurantId: string
    plan: SubscriptionPlan
    billingCycle: BillingCycle
    amount: number
    userName: string
    userEmail: string
}

type PaymentOperator = 'airtel' | 'moov' | 'card'

export function EBillingPaymentForm({
    restaurantId,
    plan,
    billingCycle,
    amount,
    userName,
    userEmail,
}: EBillingPaymentFormProps) {
    const router = useRouter()
    const [operator, setOperator] = useState<PaymentOperator>('airtel')
    const [phoneNumber, setPhoneNumber] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Calculer les frais selon l'opérateur choisi
    const breakdown = calculateCommissionBreakdown(amount, operator)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        // Validation du numéro de téléphone
        if (operator !== 'card') {
            const cleanPhone = phoneNumber.replace(/\s/g, '')
            
            if (!cleanPhone.match(/^(06|07)\d{7}$/)) {
                setError('Numéro invalide. Format attendu : 06XXXXXXX ou 07XXXXXXX')
                return
            }

            // Vérifier que le numéro correspond à l'opérateur
            if (operator === 'airtel' && !cleanPhone.startsWith('07')) {
                setError('Les numéros Airtel commencent par 07')
                return
            }
            if (operator === 'moov' && !cleanPhone.startsWith('06')) {
                setError('Les numéros Moov commencent par 06')
                return
            }
        }

        setSubmitting(true)

        try {
            // ✅ CORRECTION ICI : utiliser initiateSubscriptionPayment
            const result = await initiateSubscriptionPayment({
                restaurantId,
                plan,
                billingCycle,
                payerPhone: phoneNumber.replace(/\s/g, ''),
                payerEmail: userEmail,
                payerName: userName,
                operator,
            })

            if (!result.success) {
                throw new Error(result.error || 'Erreur lors de l\'initiation du paiement')
            }

            // Si paiement par carte, rediriger vers l'URL de paiement
            if (operator === 'card' && result.paymentUrl) {
                window.location.href = result.paymentUrl
                return
            }

            // Si Mobile Money, afficher le message de succès
            toast.success('Code de confirmation envoyé', {
                description: result.message,
            })

            // Rediriger vers la page de confirmation
            router.push(`/dashboard/subscription/payment-status?paymentId=${result.paymentId}`)
        } catch (err) {
            console.error('Erreur paiement:', err)
            setError(
                err instanceof Error ? err.message : 'Erreur lors du paiement'
            )
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Informations de paiement</CardTitle>
                <CardDescription>
                    Choisissez votre mode de paiement
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Choix de l'opérateur */}
                    <div>
                        <Label className="mb-3 block">Mode de paiement</Label>
                        <RadioGroup
                            value={operator}
                            onValueChange={(value: string) => setOperator(value as PaymentOperator)}
                        >
                            {/* ✅ CORRECTION ICI : retirer la prop id */}
                            <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted">
                                <RadioGroupItem value="airtel" label={''} />
                                <Label htmlFor="airtel" className="flex-1 cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <Smartphone className="h-5 w-5 text-red-600" />
                                        <div>
                                            <p className="font-medium">Airtel Money</p>
                                            <p className="text-xs text-muted-foreground">
                                                Numéros commençant par 07
                                            </p>
                                        </div>
                                    </div>
                                </Label>
                            </div>

                            <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted">
                                <RadioGroupItem value="moov" label={''} />
                                <Label htmlFor="moov" className="flex-1 cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <Smartphone className="h-5 w-5 text-blue-600" />
                                        <div>
                                            <p className="font-medium">Moov Money</p>
                                            <p className="text-xs text-muted-foreground">
                                                Numéros commençant par 06
                                            </p>
                                        </div>
                                    </div>
                                </Label>
                            </div>

                            <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted">
                                <RadioGroupItem value="card" label={''} />
                                <Label htmlFor="card" className="flex-1 cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <CreditCard className="h-5 w-5 text-muted-foreground" />
                                        <div>
                                            <p className="font-medium">Carte bancaire</p>
                                            <p className="text-xs text-muted-foreground">
                                                Visa, Mastercard
                                            </p>
                                        </div>
                                    </div>
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {/* Numéro de téléphone (seulement pour Mobile Money) */}
                    {operator !== 'card' && (
                        <div>
                            <Label htmlFor="phone">Numéro de téléphone</Label>
                            <Input
                                id="phone"
                                type="tel"
                                placeholder={operator === 'airtel' ? '07 XX XX XX XX' : '06 XX XX XX XX'}
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                className="mt-1"
                                required
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Format : 9 chiffres sans espaces ni indicatif
                            </p>
                        </div>
                    )}

                    {/* Récapitulatif des frais */}
                    <div className="bg-muted rounded-lg p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Montant de l'abonnement</span>
                            <span className="font-medium">{formatPrice(amount)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Frais de transaction</span>
                            <span className="font-medium">{formatPrice(breakdown.transactionFees)}</span>
                        </div>
                        <div className="border-t pt-2 mt-2">
                            <div className="flex justify-between font-bold">
                                <span>Total à payer</span>
                                <span className="text-blue-600">{formatPrice(breakdown.totalPaid)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Erreur */}
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Bouton submit */}
                    <Button
                        type="submit"
                        disabled={submitting || (operator !== 'card' && !phoneNumber)}
                        className="w-full"
                        size="lg"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Traitement en cours...
                            </>
                        ) : operator === 'card' ? (
                            'Payer par carte'
                        ) : (
                            `Payer ${formatPrice(breakdown.totalPaid)}`
                        )}
                    </Button>

                    <p className="text-xs text-muted-foreground text-center">
                        Paiement sécurisé par eBilling. Vos données sont protégées.
                    </p>
                </form>
            </CardContent>
        </Card>
    )
}