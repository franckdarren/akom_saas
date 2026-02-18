// types/subscription.ts

// Réexporter le type depuis le helper pour cohérence
export type {SubscriptionPlan} from '@/lib/utils/subscription-helpers'

// Import des autres types Prisma
import type {
    SubscriptionStatus as PrismaSubscriptionStatus,
    SubscriptionPaymentMethod as PrismaSubscriptionPaymentMethod,
    SubscriptionPaymentStatus as PrismaSubscriptionPaymentStatus,
    SubscriptionPlan,
} from '@prisma/client'

/**
 * Statuts possibles d'un abonnement
 */
export type SubscriptionStatus = PrismaSubscriptionStatus

/**
 * Méthodes de paiement pour les abonnements
 */
export type SubscriptionPaymentMethod = PrismaSubscriptionPaymentMethod

/**
 * Statuts de paiement
 */
export type SubscriptionPaymentStatus = PrismaSubscriptionPaymentStatus

/**
 * Périodes de facturation disponibles
 */
export type BillingPeriod = 'monthly' | 'yearly'

// ... reste de vos types personnalisés ...

/**
 * Structure complète d'un abonnement
 */
export interface Subscription {
    id: string
    restaurantId: string
    plan: SubscriptionPlan
    status: SubscriptionStatus

    // Dates importantes
    trialStartsAt: Date
    trialEndsAt: Date
    currentPeriodStart: Date | null
    currentPeriodEnd: Date | null

    // Informations plan
    monthlyPrice: number
    billingCycle: number

    // Limites du plan
    maxTables: number | null
    maxUsers: number
    hasStockManagement: boolean
    hasAdvancedStats: boolean
    hasDataExport: boolean
    hasMobilePayment: boolean
    hasMultiRestaurants: boolean

    // Métadonnées
    createdAt: Date
    updatedAt: Date
}

// ... reste de vos interfaces ...

/**
 * Labels lisibles pour les plans
 */
export const PLAN_LABELS: Record<SubscriptionPlan, string> = {
    starter: 'Starter',
    business: 'Business',
    premium: 'Premium',
}

/**
 * Labels pour les statuts
 */
export const STATUS_LABELS: Record<SubscriptionStatus, string> = {
    trial: 'Période d\'essai',
    active: 'Actif',
    expired: 'Expiré',
    suspended: 'Suspendu',
    cancelled: 'Annulé',
}

/**
 * Couleurs pour les statuts (pour l'UI)
 */
export const STATUS_COLORS: Record<SubscriptionStatus, {
    bg: string
    text: string
    border: string
}> = {
    trial: {
        bg: 'bg-blue-50 dark:bg-blue-950',
        text: 'text-blue-700 dark:text-blue-300',
        border: 'border-blue-200 dark:border-blue-800',
    },
    active: {
        bg: 'bg-green-50 dark:bg-green-950',
        text: 'text-green-700 dark:text-green-300',
        border: 'border-green-200 dark:border-green-800',
    },
    expired: {
        bg: 'bg-red-50 dark:bg-red-950',
        text: 'text-red-700 dark:text-red-300',
        border: 'border-red-200 dark:border-red-800',
    },
    suspended: {
        bg: 'bg-orange-50 dark:bg-orange-950',
        text: 'text-orange-700 dark:text-orange-300',
        border: 'border-orange-200 dark:border-orange-800',
    },
    cancelled: {
        bg: 'bg-gray-50 dark:bg-gray-950',
        text: 'text-gray-700 dark:text-gray-300',
        border: 'border-gray-200 dark:border-gray-800',
    },
}