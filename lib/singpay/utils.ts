// lib/singpay/utils.ts

import type { PaymentStatus } from '@prisma/client'

/**
 * Génère une référence unique pour une transaction SingPay (commande).
 *
 * Format : AKOM-ORD-{8 premiers chars restaurantId}-{timestamp}-{6 random}
 * Exemple : AKOM-ORD-a1b2c3d4-1712150400000-X9K2M1
 */
export function generateSingpayReference(restaurantId: string): string {
  const shortId = restaurantId.substring(0, 8)
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `AKOM-ORD-${shortId}-${timestamp}-${random}`
}

/**
 * Génère une référence unique pour un paiement d'abonnement SingPay.
 *
 * Format : AKOM-SUB-{8 premiers chars restaurantId}-{timestamp}-{6 random}
 * Exemple : AKOM-SUB-a1b2c3d4-1712150400000-X9K2M1
 */
export function generateSubscriptionReference(restaurantId: string): string {
  const shortId = restaurantId.substring(0, 8)
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `AKOM-SUB-${shortId}-${timestamp}-${random}`
}

/** Vérifie si une référence SingPay correspond à un paiement d'abonnement */
export function isSubscriptionReference(reference: string): boolean {
  return reference.startsWith('AKOM-SUB-')
}

/**
 * Formate un numéro de téléphone gabonais pour SingPay.
 *
 * SingPay attend le format international sans le + : 24107XXXXXXX
 *
 * Entrées acceptées :
 * - 077 12 34 56  → 2410712345
 * - +24107123456 → 24107123456
 * - 24107123456  → 24107123456
 */
export function formatPhoneForSingpay(phone: string): string {
  let cleaned = phone.replace(/[\s\-().]/g, '')

  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1)
  }

  // Numéro local gabonais (commence par 0) → ajouter préfixe 241 en gardant le 0
  // SingPay attend le format 2410XXXXXXXX (12 chiffres)
  if (cleaned.startsWith('0')) {
    cleaned = '241' + cleaned
  }

  if (cleaned.length < 11) {
    throw new Error('Numéro de téléphone invalide')
  }

  return cleaned
}

/**
 * Convertit le statut SingPay en PaymentStatus Prisma.
 *
 * - Terminate + Success → 'paid'
 * - Terminate + autre   → 'failed'
 * - Refund              → 'refunded'
 * - Autre               → 'pending'
 */
export function mapSingpayToPaymentStatus(
  singpayStatus: string,
  singpayResult?: string,
): PaymentStatus {
  if (singpayStatus === 'Terminate') {
    return singpayResult === 'Success' ? 'paid' : 'failed'
  }
  if (singpayStatus === 'Refund') {
    return 'refunded'
  }
  return 'pending'
}

/** Indique si la transaction SingPay est dans un état final (plus de changement possible) */
export function isTransactionFinal(singpayStatus: string): boolean {
  return singpayStatus === 'Terminate' || singpayStatus === 'Refund'
}
