// lib/actions/payment.ts
'use server'

import prisma from '@/lib/prisma'
import {EBillingService} from '@/lib/payment/ebilling'
import {calculateTransactionFees} from '@/lib/payment/fees'

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
        // Récupérer la commande avec restaurant et table
        const order = await prisma.order.findUnique({
            where: {id: params.orderId},
            include: {
                restaurant: {
                    select: {
                        id: true,
                        name: true,
                        ebillingUsername: true,
                        ebillingSharedKey: true,
                    },
                },
                table: {select: {number: true}},
            },
        })

        if (!order) return {error: 'Commande introuvable'}

        // Vérifier que le restaurant a configuré eBilling
        if (!order.restaurant.ebillingUsername || !order.restaurant.ebillingSharedKey) {
            return {
                error:
                    "Le restaurant n'a pas encore configuré les paiements en ligne. Veuillez payer en espèces.",
            }
        }

        const subtotal = order.totalAmount

        // Calcul des frais et total à payer
        const {fees, totalToPay} = calculateTransactionFees(
            subtotal,
            params.operator
        )

        // Mettre à jour le montant total de la commande
        await prisma.order.update({
            where: {id: order.id},
            data: {totalAmount: totalToPay},
        })

        // Créer la transaction
        const payment = await prisma.payment.create({
            data: {
                restaurantId: order.restaurantId,
                orderId: order.id,
                amount: totalToPay,
                method: params.operator === 'card' ? 'card' : 'mobile_money',
                status: 'pending',
                timing: 'before_meal',
                phoneNumber: params.payerPhone,
            },
        })

        // Créer une instance EBillingService pour ce restaurant
        const restaurantEBilling = new EBillingService({
            username: order.restaurant.ebillingUsername,
            sharedKey: order.restaurant.ebillingSharedKey,
        })

        // Créer la facture eBilling
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
                where: {id: payment.id},
                data: {status: 'failed', errorMessage: billResult.error},
            })

            return {error: billResult.error || 'Erreur lors de la création de la facture'}
        }

        // Mettre à jour la transaction avec l'ID eBilling
        await prisma.payment.update({
            where: {id: payment.id},
            data: {transactionId: billResult.billId},
        })

        // Paiement mobile money (Airtel / Moov)
        if (params.operator === 'airtel' || params.operator === 'moov') {
            const operatorName =
                params.operator === 'airtel' ? 'airtelmoney' : 'moovmoney4'

            const pushResult = await restaurantEBilling.sendUssdPush(
                billResult.billId,
                params.payerPhone,
                operatorName
            )

            if (!pushResult.success) {
                return {error: "Erreur lors de l'envoi du push USSD"}
            }

            return {
                success: true,
                paymentId: payment.id,
                billId: billResult.billId,
                message: 'Code de confirmation envoyé. Validez le paiement sur votre téléphone.',
            }
        }

        // Paiement par carte
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
        return {error: "Erreur lors de l'initiation du paiement"}
    }
}