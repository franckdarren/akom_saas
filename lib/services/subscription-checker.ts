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
    isNearLimit: boolean // true si > 80%
    isAtLimit: boolean
}

/**
 * Récupère le plan d'abonnement actuel d'un restaurant
 */
export async function getRestaurantPlan(
    restaurantId: string
): Promise<SubscriptionPlan> {
    const subscription = await prisma.subscription.findFirst({
        where: {
            restaurantId,
            status: 'active',
        },
        orderBy: {
            currentPeriodEnd: 'desc',
        },
        select: {
            plan: true,
        },
    })

    // Convertir la valeur Prisma en SubscriptionPlan valide
    // Le helper garantit qu'on retourne toujours un plan valide
    return toSubscriptionPlan(subscription?.plan)
}

/**
 * Vérifie si une fonctionnalité booléenne est disponible
 *
 * Exemple : hasFeature(restaurantId, 'advanced_stats')
 */
export async function hasFeature(
    restaurantId: string,
    feature: FeatureKey
): Promise<boolean> {
    const plan = await getRestaurantPlan(restaurantId)
    const planFeatures = PLAN_FEATURES[plan]

    const featureValue = planFeatures[feature]

    // Si c'est un booléen, retourner directement
    if (typeof featureValue === 'boolean') {
        return featureValue
    }

    // Si c'est un nombre ou 'unlimited', considérer comme activé
    return true
}

/**
 * Vérifie si un quota quantitatif est atteint
 *
 * Cette fonction est le cœur de la logique de limitation.
 * Elle compte l'utilisation actuelle et la compare à la limite.
 */
export async function checkQuota(
    restaurantId: string,
    quota: Extract<FeatureKey, 'max_tables' | 'max_products' | 'max_categories' | 'max_orders_per_day'>
): Promise<FeatureCheckResult> {
    const plan = await getRestaurantPlan(restaurantId)
    const limit = PLAN_FEATURES[plan][quota]

    // Si unlimited, toujours autorisé
    if (limit === 'unlimited') {
        return {allowed: true, limit: 'unlimited'}
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

            currentUsage = await prisma.order.count({
                where: {
                    restaurantId,
                    createdAt: {gte: today},
                },
            })
            break
    }

    const allowed = currentUsage < limit

    return {
        allowed,
        currentUsage,
        limit,
        reason: allowed
            ? undefined
            : `Limite atteinte : ${currentUsage}/${limit}`,
    }
}

/**
 * Obtient le statut d'un quota (pour affichage dans l'UI)
 */
export async function getQuotaStatus(
    restaurantId: string,
    quota: Extract<FeatureKey, 'max_tables' | 'max_products' | 'max_categories' | 'max_orders_per_day'>
): Promise<QuotaStatus> {
    const result = await checkQuota(restaurantId, quota)

    if (result.limit === 'unlimited') {
        return {
            used: result.currentUsage || 0,
            limit: 'unlimited',
            percentage: 0,
            isNearLimit: false,
            isAtLimit: false,
        }
    }

    const used = result.currentUsage || 0
    const limit = result.limit as number
    const percentage = (used / limit) * 100

    return {
        used,
        limit,
        percentage,
        isNearLimit: percentage >= 80,
        isAtLimit: percentage >= 100,
    }
}

/**
 * Vérifie toutes les permissions pour un restaurant
 * Utile pour afficher un récapitulatif complet
 */
export async function getAllFeatures(restaurantId: string) {
    const plan = await getRestaurantPlan(restaurantId)
    const features = PLAN_FEATURES[plan]

    // Récupérer les statuts des quotas
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