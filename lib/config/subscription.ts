// lib/config/subscription.ts
import type {SubscriptionPlan as PrismaSubscriptionPlan} from '@prisma/client'

/**
 * Configuration unifiée du système d'abonnement Akôm
 *
 * Ce fichier est la SOURCE DE VÉRITÉ UNIQUE pour :
 * - Les prix et cycles de facturation
 * - Les limites techniques (quotas)
 * - Les fonctionnalités disponibles
 * - Les textes marketing
 *
 * Tout changement ici se propage automatiquement dans toute l'application.
 */

// ============================================================
// TYPES DE BASE
// ============================================================

export type SubscriptionPlan = PrismaSubscriptionPlan
export type BillingCycle = 1 | 3 | 6 | 12

// Types pour les features techniques
export type FeatureKey =
    | 'max_tables'
    | 'max_products'
    | 'max_categories'
    | 'max_orders_per_day'
    | 'max_users'
    | 'kitchen_display'
    | 'basic_stats'
    | 'advanced_stats'
    | 'stock_management'
    | 'stock_alerts'
    | 'data_export'
    | 'mobile_payment'
    | 'multi_restaurants'
    | 'custom_branding'
    | 'priority_support'
    | 'api_access'

// ============================================================
// CONFIGURATION COMPLÈTE DES PLANS
// ============================================================

/**
 * Structure complète d'une configuration de plan
 *
 * Contient à la fois les informations marketing ET techniques
 */
interface CompletePlanConfig {
    // === INFORMATIONS MARKETING ===
    name: string
    tagline: string
    description: string
    monthlyPrice: number // Prix de base mensuel en FCFA
    isPopular?: boolean // Badge "Populaire"
    isBestValue?: boolean // Badge "Meilleur rapport qualité/prix"

    // === LIMITES TECHNIQUES (QUOTAS) ===
    limits: {
        max_tables: number
        max_products: number
        max_categories: number
        max_orders_per_day: number
        max_users: number
    }

    // === FONCTIONNALITÉS ACTIVÉES ===
    features: {
        kitchen_display: boolean
        basic_stats: boolean
        advanced_stats: boolean
        stock_management: boolean
        stock_alerts: boolean
        data_export: boolean
        mobile_payment: boolean
        multi_restaurants: boolean
        custom_branding: boolean
        priority_support: boolean
        api_access: boolean
    }

    // === TEXTES POUR LA PAGE PRICING ===
    marketingFeatures: string[] // Liste des features à afficher
    cta: string // Texte du bouton d'action
}

/**
 * Configuration complète de tous les plans
 *
 * C'est ici que vous modifiez TOUT ce qui concerne les abonnements
 */
