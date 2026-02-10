// lib/actions/payment.ts - VERSION CORRIGÉE
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { ebilling, EBillingService } from '@/lib/payment/ebilling'
import { calculateTransactionFees } from '@/lib/payment/fees'

/**
 * PAIEMENT D'ABONNEMENT AKÔM
 * 
 * Ce flux gère le paiement des abonnements mensuels/annuels.
 * L'argent va directement sur le compte Akôm (votre compte eBilling).
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

export async function initiateSubscriptionPayment(
    params: InitiateSubscriptionPaymentParams
) {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return { error: 'Non authentifié' }
        }

        const hasAccess = await prisma.restaurantUser.findUnique({
            where: {
                userId_restaurantId: {
                    userId: user.id,
                    restaurantId: params.restaurantId,
                },
            },
        })

        if (!hasAccess) {
            return { error: 'Accès refusé' }
        }

        const subscription = await prisma.subscription.findUnique({
            where: { restaurantId: params.restaurantId },
            include: { restaurant: true },
        })

        if (!subscription) {
            return { error: 'Abonnement introuvable' }
        }

        const monthlyPrice = subscription.monthlyPrice
        const subtotal = monthlyPrice * params.billingCycle

        const { fees, totalToPay } = calculateTransactionFees(
            subtotal,
            params.operator
        )

        const payment = await prisma.subscriptionPayment.create({
            data: {
                subscriptionId: subscription.id,
                restaurantId: params.restaurantId,
                amount: totalToPay,
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
            amount: totalToPay,
            externalReference: payment.id,
            shortDescription: `Abonnement Akôm ${params.plan} - ${params.billingCycle} mois`,
            expiryPeriod: 60,
        })

        if (!billResult.success || !billResult.billId) {
            await prisma.subscriptionPayment.update({
                where: { id: payment.id },
                data: {
                    status: 'failed',
                    errorMessage: billResult.error,
                },
            })

            return {
                error: billResult.error || 'Erreur lors de la création de la facture',
            }
        }

        await prisma.subscriptionPayment.update({
            where: { id: payment.id },
            data: { transactionId: billResult.billId },
        })

        if (params.operator === 'airtel' || params.operator === 'moov') {
            const operatorName =
                params.operator === 'airtel' ? 'airtelmoney' : 'moovmoney4'

            const pushResult = await ebilling.sendUssdPush(
                billResult.billId,
                params.payerPhone,
                operatorName
            )

            if (!pushResult.success) {
                return {
                    error: 'Erreur lors de l\'envoi du push USSD. Veuillez réessayer.',
                }
            }

            return {
                success: true,
                paymentId: payment.id,
                billId: billResult.billId,
                message:
                    'Un code de confirmation a été envoyé sur votre téléphone. Veuillez entrer votre code PIN pour valider le paiement.',
            }
        }

        const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscription/payment-callback`
        const paymentUrl = ebilling.getCardPaymentUrl(
            billResult.billId,
            callbackUrl
        )

        return {
            success: true,
            paymentId: payment.id,
            billId: billResult.billId,
            paymentUrl,
            message: 'Redirection vers le portail de paiement...',
        }
    } catch (error) {
        console.error('Erreur initiation paiement abonnement:', error)
        return {
            error: 'Erreur lors de l\'initiation du paiement',
        }
    }
}

/**
 * PAIEMENT DE COMMANDE CLIENT - VERSION CORRIGÉE
 * 
 * La différence clé : nous créons une NOUVELLE instance d'EBillingService
 * avec les identifiants du restaurant au lieu d'essayer d'hériter.
 */

interface InitiateOrderPaymentParams {
    orderId: string
    payerPhone: string
    payerName?: string
    operator: 'airtel' | 'moov' | 'card'
}

export async function initiateOrderPayment(
    params: InitiateOrderPaymentParams
) {
    try {
        const order = await prisma.order.findUnique({
            where: { id: params.orderId },
            include: {
                restaurant: {
                    select: {
                        id: true,
                        name: true,
                        ebillingUsername: true,
                        ebillingSharedKey: true,
                    },
                },
                table: {
                    select: { number: true },
                },
            },
        })

        if (!order) {
            return { error: 'Commande introuvable' }
        }

        if (
            !order.restaurant.ebillingUsername ||
            !order.restaurant.ebillingSharedKey
        ) {
            return {
                error: 'Le restaurant n\'a pas encore configuré les paiements en ligne. Veuillez payer en espèces.',
            }
        }

        const subtotal = order.totalAmount

        const { fees, totalToPay } = calculateTransactionFees(
            subtotal,
            params.operator
        )

        await prisma.order.update({
            where: { id: params.orderId },
            data: { totalAmount: totalToPay },
        })

        const payment = await prisma.payment.create({
            data: {
                restaurantId: order.restaurantId,
                orderId: order.id,
                amount: totalToPay,
                method: params.operator === 'card' ? 'cash' : 'mobile_money',
                status: 'pending',
                timing: 'before_meal',
                phoneNumber: params.payerPhone,
            },
        })

        /**
         * ✅ CORRECTION ICI : Créer une nouvelle instance avec la config du restaurant
         * 
         * Au lieu de faire de l'héritage bizarre, on instancie simplement une nouvelle
         * classe EBillingService en lui passant les identifiants du restaurant .
         */
        const restaurantEBilling = new EBillingService({
            username: order.restaurant.ebillingUsername,
            sharedKey: order.restaurant.ebillingSharedKey,
        })

        const billResult = await restaurantEBilling.createBill({
            payerMsisdn: params.payerPhone,
            payerEmail: 'client@restaurant.com',
            payerName: params.payerName || 'Client',
            amount: totalToPay,
            externalReference: payment.id,
            shortDescription: `Commande ${order.orderNumber} - Table ${order.table?.number || 'N/A'}`,
            expiryPeriod: 30,
        })

        if (!billResult.success || !billResult.billId) {
            await prisma.payment.update({
                where: { id: payment.id },
                data: {
                    status: 'failed',
                    errorMessage: billResult.error,
                },
            })

            return {
                error: billResult.error || 'Erreur lors de la création de la facture',
            }
        }

        await prisma.payment.update({
            where: { id: payment.id },
            data: { transactionId: billResult.billId },
        })

        if (params.operator === 'airtel' || params.operator === 'moov') {
            const operatorName =
                params.operator === 'airtel' ? 'airtelmoney' : 'moovmoney4'

            const pushResult = await restaurantEBilling.sendUssdPush(
                billResult.billId,
                params.payerPhone,
                operatorName
            )

            if (!pushResult.success) {
                return {
                    error: 'Erreur lors de l\'envoi du push USSD',
                }
            }

            return {
                success: true,
                paymentId: payment.id,
                billId: billResult.billId,
                message:
                    'Code de confirmation envoyé. Validez le paiement sur votre téléphone.',
            }
        }

        const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/r/${order.restaurantId}/order/${order.id}/payment-callback`
        const paymentUrl = restaurantEBilling.getCardPaymentUrl(
            billResult.billId,
            callbackUrl
        )

        return {
            success: true,
            paymentId: payment.id,
            billId: billResult.billId,
            paymentUrl,
        }
    } catch (error) {
        console.error('Erreur initiation paiement commande:', error)
        return {
            error: 'Erreur lors de l\'initiation du paiement',
        }
    }
}