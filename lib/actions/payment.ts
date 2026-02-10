// lib/actions/payment.ts
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { ebilling } from '@/lib/payment/ebilling'
import { calculateTransactionFees } from '@/lib/payment/fees'

/**
 * NOUVEAU MODÈLE : Paiement centralisé
 * 
 * Dans ce modèle, TOUS les paiements (abonnements ET commandes) passent
 * par le compte eBilling d'Akôm. Vous devenez un agrégateur de paiement.
 * 
 * L'argent suit ce parcours :
 * Client → Compte Akôm eBilling → Redistribution aux restaurants
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
                        slug: true,
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

        const subtotal = order.totalAmount

        /**
         * Calcul des frais de transaction
         * 
         * Ces frais sont TOUJOURS à la charge du client.
         * Le restaurant reçoit le montant de sa commande (subtotal).
         * Vous recevez votre commission.
         * eBilling prélève ses frais sur le total payé par le client.
         */
        const { fees, totalToPay } = calculateTransactionFees(
            subtotal,
            params.operator
        )

        /**
         * NOUVEAU : Calculer la commission Akôm
         * 
         * Définissez votre taux de commission ici.
         * Par exemple, 5% du montant de la commande.
         * Cette commission vient en PLUS du montant de la commande.
         */
        const COMMISSION_RATE = 0.05 // 5%
        const akomCommission = Math.ceil(subtotal * COMMISSION_RATE)
        
        /**
         * Le montant total que le client paiera est :
         * - Montant de la commande (va au restaurant)
         * - Commission Akôm (reste chez vous)
         * - Frais de transaction (va à eBilling)
         */
        const totalWithCommission = subtotal + akomCommission + fees

        /**
         * IMPORTANT : Mettre à jour le montant de la commande
         * 
         * On stocke le montant total que le client paie, mais on garde
         * aussi trace de la répartition dans les champs séparés.
         */
        await prisma.order.update({
            where: { id: params.orderId },
            data: { 
                totalAmount: totalWithCommission,
                // NOUVEAU CHAMP À AJOUTER : notes pour tracer la décomposition
                notes: `Montant commande: ${subtotal} FCFA | Commission Akôm: ${akomCommission} FCFA | Frais transaction: ${fees} FCFA`
            },
        })

        /**
         * Créer l'enregistrement de paiement
         * 
         * Le champ amount contient le montant TOTAL payé par le client.
         * Nous ajouterons plus tard la logique pour tracer combien
         * revient au restaurant vs combien reste chez Akôm.
         */
        const payment = await prisma.payment.create({
            data: {
                restaurantId: order.restaurantId,
                orderId: order.id,
                amount: totalWithCommission,
                method: params.operator === 'card' ? 'cash' : 'mobile_money',
                status: 'pending',
                timing: 'before_meal',
                phoneNumber: params.payerPhone,
                // NOUVEAU CHAMP À AJOUTER : metadata pour tracer la décomposition
                metadata: {
                    restaurantAmount: subtotal,
                    akomCommission: akomCommission,
                    transactionFees: fees,
                    totalPaid: totalWithCommission,
                },
            },
        })

        /**
         * ✅ SIMPLIFICATION MAJEURE
         * 
         * Puisque tout passe par le compte Akôm, on utilise toujours
         * la même instance ebilling. Plus besoin de créer des instances
         * différentes selon le restaurant !
         */
        const billResult = await ebilling.createBill({
            payerMsisdn: params.payerPhone,
            payerEmail: 'client@restaurant.com',
            payerName: params.payerName || 'Client',
            amount: totalWithCommission,
            externalReference: payment.id,
            shortDescription: `${order.restaurant.name} - Commande ${order.orderNumber}`,
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

            const pushResult = await ebilling.sendUssdPush(
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
                message: 'Code de confirmation envoyé. Validez le paiement sur votre téléphone.',
                breakdown: {
                    orderAmount: subtotal,
                    commission: akomCommission,
                    fees: fees,
                    total: totalWithCommission,
                },
            }
        }

        const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/r/${order.restaurant.slug}/order/${order.id}/payment-callback`
        const paymentUrl = ebilling.getCardPaymentUrl(
            billResult.billId,
            callbackUrl
        )

        return {
            success: true,
            paymentId: payment.id,
            billId: billResult.billId,
            paymentUrl,
            breakdown: {
                orderAmount: subtotal,
                commission: akomCommission,
                fees: fees,
                total: totalWithCommission,
            },
        }
    } catch (error) {
        console.error('Erreur initiation paiement commande:', error)
        return {
            error: 'Erreur lors de l\'initiation du paiement',
        }
    }
}