export const SUBSCRIPTION_CONFIG: Record<SubscriptionPlan, CompletePlanConfig> = {
    starter: {
        // Marketing
        name: 'Starter',
        tagline: 'Parfait pour débuter',
        description: 'Idéal pour les petits restaurants qui veulent digitaliser leurs commandes',
        monthlyPrice: 3000,
        cta: 'Commencer gratuitement',

        // Limites techniques
        limits: {
            max_tables: 10,
            max_products: 50,
            max_categories: 10,
            max_orders_per_day: 100,
            max_users: 3,
        },

        // Fonctionnalités
        features: {
            kitchen_display: true,
            basic_stats: true,
            advanced_stats: false,
            stock_management: false,
            stock_alerts: false,
            data_export: false,
            mobile_payment: false,
            multi_restaurants: false,
            custom_branding: false,
            priority_support: false,
            api_access: false,
        },

        // Textes marketing
        marketingFeatures: [
            'Jusqu\'à 10 tables avec QR codes',
            'Menu digital illimité',
            'Gestion des commandes en temps réel',
            'Interface cuisine dédiée',
            'Statistiques basiques',
            '1 admin + 2 utilisateurs cuisine',
            'Support par email',
        ],
    },

    business: {
        // Marketing
        name: 'Business',
        tagline: 'Pour restaurants en croissance',
        description: 'Tout ce dont vous avez besoin pour gérer efficacement votre établissement',
        monthlyPrice: 25000,
        isPopular: true, // Badge "Populaire"
        cta: 'Essayer Business',

        // Limites techniques
        limits: {
            max_tables: 30,
            max_products: 200,
            max_categories: 30,
            max_orders_per_day: 500,
            max_users: 6,
        },

        // Fonctionnalités
        features: {
            kitchen_display: true,
            basic_stats: true,
            advanced_stats: true,
            stock_management: true,
            stock_alerts: true,
            data_export: true,
            mobile_payment: false,
            multi_restaurants: false,
            custom_branding: false,
            priority_support: true,
            api_access: false,
        },

        // Textes marketing
        marketingFeatures: [
            'Jusqu\'à 30 tables',
            'Gestion de stock complète',
            'Alertes automatiques stock bas',
            'Statistiques avancées avec graphiques',
            'Export des données (CSV, Excel)',
            '1 admin + 5 utilisateurs cuisine',
            'Support prioritaire par email',
            'Fiche circuit eBilling (e-facture Gabon)',
        ],
    },

    premium: {
        // Marketing
        name: 'Premium',
        tagline: 'Solution complète sans limites',
        description: 'La puissance maximale pour les établissements exigeants',
        monthlyPrice: 40000,
        isBestValue: true, // Badge "Meilleur rapport"
        cta: 'Passer au Premium',

        // Limites techniques
        limits: {
            max_tables: 100000,
            max_products: 100000,
            max_categories: 100000,
            max_orders_per_day: 100000,
            max_users: 999,
        },

        // Fonctionnalités
        features: {
            kitchen_display: true,
            basic_stats: true,
            advanced_stats: true,
            stock_management: true,
            stock_alerts: true,
            data_export: true,
            mobile_payment: true,
            multi_restaurants: true,
            custom_branding: true,
            priority_support: true,
            api_access: true,
        },

        // Textes marketing
        marketingFeatures: [
            '🔥 Tables illimitées',
            '🔥 Produits illimités',
            'Multi-restaurants (jusqu\'à 3 établissements)',
            'Paiement Mobile Money intégré (Airtel, Moov)',
            'Dashboard avancé avec prévisions',
            'API REST pour intégrations personnalisées',
            'Utilisateurs illimités',
            'Support WhatsApp prioritaire',
            'Personnalisation logo & couleurs',
            'Module entrepôt & stock avancé',
        ],
    },
}

// ============================================================
// FONCTIONS UTILITAIRES
// ============================================================

/**
 * Récupère la configuration complète d'un plan
 */
export function getPlanConfig(plan: SubscriptionPlan): CompletePlanConfig {
    return SUBSCRIPTION_CONFIG[plan]
}

/**
 * Récupère uniquement les limites techniques d'un plan
 * (Pour le système de vérification des quotas)
 */
export function getPlanLimits(plan: SubscriptionPlan) {
    return SUBSCRIPTION_CONFIG[plan].limits
}

/**
 * Récupère uniquement les features techniques d'un plan
 * (Pour le système de vérification des permissions)
 */
export function getPlanFeatures(plan: SubscriptionPlan) {
    return SUBSCRIPTION_CONFIG[plan].features
}

/**
 * Vérifie si un plan a une feature spécifique
 */
export function hasPlanFeature(
    plan: SubscriptionPlan,
    feature: keyof CompletePlanConfig['features']
): boolean {
    return SUBSCRIPTION_CONFIG[plan].features[feature]
}

/**
 * Calcule le prix avec réduction selon le cycle de facturation
 */
export function calculatePrice(
    plan: SubscriptionPlan,
    billingCycle: BillingCycle
): number {
    const basePrice = SUBSCRIPTION_CONFIG[plan].monthlyPrice * billingCycle

    const discounts: Record<BillingCycle, number> = {
        1: 0,    // Pas de réduction
        3: 0.10, // -10%
        6: 0.15, // -15%
        12: 0.20, // -20%
    }

    const discount = discounts[billingCycle]
    return Math.round(basePrice * (1 - discount))
}

