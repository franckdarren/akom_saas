// app/api/payments/[paymentId]/status/route.ts

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { singpayClient } from '@/lib/singpay/client'
import { mapSingpayToPaymentStatus } from '@/lib/singpay/utils'
import type { SingpayTransactionStatus, SingpayTransactionResult } from '@prisma/client'

/**
 * Route de polling pour vérifier le statut d'un paiement mobile money.
 *
 * GET /api/payments/{paymentId}/status
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
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        restaurant: { include: { singpayConfig: true } },
      },
    })

    if (!payment) {
      return NextResponse.json({ error: 'Paiement introuvable' }, { status: 404 })
    }

    // Si déjà dans un état final (via callback ou polling précédent), retourner directement
    if (payment.status === 'paid') {
      return NextResponse.json({ status: 'paid', isPaid: true, isFailed: false })
    }
    if (payment.status === 'failed') {
      return NextResponse.json({
        status: 'failed',
        isPaid: false,
        isFailed: true,
        errorMessage: payment.errorMessage,
      })
    }

    // Interroger SingPay pour le statut actuel
    const walletId = payment.restaurant.singpayConfig?.walletId
    if (!payment.singpayTransactionId || !walletId) {
      return NextResponse.json({
        status: 'pending',
        isPaid: false,
        isFailed: false,
      })
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

    return NextResponse.json({
      status: newStatus,
      isPaid: newStatus === 'paid',
      isFailed: newStatus === 'failed',
      ...(newStatus === 'failed' && {
        errorMessage: result.transaction.result,
      }),
    })
  } catch (error) {
    console.error('Erreur polling statut paiement:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la vérification du statut' },
      { status: 500 },
    )
  }
}
