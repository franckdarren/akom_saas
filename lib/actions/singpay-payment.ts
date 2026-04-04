// lib/actions/singpay-payment.ts
'use server'

import prisma from '@/lib/prisma'
import { singpayClient } from '@/lib/singpay/client'
import {
  generateSingpayReference,
  formatPhoneForSingpay,
  mapSingpayToPaymentStatus,
} from '@/lib/singpay/utils'
import type { SingpayTransactionStatus, SingpayTransactionResult } from '@prisma/client'

interface InitiateOrderPaymentParams {
  orderId: string
  phoneNumber: string
  operator: 'airtel' | 'moov'
}

interface PaymentResult {
  success?: boolean
  error?: string
  message?: string
  paymentId?: string
  transactionId?: string
  reference?: string
}

/**
 * Initie un paiement mobile money pour une commande publique.
 *
 * 1. Valide la commande et la config SingPay du restaurant
 * 2. Crée un Payment en BDD (status: pending)
 * 3. Appelle l'API SingPay (USSD Push)
 * 4. Met à jour le Payment avec le transactionId retourné
 */
export async function initiateOrderPayment(
  params: InitiateOrderPaymentParams,
): Promise<PaymentResult> {
  try {
    // 1. Récupérer la commande + config SingPay du restaurant
    const order = await prisma.order.findUnique({
      where: { id: params.orderId },
      include: {
        restaurant: {
          include: { singpayConfig: true },
        },
        payments: {
          where: { status: { in: ['pending', 'paid'] } },
        },
      },
    })

    if (!order) {
      return { error: 'Commande introuvable' }
    }

    // Vérifier qu'il n'y a pas déjà un paiement en cours ou réussi
    if (order.payments.length > 0) {
      const existing = order.payments[0]
      if (existing.status === 'paid') {
        return { error: 'Cette commande a déjà été payée' }
      }
      // Un paiement pending existe → retourner ses infos pour reprendre le polling
      return {
        success: true,
        message: 'Un paiement est déjà en cours',
        paymentId: existing.id,
        transactionId: existing.singpayTransactionId ?? undefined,
        reference: existing.singpayReference ?? undefined,
      }
    }

    // 2. Vérifier la config SingPay du restaurant
    const config = order.restaurant.singpayConfig

    if (!config?.enabled || !config.walletId) {
      return {
        error:
          'Le paiement mobile money n\'est pas activé pour cet établissement. Veuillez payer en espèces.',
      }
    }

    // 3. Formater le numéro de téléphone
    let formattedPhone: string
    try {
      formattedPhone = formatPhoneForSingpay(params.phoneNumber)
    } catch {
      return {
        error: 'Numéro de téléphone invalide. Format attendu : 07 XX XX XX',
      }
    }

    // 4. Générer la référence unique
    const reference = generateSingpayReference(order.restaurantId)

    // 5. Créer le Payment en BDD AVANT d'appeler SingPay
    const payment = await prisma.payment.create({
      data: {
        restaurantId: order.restaurantId,
        orderId: order.id,
        amount: order.totalAmount,
        method: params.operator === 'airtel' ? 'airtel_money' : 'moov_money',
        status: 'pending',
        timing: 'before_meal',
        phoneNumber: formattedPhone,
        singpayReference: reference,
      },
    })

    // 6. Appeler l'API SingPay
    const paymentData = {
      amount: order.totalAmount,
      reference,
      client_msisdn: formattedPhone,
      portefeuille: config.walletId,
      // TODO: rétablir le disbursement après debug
      // disbursement: config.defaultDisbursementId ?? undefined,
      isTransfer: false,
    }

    let result
    try {
      console.log('[SingPay] Initiation paiement:', {
        operator: params.operator,
        amount: paymentData.amount,
        reference: paymentData.reference,
        client_msisdn: paymentData.client_msisdn,
        portefeuille: paymentData.portefeuille,
        disbursement: paymentData.disbursement,
        walletHeader: config.walletId,
      })
      console.log('[SingPay] Body envoyé:', JSON.stringify(paymentData))

      result =
        params.operator === 'airtel'
          ? await singpayClient.initiateAirtelPayment(paymentData)
          : await singpayClient.initiateMoovPayment(paymentData)

      console.log('[SingPay] Réponse:', JSON.stringify(result.status))
    } catch (error) {
      // Marquer le paiement comme échoué
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'failed',
          errorMessage:
            error instanceof Error
              ? error.message
              : 'Erreur de communication avec SingPay',
        },
      })
      return {
        error: 'Impossible de contacter le service de paiement. Veuillez réessayer.',
      }
    }

    // 7. Vérifier la réponse SingPay
    if (!result.status.success) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'failed',
          errorMessage: result.status.message,
        },
      })
      return { error: `Échec de l'initiation du paiement : ${result.status.message}` }
    }

    // 8. Mettre à jour le Payment avec les infos SingPay
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        singpayTransactionId: result.transaction.id,
        singpayStatus: result.transaction.status.toLowerCase() as SingpayTransactionStatus,
        singpayResult: 'pending',
      },
    })

    return {
      success: true,
      message: `Validez le paiement de ${order.totalAmount} FCFA sur votre téléphone ${formattedPhone}.`,
      paymentId: payment.id,
      transactionId: result.transaction.id,
      reference,
    }
  } catch (error) {
    console.error('Erreur initiateOrderPayment:', error)
    return { error: 'Une erreur inattendue est survenue. Veuillez réessayer.' }
  }
}