/**
 * Calcule l'économie réalisée avec un cycle long
 */
export function calculateSavings(
    plan: SubscriptionPlan,
    billingCycle: BillingCycle
): number {
    if (billingCycle === 1) return 0

    const fullPrice = SUBSCRIPTION_CONFIG[plan].monthlyPrice * billingCycle
    const discountedPrice = calculatePrice(plan, billingCycle)

    return fullPrice - discountedPrice
}

/**
 * Formate un prix en FCFA
 */
export function formatPrice(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'XAF',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount)
}

/**
 * Récupère tous les plans disponibles
 */
export function getAllPlans(): SubscriptionPlan[] {
    return ['starter', 'business', 'premium']
}

/**
 * Compare deux plans (pour upgrades/downgrades)
 */
export function comparePlans(plan1: SubscriptionPlan, plan2: SubscriptionPlan): -1 | 0 | 1 {
    const order: Record<SubscriptionPlan, number> = {
        starter: 1,
        business: 2,
        premium: 3,
    }

    const order1 = order[plan1]
    const order2 = order[plan2]

    if (order1 < order2) return -1
    if (order1 > order2) return 1
    return 0
}

// ============================================================
// EXPORT POUR COMPATIBILITÉ AVEC L'ANCIEN CODE
// ============================================================

/**
 * Export des limites au format attendu par subscription-checker
 *
 * Ceci permet de garder la compatibilité avec le code existant
 * qui utilise PLAN_FEATURES
 */
export const PLAN_FEATURES = Object.entries(SUBSCRIPTION_CONFIG).reduce(
    (acc, [plan, config]) => {
        acc[plan as SubscriptionPlan] = {
            ...config.limits,
            ...config.features,
        }
        return acc
    },
    {} as Record<SubscriptionPlan, CompletePlanConfig['limits'] & CompletePlanConfig['features']>
)

/**
 * Labels lisibles pour l'affichage dans l'UI
 */
export const FEATURE_LABELS: Record<FeatureKey, string> = {
    max_tables: 'Nombre maximum de tables',
    max_products: 'Nombre maximum de produits',
    max_categories: 'Nombre maximum de catégories',
    max_orders_per_day: 'Commandes par jour',
    max_users: 'Nombre d\'utilisateurs',
    kitchen_display: 'Interface cuisine',
    basic_stats: 'Statistiques basiques',
    advanced_stats: 'Statistiques avancées',
    stock_management: 'Gestion de stock',
    stock_alerts: 'Alertes de stock',
    data_export: 'Export de données',
    mobile_payment: 'Paiement mobile',
    multi_restaurants: 'Multi-établissements',
    custom_branding: 'Personnalisation',
    priority_support: 'Support prioritaire',
    api_access: 'Accès API',
}

/**
 * Descriptions détaillées des features
 */
export const FEATURE_DESCRIPTIONS: Record<FeatureKey, string> = {
    max_tables: 'Nombre de tables QR que vous pouvez créer',
    max_products: 'Nombre de produits dans votre menu',
    max_categories: 'Nombre de catégories de produits',
    max_orders_per_day: 'Limite quotidienne de commandes',
    max_users: 'Nombre d\'utilisateurs pouvant accéder au système',
    kitchen_display: 'Écran de cuisine en temps réel',
    basic_stats: 'Tableaux de bord avec ventes du jour',
    advanced_stats: 'Analyses détaillées et graphiques avancés',
    stock_management: 'Suivi complet des stocks',
    stock_alerts: 'Notifications quand le stock est bas',
    data_export: 'Exporter vos données en Excel/CSV',
    mobile_payment: 'Paiements Airtel Money et Moov Money',
    multi_restaurants: 'Gérer plusieurs établissements',
    custom_branding: 'Logo et couleurs personnalisés',
    priority_support: 'Assistance prioritaire par email/WhatsApp',
    api_access: 'Accès à l\'API REST pour intégrations',
}