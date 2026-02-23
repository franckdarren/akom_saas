// lib/services/subscription-checker.ts
'use server'

import prisma from '@/lib/prisma'
import {PLAN_FEATURES, type FeatureKey} from '@/lib/config/subscription'
import {toSubscriptionPlan, type SubscriptionPlan} from '@/lib/utils/subscription-helpers'

/**
 * Service de vérification des permissions d'abonnement
 *
 * Ce service est le point central pour toutes les vérifications
 * liées aux limites de l'offre d'abonnement.
 *
 * ARCHITECTURE :
 * =============
 * Ce service lit les limites depuis PLAN_FEATURES (source de vérité unique)
 * et vérifie l'utilisation réelle en base de données.
 */

// Types pour les résultats de vérification
export interface FeatureCheckResult {
    allowed: boolean
    reason?: string
    currentUsage?: number
    limit?: number | 'unlimited'
}

export interface QuotaStatus {
    used: number
    limit: number | 'unlimited'
    percentage: number
    isNearLimit: boolean // true si >= 80%
    isAtLimit: boolean   // true si >= 100%
}

/**
 * Récupère le plan d'abonnement actuel d'un restaurant
 *
 * Cette fonction cherche l'abonnement actif le plus récent.
 * Si aucun n'est trouvé, elle retourne 'starter' par défaut
 * (via le helper toSubscriptionPlan qui gère la conversion).
 */
export async function getRestaurantPlan(
    restaurantId: string
): Promise<SubscriptionPlan> {
    const subscription = await prisma.subscription.findFirst({
        where: {
            restaurantId,
            status: {in: ['active', 'trial']}, // on considère trial comme actif
        },
        orderBy: {currentPeriodEnd: 'desc'},
        select: {plan: true},
    })

    // Convertir la valeur Prisma en SubscriptionPlan valide
    return toSubscriptionPlan(subscription?.plan)
}

/**
 * Vérifie si une fonctionnalité booléenne est disponible
 *
 * Utilisée pour les features on/off comme :
 * - advanced_stats
 * - stock_management
 * - mobile_payment
 * etc.
 */
export async function hasFeature(
    restaurantId: string,
    feature: FeatureKey
): Promise<boolean> {
    const plan = await getRestaurantPlan(restaurantId)
    const planFeatures = PLAN_FEATURES[plan]
    const featureValue = planFeatures[feature]

    if (typeof featureValue === 'boolean') {
        return featureValue
    }

    // Pour les quotas numériques, la feature est considérée comme activée
    return true
}

/**
 * Vérifie si un quota quantitatif est atteint
 *
 * Cette fonction est le cœur de la logique de limitation.
 * Elle compte l'utilisation actuelle et la compare à la limite du plan.
 */
export async function checkQuota(
    restaurantId: string,
    quota: 'max_tables' | 'max_products' | 'max_categories' | 'max_orders_per_day'
): Promise<FeatureCheckResult> {
    const plan = await getRestaurantPlan(restaurantId)
    const limitValue = PLAN_FEATURES[plan][quota]

    // Cas 'unlimited'
    if (limitValue === 'unlimited') {
        return {allowed: true, limit: 'unlimited', currentUsage: 0}
    }

    // Sécurité : convertir en nombre si possible
    const limit: number = typeof limitValue === 'number' ? limitValue : 0
    if (limit === 0) {
        return {
            allowed: false,
            limit: 0,
            currentUsage: 0,
            reason: 'Configuration de limite invalide',
        }
    }

    // Compter l'utilisation actuelle selon le type de quota
    let currentUsage = 0

    switch (quota) {
        case 'max_tables':
            currentUsage = await prisma.table.count({
                where: {restaurantId, isActive: true},
            })
            break

        case 'max_products':
            currentUsage = await prisma.product.count({
                where: {restaurantId},
            })
            break

        case 'max_categories':
            currentUsage = await prisma.category.count({
                where: {restaurantId, isActive: true},
            })
            break

        case 'max_orders_per_day':
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            const tomorrow = new Date(today)
            tomorrow.setDate(tomorrow.getDate() + 1)
            currentUsage = await prisma.order.count({
                where: {
                    restaurantId,
                    createdAt: {gte: today, lt: tomorrow},
                },
            })
            break
    }

    const allowed = currentUsage < limit
    return {
        allowed,
        currentUsage,
        limit,
        reason: allowed ? undefined : `Limite atteinte : ${currentUsage}/${limit}`,
    }
}

/**
 * Obtient le statut complet d'un quota (pour l'UI)
 *
 * Retourne :
 * - used : nombre utilisé
 * - limit : limite du plan
 * - percentage : pourcentage utilisé
 * - isNearLimit : >= 80%
 * - isAtLimit : >= 100%
 */
export async function getQuotaStatus(
    restaurantId: string,
    quota: 'max_tables' | 'max_products' | 'max_categories' | 'max_orders_per_day'
): Promise<QuotaStatus> {
    const result = await checkQuota(restaurantId, quota)

    if (result.limit === 'unlimited') {
        return {used: result.currentUsage || 0, limit: 'unlimited', percentage: 0, isNearLimit: false, isAtLimit: false}
    }

    const used = result.currentUsage || 0
    const limit = result.limit as number
    const percentage = limit > 0 ? (used / limit) * 100 : 0

    return {
        used,
        limit,
        percentage: Math.min(100, percentage),
        isNearLimit: percentage >= 80,
        isAtLimit: percentage >= 100,
    }
}

/**
 * Vérifie toutes les permissions pour un restaurant
 *
 * Retourne un objet complet avec :
 * - plan
 * - features booléennes
 * - statuts des quotas
 */
export async function getAllFeatures(restaurantId: string) {
    const plan = await getRestaurantPlan(restaurantId)
    const features = PLAN_FEATURES[plan]

    const [tablesStatus, productsStatus, categoriesStatus, ordersStatus] =
        await Promise.all([
            getQuotaStatus(restaurantId, 'max_tables'),
            getQuotaStatus(restaurantId, 'max_products'),
            getQuotaStatus(restaurantId, 'max_categories'),
            getQuotaStatus(restaurantId, 'max_orders_per_day'),
        ])

    return {
        plan,
        features,
        quotas: {
            tables: tablesStatus,
            products: productsStatus,
            categories: categoriesStatus,
            orders: ordersStatus,
        },
    }
}