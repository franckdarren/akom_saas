// lib/utils/subscription-helpers.ts

import type {SubscriptionPlan as PrismaSubscriptionPlan} from '@prisma/client'

/**
 * Type SubscriptionPlan basé sur Prisma
 */
export type SubscriptionPlan = PrismaSubscriptionPlan

/**
 * Valide et convertit une chaîne en SubscriptionPlan
 * Retourne 'starter' par défaut si invalide
 *
 * Cette fonction garantit que même si Prisma retourne un type inattendu,
 * nous avons toujours un plan valide.
 */
export function toSubscriptionPlan(
    value: string | null | undefined
): SubscriptionPlan {
    const validPlans: SubscriptionPlan[] = ['starter', 'business', 'premium']

    if (!value) {
        return 'starter'
    }

    // Normaliser en minuscules pour être sûr
    const normalized = value.toLowerCase() as SubscriptionPlan

    if (validPlans.includes(normalized)) {
        return normalized
    }

    // Log en cas de valeur invalide (utile pour debug)
    console.warn(`Plan d'abonnement invalide reçu: "${value}", utilisation de 'starter' par défaut`)
    return 'starter'
}

/**
 * Vérifie si une valeur est un SubscriptionPlan valide
 *
 * Type guard TypeScript qui permet de valider à la compilation
 */
export function isValidPlan(value: unknown): value is SubscriptionPlan {
    return (
        typeof value === 'string' &&
        ['starter', 'business', 'premium'].includes(value.toLowerCase())
    )
}

/**
 * Récupère tous les plans disponibles
 * Utile pour générer des listes dynamiques dans l'UI
 */
export function getAllPlans(): SubscriptionPlan[] {
    return ['starter', 'business', 'premium']
}

/**
 * Vérifie si un plan est supérieur à un autre
 * Utile pour vérifier les upgrades
 */
export function isPlanHigherThan(
    plan1: SubscriptionPlan,
    plan2: SubscriptionPlan
): boolean {
    const order: Record<SubscriptionPlan, number> = {
        starter: 1,
        business: 2,
        premium: 3,
    }

    return order[plan1] > order[plan2]
}

/**
 * Vérifie si un changement de plan est un upgrade
 */
export function isUpgrade(
    currentPlan: SubscriptionPlan,
    newPlan: SubscriptionPlan
): boolean {
    return isPlanHigherThan(newPlan, currentPlan)
}

/**
 * Vérifie si un changement de plan est un downgrade
 */
export function isDowngrade(
    currentPlan: SubscriptionPlan,
    newPlan: SubscriptionPlan
): boolean {
    return isPlanHigherThan(currentPlan, newPlan)
}