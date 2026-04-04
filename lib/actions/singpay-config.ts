// lib/actions/singpay-config.ts
'use server'

import prisma from '@/lib/prisma'
import { isSuperadmin, getSuperadminUser } from '@/lib/auth/superadmin'
import type { ActionResult } from '@/types/actions'

interface SaveSingpayConfigParams {
  restaurantId: string
  walletId: string
  merchantCode?: string
  defaultDisbursementId?: string
}

/**
 * Sauvegarde la configuration SingPay d'un restaurant.
 * Réservé aux superadmins.
 */
export async function saveSingpayConfig(
  params: SaveSingpayConfigParams,
): Promise<ActionResult<{ id: string }>> {
  const user = await getSuperadminUser()
  if (!user) {
    return { success: false, error: 'Accès non autorisé' }
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: params.restaurantId },
    select: { id: true },
  })

  if (!restaurant) {
    return { success: false, error: 'Établissement introuvable' }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL
  const callbackUrl = `${appUrl}/api/webhooks/singpay/${params.restaurantId}`

  const config = await prisma.restaurantSingpayConfig.upsert({
    where: { restaurantId: params.restaurantId },
    create: {
      restaurantId: params.restaurantId,
      walletId: params.walletId,
      merchantCode: params.merchantCode ?? null,
      defaultDisbursementId: params.defaultDisbursementId ?? null,
      callbackUrl,
      isConfigured: true,
      configuredAt: new Date(),
      configuredBy: user.id,
    },
    update: {
      walletId: params.walletId,
      merchantCode: params.merchantCode ?? null,
      defaultDisbursementId: params.defaultDisbursementId ?? null,
      callbackUrl,
      isConfigured: true,
      configuredAt: new Date(),
      configuredBy: user.id,
    },
  })

  return { success: true, data: { id: config.id } }
}

/**
 * Active ou désactive le paiement SingPay pour un restaurant.
 * Réservé aux superadmins.
 */
export async function toggleSingpayEnabled(
  restaurantId: string,
  enabled: boolean,
): Promise<ActionResult<{ enabled: boolean }>> {
  if (!(await isSuperadmin())) {
    return { success: false, error: 'Accès non autorisé' }
  }

  const config = await prisma.restaurantSingpayConfig.findUnique({
    where: { restaurantId },
  })

  if (!config) {
    return {
      success: false,
      error: 'Configuration SingPay introuvable. Configurez d\'abord le wallet.',
    }
  }

  if (enabled && !config.isConfigured) {
    return {
      success: false,
      error: 'La configuration est incomplète. Renseignez le Wallet ID avant d\'activer.',
    }
  }

  await prisma.restaurantSingpayConfig.update({
    where: { restaurantId },
    data: { enabled },
  })

  return { success: true, data: { enabled } }
}

/**
 * Récupère la config SingPay d'un restaurant.
 * Réservé aux superadmins.
 */
export async function getSingpayConfig(restaurantId: string) {
  if (!(await isSuperadmin())) {
    return null
  }

  return prisma.restaurantSingpayConfig.findUnique({
    where: { restaurantId },
  })
}
