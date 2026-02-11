'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { initiateOrderPayment, InitiateOrderPaymentResult } from '@/lib/actions/payment'
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

interface OrderPaymentFormProps {
    orderId: string
    orderNumber: string
    orderAmount: number
    restaurantName: string
    customerName?: string
}

type PaymentOperator = 'airtel' | 'moov' | 'card'

export function OrderPaymentForm({
    orderId,
    orderNumber,
    orderAmount,
    restaurantName,
    customerName,
}: OrderPaymentFormProps) {
    const router = useRouter()
    const [operator, setOperator] = useState<PaymentOperator>('airtel')
    const [phoneNumber, setPhoneNumber] = useState('')
    const [payerName, setPayerName] = useState(customerName || '')
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const breakdown = calculateCommissionBreakdown(orderAmount, operator)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (!payerName.trim()) {
            setError('Veuillez entrer votre nom')
            return
        }

        if (operator !== 'card') {
            const cleanPhone = phoneNumber.replace(/\s/g, '')
            if (!cleanPhone.match(/^(06|07)\d{7}$/)) {
                setError('Numéro invalide. Format : 06XXXXXXX ou 07XXXXXXX')
                return
            }
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
            const result: InitiateOrderPaymentResult = await initiateOrderPayment({
                orderId,
                payerPhone: operator !== 'card' ? phoneNumber.replace(/\s/g, '') : undefined,
                payerName: payerName.trim(),
                operator,
            })

            if (!result.success) {
                throw new Error(result.error || 'Erreur lors de l\'initiation du paiement')
            }

            if (operator === 'card' && result.paymentUrl) {
                window.location.href = result.paymentUrl
                return
            }

            // Mobile Money
            if (result.message) {
                toast.success('Code envoyé !', { description: result.message })
            }

            router.push(
                `/r/${restaurantName.toLowerCase().replace(/\s+/g, '-')}/order/${orderId}/payment-status?paymentId=${result.paymentId}`
            )
        } catch (err) {
            console.error('Erreur paiement:', err)
            setError(err instanceof Error ? err.message : 'Erreur lors du paiement')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Payer la commande</CardTitle>
                <CardDescription>Commande #{orderNumber}</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Nom du payeur */}
                    <div>
                        <Label htmlFor="name">Votre nom</Label>
                        <Input
                            id="name"
                            type="text"
                            placeholder="Ex: Jean Dupont"
                            value={payerName}
                            onChange={(e) => setPayerName(e.target.value)}
                            className="mt-1"
                            required
                        />
                    </div>

                    {/* Mode de paiement */}
                    <div>
                        <Label className="mb-3 block">Mode de paiement</Label>
                        <RadioGroup
                            value={operator}
                            onValueChange={(value) => setOperator(value as PaymentOperator)}
                        >
                            {/* Airtel */}
                            <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-gray-50">
                                <RadioGroupItem value="airtel" label={''} />
                                <Label className="flex-1 cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <Smartphone className="h-5 w-5 text-red-600" />
                                        <div>
                                            <p className="font-medium">Airtel Money</p>
                                            <p className="text-xs text-gray-500">07XXXXXXXX</p>
                                        </div>
                                    </div>
                                </Label>
                            </div>

                            {/* Moov */}
                            <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-gray-50">
                                <RadioGroupItem value="moov" label={''} />
                                <Label className="flex-1 cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <Smartphone className="h-5 w-5 text-blue-600" />
                                        <div>
                                            <p className="font-medium">Moov Money</p>
                                            <p className="text-xs text-gray-500">06XXXXXXXX</p>
                                        </div>
                                    </div>
                                </Label>
                            </div>

                            {/* Carte bancaire */}
                            <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-gray-50">
                                <RadioGroupItem value="card" label={''} />
                                <Label className="flex-1 cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <CreditCard className="h-5 w-5 text-gray-600" />
                                        <div>
                                            <p className="font-medium">Carte bancaire</p>
                                            <p className="text-xs text-gray-500">Visa, Mastercard</p>
                                        </div>
                                    </div>
                                </Label>
                            </div>
                        </RadioGroup>

                    </div>

                    {/* Numéro téléphone Mobile Money */}
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
                        </div>
                    )}

                    {/* Détail paiement */}
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                        <h3 className="font-semibold text-sm mb-3">Détail du paiement</h3>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Commande</span>
                            <span className="font-medium">{formatPrice(breakdown.restaurantAmount)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Frais Akôm</span>
                            <span className="font-medium">{formatPrice(breakdown.akomCommission)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Frais transaction</span>
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

                    <Button
                        type="submit"
                        disabled={submitting || !payerName || (operator !== 'card' && !phoneNumber)}
                        className="w-full"
                        size="lg"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Traitement...
                            </>
                        ) : operator === 'card' ? (
                            'Payer par carte'
                        ) : (
                            `Payer ${formatPrice(breakdown.totalPaid)}`
                        )}
                    </Button>

                    <p className="text-xs text-gray-500 text-center">
                        Paiement sécurisé • Vos données sont protégées
                    </p>
                </form>
            </CardContent>
        </Card>
    )
}
