// app/api/payments/[paymentId]/status/route.ts

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { mapSingpayToPaymentStatus } from '@/lib/singpay/utils'
import { resolveSingpayTransaction } from '@/lib/singpay/resolve-transaction'
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

    // Interroger SingPay pour le statut actuel — par ID si connu, sinon par
    // référence (paiements initiés via le lien externe /ext).
    const walletId = payment.restaurant.singpayConfig?.walletId
    if (!walletId || (!payment.singpayTransactionId && !payment.singpayReference)) {
      return NextResponse.json({
        status: 'pending',
        isPaid: false,
        isFailed: false,
      })
    }

    const resolved = await resolveSingpayTransaction({
      transactionId: payment.singpayTransactionId,
      reference: payment.singpayReference,
      walletId,
    })

    // SingPay ne connaît pas encore la transaction : paiement non finalisé.
    if (!resolved) {
      return NextResponse.json({
        status: 'pending',
        isPaid: false,
        isFailed: false,
      })
    }

    const newStatus = mapSingpayToPaymentStatus(
      resolved.transaction.status,
      resolved.transaction.result,
    )

    // Mettre à jour le Payment — on mémorise l'ID SingPay découvert par
    // référence pour que les vérifications suivantes passent par l'ID.
    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        singpayStatus: resolved.transaction.status.toLowerCase() as SingpayTransactionStatus,
        singpayResult: (resolved.transaction.result?.toLowerCase() ?? 'pending') as SingpayTransactionResult,
        status: newStatus,
        ...(resolved.resolvedByReference && resolved.transaction.id
          ? { singpayTransactionId: resolved.transaction.id }
          : {}),
        ...(newStatus === 'paid' && {
          paidAt: new Date(),
          transactionId:
            resolved.transaction.airtel_money_id ?? resolved.transaction.id,
          singpayAirtelId: resolved.transaction.airtel_money_id,
        }),
        ...(newStatus === 'failed' && {
          errorMessage: resolved.transaction.result ?? 'Paiement échoué',
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
        errorMessage: resolved.transaction.result,
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
