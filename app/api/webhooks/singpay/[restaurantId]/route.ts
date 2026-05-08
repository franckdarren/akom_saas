// app/api/webhooks/singpay/[restaurantId]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { mapSingpayToPaymentStatus } from '@/lib/singpay/utils'
import { singpayClient } from '@/lib/singpay/client'
import type { SingpayCallbackData } from '@/lib/singpay/types'
import type { SingpayTransactionStatus, SingpayTransactionResult } from '@prisma/client'
import { deductOrderStock } from '@/lib/stock/deduct-order-stock'
import { notifyRestaurantAdmins } from '@/lib/notifications'

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
      include: {
        order: true,
        restaurant: { include: { singpayConfig: true } },
      },
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

    // 4. SÉCURITÉ CRITIQUE : ne JAMAIS faire confiance au body du callback seul.
    // Re-interroger l'API SingPay (source autoritative) avant de marquer comme payé.
    // Sans cette étape, n'importe qui peut forger un callback HTTP avec status=Terminate
    // et result=Success pour valider une commande sans paiement réel.
    const walletId = payment.restaurant.singpayConfig?.walletId
    if (!walletId || !payment.singpayTransactionId) {
      console.error('❌ Impossible de vérifier auprès de SingPay : config manquante', {
        walletId: !!walletId,
        transactionId: !!payment.singpayTransactionId,
      })
      return NextResponse.json({ error: 'Cannot verify' }, { status: 503 })
    }

    let verified
    try {
      verified = await singpayClient.getTransactionStatus(payment.singpayTransactionId, walletId)
    } catch (verifyError) {
      console.error('❌ Vérification SingPay échouée:', verifyError)
      // Fail-closed : on ne traite pas le callback si on ne peut pas confirmer.
      return NextResponse.json({ error: 'Verification failed' }, { status: 503 })
    }

    if (!verified.status.success) {
      console.error('❌ SingPay refuse la vérification:', verified.status.message)
      return NextResponse.json({ error: 'Verification rejected' }, { status: 400 })
    }

    // À partir d'ici on n'utilise QUE les données retournées par SingPay,
    // jamais celles du body du webhook.
    const verifiedTx = verified.transaction

    // Cohérence : la référence retournée par SingPay doit correspondre à celle stockée.
    if (verifiedTx.reference !== payment.singpayReference) {
      console.error('❌ Référence SingPay mismatch:', {
        expected: payment.singpayReference,
        received: verifiedTx.reference,
      })
      return NextResponse.json({ error: 'Reference mismatch' }, { status: 400 })
    }

    // Validation du montant contre la réponse autoritative (pas contre le body).
    const verifiedAmount = parseInt(verifiedTx.amount, 10)
    if (!isNaN(verifiedAmount) && verifiedAmount !== payment.amount) {
      console.error('❌ Montant mismatch (vérifié):', {
        expected: payment.amount,
        verified: verifiedAmount,
      })
      return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 })
    }

    // 5. Mapper le statut depuis la réponse autoritative SingPay
    const newStatus = mapSingpayToPaymentStatus(verifiedTx.status, verifiedTx.result)

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        singpayStatus: verifiedTx.status.toLowerCase() as SingpayTransactionStatus,
        singpayResult: (verifiedTx.result?.toLowerCase() ?? 'pending') as SingpayTransactionResult,
        status: newStatus,
        callbackReceived: true,
        callbackData: JSON.parse(JSON.stringify(callbackData)),
        callbackAt: new Date(),
        ...(newStatus === 'paid' && {
          paidAt: new Date(),
          transactionId: verifiedTx.airtel_money_id ?? verifiedTx.id,
          singpayAirtelId: verifiedTx.airtel_money_id,
        }),
        ...(newStatus === 'failed' && {
          errorMessage: verifiedTx.result ?? 'Paiement échoué',
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

      // Notifier les admins (in-app uniquement par défaut, voir templates.ts)
      void notifyRestaurantAdmins(restaurantId, 'payment_received', {
        orderId: payment.orderId,
        orderNumber: payment.order.orderNumber,
        amount: payment.amount,
      })
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
