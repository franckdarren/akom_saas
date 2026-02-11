// lib/actions/payment.ts
'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { ebilling } from '@/lib/payment/ebilling'
import { calculateCommissionBreakdown } from '@/lib/payment/fees'

/**
 * PAIEMENT D'ABONNEMENT AKÔM
 * 
 * Ce flux gère le paiement des abonnements mensuels/annuels.
 * L'argent va directement sur le compte Akôm (votre compte eBilling).
 */
/**
 * PAIEMENT DE COMMANDE - MODÈLE CENTRALISÉ
 * 
 * Flux:
 * 1. Client commande 10 000 FCFA
 * 2. Système ajoute commission Akôm (5% = 500 FCFA)
 * 3. Système ajoute frais eBilling (2% de 10 500 = 210 FCFA)
 * 4. Client paie 10 710 FCFA sur le compte Akôm
 * 5. Plus tard, Akôm redistribue 10 000 FCFA au restaurant
 * 6. Akôm garde 500 FCFA de commission
 * 7. eBilling a déjà pris 210 FCFA
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
        // Récupérer l'abonnement
        const subscription = await prisma.subscription.findUnique({
            where: { restaurantId: params.restaurantId },
            include: { restaurant: true },
        })

        if (!subscription) {
            return { error: 'Abonnement introuvable' }
        }

        // Calculer le montant selon le plan et le cycle
        const monthlyPrice = subscription.monthlyPrice
        const subtotal = monthlyPrice * params.billingCycle

        // Calculer les frais de transaction
        const breakdown = calculateCommissionBreakdown(
            subtotal,
            params.operator
        )

        // Créer l'enregistrement de paiement
        const payment = await prisma.subscriptionPayment.create({
            data: {
                subscriptionId: subscription.id,
                restaurantId: params.restaurantId,
                amount: breakdown.totalPaid, // Montant AVEC frais
                method: params.operator === 'card' ? 'card' : 'mobile_money',
                status: 'pending',
                billingCycle: params.billingCycle,
                expiresAt: new Date(
                    Date.now() + params.billingCycle * 30 * 24 * 60 * 60 * 1000
                ),
            },
        })

        // Créer la facture eBilling
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
                data: {
                    status: 'failed',
                    errorMessage: billResult.error,
                },
            })

            return {
                error: billResult.error || 'Erreur lors de la création de la facture',
            }
        }

        // Stocker le billId
        await prisma.subscriptionPayment.update({
            where: { id: payment.id },
            data: { transactionId: billResult.billId },
        })

        // Si mobile money, envoyer le push USSD
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
                message: 'Un code de confirmation a été envoyé sur votre téléphone. Veuillez entrer votre code PIN pour valider le paiement.',
            }
        }

        // Si carte bancaire, retourner l'URL de paiement
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
 * PAIEMENT DE COMMANDE - MODÈLE CENTRALISÉ
 * 
 * (Le code existant reste ici...)
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
    // ... votre code existant pour les commandes ...
}