/**
 * Vérifie le statut d'un paiement en interrogeant l'API SingPay.
 * Utilisé pour le polling côté client.
 */
export async function checkOrderPaymentStatus(
  paymentId: string,
): Promise<PaymentResult & { isPaid?: boolean; isFailed?: boolean }> {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        restaurant: { include: { singpayConfig: true } },
      },
    })

    if (!payment) {
      return { error: 'Paiement introuvable' }
    }

    // Si déjà dans un état final, retourner directement
    if (payment.status === 'paid') {
      return { success: true, isPaid: true, message: 'Paiement confirmé' }
    }
    if (payment.status === 'failed') {
      return {
        success: false,
        isFailed: true,
        message: payment.errorMessage ?? 'Paiement échoué',
      }
    }

    // Sinon interroger SingPay
    const walletId = payment.restaurant.singpayConfig?.walletId
    if (!payment.singpayTransactionId || !walletId) {
      return { error: 'Informations de transaction manquantes' }
    }

    const result = await singpayClient.getTransactionStatus(
      payment.singpayTransactionId,
      walletId,
    )

    const newStatus = mapSingpayToPaymentStatus(
      result.transaction.status,
      result.transaction.result,
    )

    // Mettre à jour le Payment
    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        singpayStatus: result.transaction.status.toLowerCase() as SingpayTransactionStatus,
        singpayResult: (result.transaction.result?.toLowerCase() ?? 'pending') as SingpayTransactionResult,
        status: newStatus,
        ...(newStatus === 'paid' && {
          paidAt: new Date(),
          transactionId: result.transaction.airtel_money_id ?? result.transaction.id,
          singpayAirtelId: result.transaction.airtel_money_id,
        }),
        ...(newStatus === 'failed' && {
          errorMessage: result.transaction.result ?? 'Paiement échoué',
        }),
      },
    })

    // Si payé, passer la commande en préparation
    if (newStatus === 'paid') {
      await prisma.order.update({
        where: { id: payment.orderId },
        data: { status: 'preparing' },
      })
    }

    return {
      success: true,
      isPaid: newStatus === 'paid',
      isFailed: newStatus === 'failed',
      message:
        newStatus === 'paid'
          ? 'Paiement confirmé'
          : newStatus === 'failed'
            ? (result.transaction.result ?? 'Paiement échoué')
            : 'En attente de validation...',
    }
  } catch (error) {
    console.error('Erreur checkOrderPaymentStatus:', error)
    return { error: 'Impossible de vérifier le statut du paiement' }
  }
}
