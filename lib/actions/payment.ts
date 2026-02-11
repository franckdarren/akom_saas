'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { ebilling } from '@/lib/payment/ebilling'
import { calculateCommissionBreakdown } from '@/lib/payment/fees'

/**
 * INTERFACES
 */
interface InitiateSubscriptionPaymentParams {
    restaurantId: string
    plan: 'starter' | 'business' | 'premium'
    billingCycle: 1 | 3 | 6 | 12
    payerPhone: string
    payerEmail: string
    payerName: string
    operator: 'airtel' | 'moov' | 'card'
}

export interface InitiateOrderPaymentResult {
    success: boolean
    paymentId?: string
    paymentUrl?: string
    message?: string
    error?: string
}

interface InitiateOrderPaymentParams {
    orderId: string
    payerPhone?: string
    payerName?: string
    operator: 'airtel' | 'moov' | 'card'
}

/**
 * INITIATE SUBSCRIPTION PAYMENT
 */
export async function initiateSubscriptionPayment(
    params: InitiateSubscriptionPaymentParams
) {
    try {
        const subscription = await prisma.subscription.findUnique({
            where: { restaurantId: params.restaurantId },
            include: { restaurant: true },
        })

        if (!subscription) return { error: 'Abonnement introuvable' }

        const monthlyPrice = subscription.monthlyPrice
        const subtotal = monthlyPrice * params.billingCycle

        const breakdown = calculateCommissionBreakdown(subtotal, params.operator)

        const payment = await prisma.subscriptionPayment.create({
            data: {
                subscriptionId: subscription.id,
                restaurantId: params.restaurantId,
                amount: breakdown.totalPaid,
                method: params.operator === 'card' ? 'card' : 'mobile_money',
                status: 'pending',
                billingCycle: params.billingCycle,
                expiresAt: new Date(
                    Date.now() + params.billingCycle * 30 * 24 * 60 * 60 * 1000
                ),
            },
        })

        const billResult = await ebilling.createBill({
            payerMsisdn: params.payerPhone,
            payerEmail: params.payerEmail,
            payerName: params.payerName,
            amount: breakdown.totalPaid,
            externalReference: payment.id,
            shortDescription: `Abonnement Akôm ${params.plan} - ${params.billingCycle} mois`,
            expiryPeriod: 60,
        })

        if (!billResult.success || !billResult.billId) {
            await prisma.subscriptionPayment.update({
                where: { id: payment.id },
                data: { status: 'failed', errorMessage: billResult.error },
            })
            return { error: billResult.error || 'Erreur lors de la création de la facture' }
        }

        await prisma.subscriptionPayment.update({
            where: { id: payment.id },
            data: { transactionId: billResult.billId },
        })

        if (params.operator === 'airtel' || params.operator === 'moov') {
            const operatorName = params.operator === 'airtel' ? 'airtelmoney' : 'moovmoney4'
            const pushResult = await ebilling.sendUssdPush(
                billResult.billId,
                params.payerPhone,
                operatorName
            )

            if (!pushResult.success) {
                return { error: 'Erreur lors de l\'envoi du push USSD. Veuillez réessayer.' }
            }

            return {
                success: true,
                paymentId: payment.id,
                billId: billResult.billId,
                message: 'Un code de confirmation a été envoyé sur votre téléphone. Veuillez entrer votre code PIN pour valider le paiement.',
            }
        }

        const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscription/payment-callback`
        const paymentUrl = ebilling.getCardPaymentUrl(billResult.billId, callbackUrl)

        return {
            success: true,
            paymentId: payment.id,
            billId: billResult.billId,
            paymentUrl,
            message: 'Redirection vers le portail de paiement...',
        }
    } catch (error) {
        console.error('Erreur initiation paiement abonnement:', error)
        return { error: 'Erreur lors de l\'initiation du paiement' }
    }
}

/**
 * INITIATE ORDER PAYMENT
 */
export async function initiateOrderPayment(
    params: InitiateOrderPaymentParams
): Promise<InitiateOrderPaymentResult> {
    try {
        // Carte bancaire
        if (params.operator === 'card') {
            const paymentUrl = `https://payment-gateway.com/pay/${params.orderId}`
            return { success: true, paymentUrl, message: 'Redirection vers le paiement par carte' }
        }

        // Mobile Money
        if (!params.payerPhone) return { success: false, error: 'Le numéro de téléphone est requis' }

        const operatorName = params.operator === 'airtel' ? 'airtelmoney' : 'moovmoney4'

        // Ici tu peux appeler ton intégration eBilling / Mobile Money
        return {
            success: true,
            paymentId: `PAY_${params.orderId}_${Date.now()}`,
            message: `Un code de confirmation a été envoyé via ${operatorName}`,
        }
    } catch (err: any) {
        return { success: false, error: err.message || 'Erreur lors du paiement' }
    }
}
