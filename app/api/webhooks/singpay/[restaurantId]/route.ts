// app/api/webhooks/singpay/[restaurantId]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { mapSingpayToPaymentStatus } from '@/lib/singpay/utils'
import type { SingpayCallbackData } from '@/lib/singpay/types'
import type { SingpayTransactionStatus, SingpayTransactionResult } from '@prisma/client'
import { deductOrderStock } from '@/lib/stock/deduct-order-stock'

/**
 * Webhook SingPay — reçoit les notifications de paiement.
 *
 * URL par restaurant : POST /api/webhooks/singpay/{restaurantId}
 *
 * Sécurité :
 * - Vérifie que le Payment existe et que son restaurantId correspond à l'URL
 * - Vérifie que le montant reçu correspond au montant attendu
 * - Idempotent : ignore les callbacks déjà traités
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string }> },
) {
  const { restaurantId } = await params

  try {
    const callbackData: SingpayCallbackData = await request.json()

    console.log('📞 Callback SingPay reçu:', {
      restaurantId,
      reference: callbackData.transaction.reference,
      status: callbackData.transaction.status,
      result: callbackData.transaction.result,
    })

    // 1. Trouver le Payment par singpayReference (unique)
    const payment = await prisma.payment.findUnique({
      where: { singpayReference: callbackData.transaction.reference },
      include: { order: true },
    })

    if (!payment) {
      console.error('❌ Payment introuvable pour référence:', callbackData.transaction.reference)
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    // 2. SÉCURITÉ : vérifier que le restaurantId correspond
    if (payment.restaurantId !== restaurantId) {
      console.error('❌ restaurantId mismatch:', {
        expected: payment.restaurantId,
        received: restaurantId,
      })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // 3. IDEMPOTENCE : si déjà traité, retourner 200 directement
    if (payment.callbackReceived) {
      console.log('ℹ️ Callback déjà traité pour:', callbackData.transaction.reference)
      return NextResponse.json({ success: true, message: 'Already processed' })
    }

    // 4. VALIDATION : vérifier le montant
    const receivedAmount = parseInt(callbackData.transaction.amount, 10)
    if (!isNaN(receivedAmount) && receivedAmount !== payment.amount) {
      console.error('❌ Montant mismatch:', {
        expected: payment.amount,
        received: receivedAmount,
      })
      return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 })
    }

    // 5. Stocker le callback brut et mapper le statut
    const newStatus = mapSingpayToPaymentStatus(
      callbackData.transaction.status,
      callbackData.transaction.result,
    )

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        singpayStatus: callbackData.transaction.status.toLowerCase() as SingpayTransactionStatus,
        singpayResult: (callbackData.transaction.result?.toLowerCase() ?? 'pending') as SingpayTransactionResult,
        status: newStatus,
        callbackReceived: true,
        callbackData: JSON.parse(JSON.stringify(callbackData)),
        callbackAt: new Date(),
        ...(newStatus === 'paid' && {
          paidAt: new Date(),
          transactionId:
            callbackData.transaction.airtel_money_id ?? callbackData.transaction.id,
          singpayAirtelId: callbackData.transaction.airtel_money_id,
        }),
        ...(newStatus === 'failed' && {
          errorMessage: callbackData.transaction.result ?? 'Paiement échoué',
        }),
      },
    })

    // 6. Mettre à jour la commande
    if (newStatus === 'paid') {
      await prisma.order.update({
        where: { id: payment.orderId },
        data: { status: 'preparing' },
      })
      await deductOrderStock(payment.orderId, restaurantId)
      console.log('✅ Paiement confirmé:', payment.order.orderNumber)
    } else if (newStatus === 'failed') {
      // Si la commande était en attente de paiement, l'annuler
      if (payment.order.status === 'awaiting_payment') {
        await prisma.order.update({
          where: { id: payment.orderId },
          data: { status: 'cancelled' },
        })
        console.log('❌ Paiement échoué, commande annulée:', payment.order.orderNumber)
      } else {
        console.log('❌ Paiement échoué:', callbackData.transaction.result)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Erreur webhook SingPay:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
