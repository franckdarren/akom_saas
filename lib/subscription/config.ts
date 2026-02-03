// lib/subscription/config.ts

export type SubscriptionPlan = 'starter' | 'business' | 'premium'
export type BillingCycle = 1 | 3 | 6 | 12

export interface PlanConfig {
    name: string
    description: string
    monthlyPrice: number
    maxTables: number | null
    maxUsers: number
    hasStockManagement: boolean
    hasAdvancedStats: boolean
    hasDataExport: boolean
    hasMobilePayment: boolean
    hasMultiRestaurants: boolean
    features: string[]
}

export const PLAN_CONFIGS: Record<SubscriptionPlan, PlanConfig> = {
    starter: {
        name: 'Starter',
        description: 'Parfait pour débuter',
        monthlyPrice: 15000,
        maxTables: 10,
        maxUsers: 3,
        hasStockManagement: false,
        hasAdvancedStats: false,
        hasDataExport: false,
        hasMobilePayment: false,
        hasMultiRestaurants: false,
        features: [
            'Jusqu\'à 10 tables',
            'Menu digital avec QR codes',
            'Gestion des commandes',
            'Interface cuisine temps réel',
            'Statistiques basiques',
            '1 admin + 2 utilisateurs cuisine',
        ],
    },
    business: {
        name: 'Business',
        description: 'Pour restaurants en croissance',
        monthlyPrice: 25000,
        maxTables: 30,
        maxUsers: 6,
        hasStockManagement: true,
        hasAdvancedStats: true,
        hasDataExport: true,
        hasMobilePayment: false,
        hasMultiRestaurants: false,
        features: [
            'Jusqu\'à 30 tables',
            'Gestion de stock complète',
            'Alertes stock bas',
            'Statistiques avancées',
            'Export des données (CSV, PDF)',
            '1 admin + 5 utilisateurs cuisine',
            'Support prioritaire',
        ],
    },
    premium: {
        name: 'Premium',
        description: 'Solution complète sans limites',
        monthlyPrice: 40000,
        maxTables: null,
        maxUsers: 999,
        hasStockManagement: true,
        hasAdvancedStats: true,
        hasDataExport: true,
        hasMobilePayment: true,
        hasMultiRestaurants: true,
        features: [
            'Tables illimitées',
            'Multi-restaurants (jusqu\'à 3)',
            'Paiement mobile money intégré',
            'Dashboard avancé',
            'API pour intégrations',
            'Utilisateurs illimités',
            'Support WhatsApp prioritaire',
            'Personnalisation logo & couleurs',
        ],
    },
}

// Calculer le prix avec réduction
export function calculatePrice(plan: SubscriptionPlan, billingCycle: BillingCycle): number {
    const basePrice = PLAN_CONFIGS[plan].monthlyPrice * billingCycle

    const discounts: Record<BillingCycle, number> = {
        1: 0,    // Pas de réduction
        3: 0.10, // -10%
        6: 0.15, // -15%
        12: 0.20, // -20%
    }

    const discount = discounts[billingCycle]
    return Math.round(basePrice * (1 - discount))
}

// Calculer l'économie réalisée
export function calculateSavings(plan: SubscriptionPlan, billingCycle: BillingCycle): number {
    if (billingCycle === 1) return 0

    const fullPrice = PLAN_CONFIGS[plan].monthlyPrice * billingCycle
    const discountedPrice = calculatePrice(plan, billingCycle)

    return fullPrice - discountedPrice
}

// Formater le prix en FCFA
export function formatPrice(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'XAF',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount)
}