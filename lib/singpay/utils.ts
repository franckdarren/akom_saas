// lib/singpay/utils.ts

import type { PaymentStatus } from '@prisma/client'

/**
 * Génère une référence unique pour une transaction SingPay.
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
 * Formate un numéro de téléphone gabonais pour SingPay.
 *
 * SingPay attend le format international sans le + : 24107XXXXXXX
 *
 * Entrées acceptées :
 * - 07 12 34 56  → 2410712345
 * - +24107123456 → 24107123456
 * - 24107123456  → 24107123456
 */
export function formatPhoneForSingpay(phone: string): string {
  let cleaned = phone.replace(/[\s\-().]/g, '')

  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1)
  }

  // Numéro local gabonais (commence par 0) → ajouter préfixe 241
  if (cleaned.startsWith('0')) {
    cleaned = '241' + cleaned.substring(1)
  }

  if (cleaned.length < 10) {
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
