// app/api/subscription-payments/[paymentId]/status/route.ts

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { singpayClient } from '@/lib/singpay/client'
import { SINGPAY_CONFIG } from '@/lib/singpay/constants'
import { mapSingpayToPaymentStatus } from '@/lib/singpay/utils'
import { activateSubscriptionAfterPayment } from '@/lib/actions/singpay-subscription'
import type { SubscriptionPaymentStatus } from '@prisma/client'

/**
 * Route de polling pour vérifier le statut d'un paiement d'abonnement.
 *
 * GET /api/subscription-payments/{paymentId}/status
 *
 * Appelée côté client toutes les 5s pendant que l'utilisateur
 * valide le USSD Push sur son téléphone.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> },
) {
  const { paymentId } = await params

  try {
    const payment = await prisma.subscriptionPayment.findUnique({
      where: { id: paymentId },
    })

    if (!payment) {
      return NextResponse.json({ error: 'Paiement introuvable' }, { status: 404 })
    }

    // Si déjà dans un état final, retourner directement
    if (payment.status === 'confirmed') {
      return NextResponse.json({ status: 'confirmed', isPaid: true, isFailed: false })
    }
    if (payment.status === 'failed') {
      return NextResponse.json({
        status: 'failed',
        isPaid: false,
        isFailed: true,
        errorMessage: payment.errorMessage,
      })
    }

    // Pas de transactionId SINGPAY → paiement manuel, pas de polling
    if (!payment.singpayTransactionId) {
      return NextResponse.json({
        status: 'pending',
        isPaid: false,
        isFailed: false,
      })
    }

    // Interroger SINGPAY
    const result = await singpayClient.getTransactionStatus(
      payment.singpayTransactionId,
      SINGPAY_CONFIG.platformWalletId,
    )

    const orderStatus = mapSingpayToPaymentStatus(
      result.transaction.status,
      result.transaction.result,
    )

    const newStatus: SubscriptionPaymentStatus =
      orderStatus === 'paid' ? 'confirmed'
        : orderStatus === 'failed' ? 'failed'
          : 'pending'

    // Mettre à jour le paiement
    await prisma.subscriptionPayment.update({
      where: { id: paymentId },
      data: {
        status: newStatus,
        ...(newStatus === 'confirmed' && {
          paidAt: new Date(),
          transactionId: result.transaction.airtel_money_id ?? result.transaction.id,
        }),
        ...(newStatus === 'failed' && {
          errorMessage: result.transaction.result ?? 'Paiement échoué',
        }),
      },
    })

    // Si confirmé → activer l'abonnement
    if (newStatus === 'confirmed') {
      await activateSubscriptionAfterPayment(paymentId)
    }

    return NextResponse.json({
      status: newStatus,
      isPaid: newStatus === 'confirmed',
      isFailed: newStatus === 'failed',
      ...(newStatus === 'failed' && {
        errorMessage: result.transaction.result,
      }),
    })
  } catch (error) {
    console.error('Erreur polling statut paiement abonnement:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la vérification du statut' },
      { status: 500 },
    )
  }
}
