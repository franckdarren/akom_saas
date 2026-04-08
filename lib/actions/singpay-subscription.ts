// lib/actions/singpay-subscription.ts
'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { singpayClient } from '@/lib/singpay/client'
import { SINGPAY_CONFIG } from '@/lib/singpay/constants'
import {
  generateSubscriptionReference,
  formatPhoneForSingpay,
  mapSingpayToPaymentStatus,
} from '@/lib/singpay/utils'
import {
  SUBSCRIPTION_CONFIG,
  calculateTotalPrice,
} from '@/lib/config/subscription'
import type { SubscriptionPlan, BillingCycle } from '@/lib/config/subscription'
import type { SubscriptionPaymentStatus } from '@prisma/client'

// ============================================================
// TYPES
// ============================================================

interface InitiateSubscriptionPaymentParams {
  restaurantId: string
  plan: SubscriptionPlan
  billingCycle: BillingCycle
  userCount: number
  phoneNumber: string
  operator: 'airtel' | 'moov'
}

interface SubscriptionPaymentResult {
  success?: boolean
  error?: string
  message?: string
  paymentId?: string
  transactionId?: string
  reference?: string
}

// ============================================================
// INITIER UN PAIEMENT MOBILE MONEY POUR UN ABONNEMENT
// ============================================================

/**
 * Initie un paiement mobile money pour un abonnement via SINGPAY.
 *
 * 1. Valide l'authentification et les paramètres
 * 2. Crée un SubscriptionPayment en BDD (status: pending)
 * 3. Appelle l'API SINGPAY (USSD Push)
 * 4. Met à jour le paiement avec le transactionId retourné
 */
