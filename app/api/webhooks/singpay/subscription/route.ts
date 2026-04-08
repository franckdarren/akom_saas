// app/api/webhooks/singpay/subscription/route.ts

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { mapSingpayToPaymentStatus, isSubscriptionReference } from '@/lib/singpay/utils'
import { activateSubscriptionAfterPayment } from '@/lib/actions/singpay-subscription'
import type { SingpayCallbackData } from '@/lib/singpay/types'
import type { SubscriptionPaymentStatus } from '@prisma/client'

/**
 * Webhook SINGPAY pour les paiements d'abonnement.
 *
 * POST /api/webhooks/singpay/subscription
 *
 * Reçoit les notifications de paiement pour les abonnements.
 * Distinct du webhook commandes (/api/webhooks/singpay/[restaurantId]).
 */
export async function POST(request: NextRequest) {
  try {
    const callbackData: SingpayCallbackData = await request.json()
    const reference = callbackData.transaction.reference

    console.log('📞 Callback SingPay abonnement reçu:', {
      reference,
      status: callbackData.transaction.status,
      result: callbackData.transaction.result,
    })

    // Vérifier que c'est bien une référence d'abonnement
    if (!isSubscriptionReference(reference)) {
      console.error('❌ Référence non-abonnement reçue sur webhook subscription:', reference)
      return NextResponse.json({ error: 'Invalid reference' }, { status: 400 })
    }

    // 1. Trouver le paiement par singpayReference
    const payment = await prisma.subscriptionPayment.findUnique({
      where: { singpayReference: reference },
    })

    if (!payment) {
      console.error('❌ SubscriptionPayment introuvable pour référence:', reference)
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    // 2. Idempotence : si déjà traité, retourner 200
    if (payment.callbackReceived) {
      console.log('ℹ️ Callback abonnement déjà traité pour:', reference)
      return NextResponse.json({ success: true, message: 'Already processed' })
    }

    // 3. Validation du montant
    const receivedAmount = parseInt(callbackData.transaction.amount, 10)
    if (!isNaN(receivedAmount) && receivedAmount !== payment.amount) {
      console.error('❌ Montant mismatch abonnement:', {
        expected: payment.amount,
        received: receivedAmount,
      })
      return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 })
    }

    // 4. Mapper le statut
    const orderStatus = mapSingpayToPaymentStatus(
      callbackData.transaction.status,
      callbackData.transaction.result,
    )

    const newStatus: SubscriptionPaymentStatus =
      orderStatus === 'paid' ? 'confirmed'
        : orderStatus === 'failed' ? 'failed'
          : 'pending'

    // 5. Mettre à jour le paiement
    await prisma.subscriptionPayment.update({
      where: { id: payment.id },
      data: {
        status: newStatus,
        callbackReceived: true,
        callbackData: JSON.parse(JSON.stringify(callbackData)),
        callbackAt: new Date(),
        ...(newStatus === 'confirmed' && {
          paidAt: new Date(),
          transactionId:
            callbackData.transaction.airtel_money_id ?? callbackData.transaction.id,
        }),
        ...(newStatus === 'failed' && {
          errorMessage: callbackData.transaction.result ?? 'Paiement échoué',
        }),
      },
    })

    // 6. Si confirmé → activer l'abonnement
    if (newStatus === 'confirmed') {
      await activateSubscriptionAfterPayment(payment.id)
      console.log('✅ Abonnement activé via callback pour:', payment.restaurantId)
    } else if (newStatus === 'failed') {
      console.log('❌ Paiement abonnement échoué:', callbackData.transaction.result)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Erreur webhook SingPay abonnement:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
