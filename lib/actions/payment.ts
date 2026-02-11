// lib/actions/payment.ts
'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { ebilling } from '@/lib/payment/ebilling'
import { calculateCommissionBreakdown } from '@/lib/payment/fees'

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
        // 1. Récupérer la commande
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

        // 2. Montant de la commande (ce que le restaurant recevra)
        const orderAmount = order.totalAmount

        // 3. Calculer la décomposition complète
        const breakdown = calculateCommissionBreakdown(
            orderAmount,
            params.operator
        )

        // 4. Mettre à jour le montant total de la commande
        // (important pour l'affichage au client)
        await prisma.order.update({
            where: { id: params.orderId },
            data: {
                totalAmount: breakdown.totalPaid,
                notes: `Commande: ${breakdown.restaurantAmount} FCFA | Service: ${breakdown.akomCommission} FCFA | Frais: ${breakdown.transactionFees} FCFA`,
            },
        })

        // 5. Créer l'enregistrement de paiement avec metadata
        const payment = await prisma.payment.create({
            data: {
                restaurantId: order.restaurantId,
                orderId: order.id,
                amount: breakdown.totalPaid, // Montant TOTAL payé par le client
                method: params.operator === 'card' ? 'cash' : 'mobile_money',
                status: 'pending',
                timing: 'before_meal',
                phoneNumber: params.payerPhone,
                // ✅ METADATA avec la décomposition exacte
                metadata: {
                    restaurantAmount: breakdown.restaurantAmount,
                    akomCommission: breakdown.akomCommission,
                    transactionFees: breakdown.transactionFees,
                    totalPaid: breakdown.totalPaid,
                    operator: params.operator,
                },
            },
        })

        // 6. Créer la facture eBilling (tout va sur le compte Akôm)
        const billResult = await ebilling.createBill({
            payerMsisdn: params.payerPhone,
            payerEmail: 'client@restaurant.com',
            payerName: params.payerName || 'Client',
            amount: breakdown.totalPaid,
            externalReference: payment.id,
            shortDescription: `${order.restaurant.name} - Cmd ${order.orderNumber}`,
            expiryPeriod: 30,
        })

        if (!billResult.success || !billResult.billId) {
            // Marquer le paiement comme échoué
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

        // 7. Stocker le billId
        await prisma.payment.update({
            where: { id: payment.id },
            data: { transactionId: billResult.billId },
        })

        // 8. Envoyer le push USSD ou retourner l'URL de paiement
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
                message: 'Code de confirmation envoyé. Validez sur votre téléphone.',
                breakdown: {
                    orderAmount: breakdown.restaurantAmount,
                    commission: breakdown.akomCommission,
                    fees: breakdown.transactionFees,
                    total: breakdown.totalPaid,
                },
            }
        }

        // Paiement par carte
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
                orderAmount: breakdown.restaurantAmount,
                commission: breakdown.akomCommission,
                fees: breakdown.transactionFees,
                total: breakdown.totalPaid,
            },
        }
    } catch (error) {
        console.error('Erreur initiation paiement commande:', error)
        return {
            error: 'Erreur lors de l\'initiation du paiement',
        }
    }
}