export async function initiateSubscriptionPayment(
  params: InitiateSubscriptionPaymentParams,
): Promise<SubscriptionPaymentResult> {
  try {
    // 1. Authentification
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Non authentifié' }

    const member = await prisma.restaurantUser.findFirst({
      where: { userId: user.id, restaurantId: params.restaurantId },
    })
    if (!member) return { error: 'Accès refusé' }

    // 2. Valider les paramètres
    if (!['starter', 'business', 'premium'].includes(params.plan)) {
      return { error: 'Plan invalide' }
    }
    if (![1, 3, 6, 12].includes(params.billingCycle)) {
      return { error: 'Cycle de facturation invalide' }
    }
    if (params.userCount < 1) {
      return { error: 'Le nombre d\'utilisateurs doit être au minimum 1' }
    }

    const planConfig = SUBSCRIPTION_CONFIG[params.plan]
    const maxUsers = planConfig.userPricing.maxUsers
    if (maxUsers !== 'unlimited' && params.userCount > maxUsers) {
      return { error: `Le plan ${params.plan} permet un maximum de ${maxUsers} utilisateurs` }
    }

    // 3. Vérifier l'abonnement existant
    const subscription = await prisma.subscription.findUnique({
      where: { restaurantId: params.restaurantId },
    })
    if (!subscription) {
      return { error: 'Aucun abonnement trouvé pour cet établissement' }
    }

    // 4. Vérifier qu'il n'y a pas de paiement mobile pending
    const existingPayment = await prisma.subscriptionPayment.findFirst({
      where: {
        subscriptionId: subscription.id,
        status: 'pending',
        method: { in: ['airtel_money', 'moov_money'] },
        singpayTransactionId: { not: null },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (existingPayment) {
      return {
        success: true,
        message: 'Un paiement est déjà en cours',
        paymentId: existingPayment.id,
        transactionId: existingPayment.singpayTransactionId ?? undefined,
        reference: existingPayment.singpayReference ?? undefined,
      }
    }

    // 5. Formater le numéro de téléphone
    let formattedPhone: string
    try {
      formattedPhone = formatPhoneForSingpay(params.phoneNumber)
    } catch {
      return { error: 'Numéro de téléphone invalide. Format attendu : 07 XX XX XX' }
    }

    // 6. Calculer le montant
    const amount = calculateTotalPrice(params.plan, params.userCount, params.billingCycle)
    const reference = generateSubscriptionReference(params.restaurantId)

    const now = new Date()
    const expiresAt = new Date(now)
    expiresAt.setMonth(expiresAt.getMonth() + params.billingCycle)

    // 7. Créer le SubscriptionPayment AVANT d'appeler SINGPAY
    const payment = await prisma.subscriptionPayment.create({
      data: {
        subscriptionId: subscription.id,
        restaurantId: params.restaurantId,
        amount,
        method: params.operator === 'airtel' ? 'airtel_money' : 'moov_money',
        status: 'pending',
        billingCycle: params.billingCycle,
        userCount: params.userCount,
        phoneNumber: formattedPhone,
        provider: params.operator,
        singpayReference: reference,
        expiresAt,
      },
    })

    // 8. Appeler l'API SINGPAY
    const paymentData = {
      amount,
      reference,
      client_msisdn: formattedPhone,
      portefeuille: SINGPAY_CONFIG.platformWalletId,
      disbursement: SINGPAY_CONFIG.platformDisbursementId,
      isTransfer: false,
    }

    let result
    try {
      result = params.operator === 'airtel'
        ? await singpayClient.initiateAirtelPayment(paymentData)
        : await singpayClient.initiateMoovPayment(paymentData)
    } catch (error) {
      console.error('❌ [SINGPAY-SUB] Exception appel API:', error)
      await prisma.subscriptionPayment.update({
        where: { id: payment.id },
        data: {
          status: 'failed',
          errorMessage: error instanceof Error
            ? error.message
            : 'Erreur de communication avec SingPay',
        },
      })
      return { error: 'Impossible de contacter le service de paiement. Veuillez réessayer.' }
    }

    // 9. Vérifier la réponse SINGPAY
    if (!result.status.success) {
      console.error('❌ [SINGPAY-SUB] Paiement refusé:', result.status.message)
      await prisma.subscriptionPayment.update({
        where: { id: payment.id },
        data: {
          status: 'failed',
          errorMessage: result.status.message,
        },
      })
      return { error: `Échec de l'initiation du paiement : ${result.status.message}` }
    }

    // 10. Mettre à jour avec les infos SINGPAY
    await prisma.subscriptionPayment.update({
      where: { id: payment.id },
      data: {
        singpayTransactionId: result.transaction.id,
      },
    })

    return {
      success: true,
      message: `Validez le paiement de ${amount} FCFA sur votre téléphone.`,
      paymentId: payment.id,
      transactionId: result.transaction.id,
      reference,
    }
  } catch (error) {
    console.error('Erreur initiateSubscriptionPayment:', error)
    return { error: 'Une erreur inattendue est survenue. Veuillez réessayer.' }
  }
}

// ============================================================
// VÉRIFIER LE STATUT D'UN PAIEMENT D'ABONNEMENT
// ============================================================

/**
 * Vérifie le statut d'un paiement d'abonnement via l'API SINGPAY.
 * Utilisé pour le polling côté client.
 */
export async function checkSubscriptionPaymentStatus(
  paymentId: string,
): Promise<SubscriptionPaymentResult & { isPaid?: boolean; isFailed?: boolean }> {
  try {
    const payment = await prisma.subscriptionPayment.findUnique({
      where: { id: paymentId },
      include: { subscription: true },
    })

    if (!payment) {
      return { error: 'Paiement introuvable' }
    }

    // Si déjà dans un état final, retourner directement
    if (payment.status === 'confirmed') {
      return { success: true, isPaid: true, message: 'Paiement confirmé' }
    }
    if (payment.status === 'failed') {
      return {
        success: false,
        isFailed: true,
        message: payment.errorMessage ?? 'Paiement échoué',
      }
    }

    // Interroger SINGPAY
    if (!payment.singpayTransactionId) {
      return { error: 'Informations de transaction manquantes' }
    }

    const result = await singpayClient.getTransactionStatus(
      payment.singpayTransactionId,
      SINGPAY_CONFIG.platformWalletId,
    )

    const orderStatus = mapSingpayToPaymentStatus(
      result.transaction.status,
      result.transaction.result,
    )

    // Mapper PaymentStatus (paid/failed/pending) vers SubscriptionPaymentStatus
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
      await activateSubscriptionAfterPayment(payment.id)
    }

    return {
      success: true,
      isPaid: newStatus === 'confirmed',
      isFailed: newStatus === 'failed',
      message:
        newStatus === 'confirmed'
          ? 'Paiement confirmé ! Votre abonnement est actif.'
          : newStatus === 'failed'
            ? (result.transaction.result ?? 'Paiement échoué')
            : 'En attente de validation sur votre téléphone...',
    }
  } catch (error) {
    console.error('Erreur checkSubscriptionPaymentStatus:', error)
    return { error: 'Impossible de vérifier le statut du paiement' }
  }
}

// ============================================================
// ACTIVER L'ABONNEMENT APRÈS PAIEMENT CONFIRMÉ
// ============================================================

/**
 * Active l'abonnement après confirmation du paiement mobile money.
 * Met à jour les dates de période et le statut.
 */
export async function activateSubscriptionAfterPayment(paymentId: string) {
  const payment = await prisma.subscriptionPayment.findUnique({
    where: { id: paymentId },
    include: { subscription: true },
  })

  if (!payment || payment.status !== 'confirmed') return

  const planConfig = SUBSCRIPTION_CONFIG[payment.subscription.plan as SubscriptionPlan]

  const now = new Date()
  const periodEnd = new Date(now)
  periodEnd.setMonth(periodEnd.getMonth() + payment.billingCycle)

  await prisma.subscription.update({
    where: { id: payment.subscriptionId },
    data: {
      status: 'active',
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      billingCycle: payment.billingCycle,
      basePlanPrice: planConfig.baseMonthlyPrice,
    },
  })

  revalidatePath('/dashboard/subscription')
}

// ============================================================
// LIEN DE PAIEMENT EXTERNE (FALLBACK)
// ============================================================

/**
 * Génère un lien de paiement externe SingPay (POST /ext).
 * Utilisé en fallback quand le USSD Push échoue.
 */
export async function getSubscriptionExternalPaymentLink(
  params: InitiateSubscriptionPaymentParams,
): Promise<SubscriptionPaymentResult & { link?: string }> {
  try {
    // 1. Authentification
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Non authentifié' }

    const member = await prisma.restaurantUser.findFirst({
      where: { userId: user.id, restaurantId: params.restaurantId },
    })
    if (!member) return { error: 'Accès refusé' }

    // 2. Valider les paramètres
    if (!['starter', 'business', 'premium'].includes(params.plan)) {
      return { error: 'Plan invalide' }
    }
    if (![1, 3, 6, 12].includes(params.billingCycle)) {
      return { error: 'Cycle de facturation invalide' }
    }

    // 3. Vérifier l'abonnement existant
    const subscription = await prisma.subscription.findUnique({
      where: { restaurantId: params.restaurantId },
    })
    if (!subscription) {
      return { error: 'Aucun abonnement trouvé pour cet établissement' }
    }

    // 4. Calculer le montant
    const amount = calculateTotalPrice(params.plan, params.userCount, params.billingCycle)
    const reference = generateSubscriptionReference(params.restaurantId)

    const now = new Date()
    const expiresAt = new Date(now)
    expiresAt.setMonth(expiresAt.getMonth() + params.billingCycle)

    // 5. Créer le SubscriptionPayment
    const payment = await prisma.subscriptionPayment.create({
      data: {
        subscriptionId: subscription.id,
        restaurantId: params.restaurantId,
        amount,
        method: params.operator === 'airtel' ? 'airtel_money' : 'moov_money',
        status: 'pending',
        billingCycle: params.billingCycle,
        userCount: params.userCount,
        phoneNumber: params.phoneNumber,
        provider: params.operator,
        singpayReference: reference,
        expiresAt,
      },
    })

    // 6. Générer le lien externe
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || ''
    const redirectParams = new URLSearchParams({
      plan: params.plan,
      cycle: String(params.billingCycle),
      users: String(params.userCount),
      restaurantId: params.restaurantId,
    })

    const result = await singpayClient.getExternalPaymentLink({
      portefeuille: SINGPAY_CONFIG.platformWalletId,
      reference,
      amount,
      redirect_success: `${appUrl}/dashboard/subscription?payment=success`,
      redirect_error: `${appUrl}/dashboard/subscription/payment?${redirectParams}&payment=error`,
      disbursement: SINGPAY_CONFIG.platformDisbursementId,
      isTransfer: false,
    })

    return {
      success: true,
      paymentId: payment.id,
      reference,
      link: result.link,
    }
  } catch (error) {
    console.error('Erreur getSubscriptionExternalPaymentLink:', error)
    return { error: 'Impossible de générer le lien de paiement.' }
  }
}
