// app/api/webhooks/singpay/subscription/route.ts

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { mapSingpayToPaymentStatus, isSubscriptionReference } from '@/lib/singpay/utils'
import { singpayClient } from '@/lib/singpay/client'
import { SINGPAY_CONFIG } from '@/lib/singpay/constants'
import { activateSubscriptionAfterPayment } from '@/lib/actions/singpay-subscription'
import type { SingpayCallbackData } from '@/lib/singpay/types'
import type { SubscriptionPaymentStatus } from '@prisma/client'
import { notifyRestaurantAdmins } from '@/lib/notifications'

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

    // 3. SÉCURITÉ CRITIQUE : ne JAMAIS faire confiance au body du callback seul.
    // Re-interroger l'API SingPay (source autoritative) pour confirmer le statut.
    // Sans cette étape, n'importe qui ayant initié un paiement d'abonnement
    // peut forger ce callback et activer son abonnement gratuitement.
    if (!payment.singpayTransactionId) {
      console.error('❌ Pas de transactionId pour vérifier:', reference)
      return NextResponse.json({ error: 'Cannot verify' }, { status: 503 })
    }

    let verified
    try {
      verified = await singpayClient.getTransactionStatus(
        payment.singpayTransactionId,
        SINGPAY_CONFIG.platformWalletId,
      )
    } catch (verifyError) {
      console.error('❌ Vérification SingPay abonnement échouée:', verifyError)
      return NextResponse.json({ error: 'Verification failed' }, { status: 503 })
    }

    if (!verified.status.success) {
      console.error('❌ SingPay refuse la vérification abonnement:', verified.status.message)
      return NextResponse.json({ error: 'Verification rejected' }, { status: 400 })
    }

    const verifiedTx = verified.transaction

    // Cohérence : la référence retournée par SingPay doit correspondre.
    if (verifiedTx.reference !== payment.singpayReference) {
      console.error('❌ Référence SingPay abonnement mismatch:', {
        expected: payment.singpayReference,
        received: verifiedTx.reference,
      })
      return NextResponse.json({ error: 'Reference mismatch' }, { status: 400 })
    }

    // Validation du montant contre la réponse autoritative (pas contre le body).
    const verifiedAmount = parseInt(verifiedTx.amount, 10)
    if (!isNaN(verifiedAmount) && verifiedAmount !== payment.amount) {
      console.error('❌ Montant mismatch abonnement (vérifié):', {
        expected: payment.amount,
        verified: verifiedAmount,
      })
      return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 })
    }

    // 4. Mapper le statut depuis la réponse autoritative SingPay
    const orderStatus = mapSingpayToPaymentStatus(verifiedTx.status, verifiedTx.result)

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
          transactionId: verifiedTx.airtel_money_id ?? verifiedTx.id,
        }),
        ...(newStatus === 'failed' && {
          errorMessage: verifiedTx.result ?? 'Paiement échoué',
        }),
      },
    })

    // 6. Si confirmé → activer l'abonnement + notifier
    if (newStatus === 'confirmed') {
      await activateSubscriptionAfterPayment(payment.id)
      console.log('✅ Abonnement activé via callback pour:', payment.restaurantId)

      void notifyRestaurantAdmins(payment.restaurantId, 'subscription_paid', {
        amount: payment.amount,
      })
    } else if (newStatus === 'failed') {
      console.log('❌ Paiement abonnement échoué:', callbackData.transaction.result)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Erreur webhook SingPay abonnement:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
