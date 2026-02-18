// lib/config/subscription-features.ts
import type {SubscriptionPlan} from '@/types/subscription'

/**
 * Configuration centrale des fonctionnalités par offre
 *
 * Ce fichier définit TOUTES les limites et capacités de chaque plan.
 * C'est la source de vérité unique pour le système de permissions.
 */

// Types pour la configuration des features
export type FeatureKey =
    | 'max_tables'
    | 'max_products'
    | 'max_categories'
    | 'max_orders_per_day'
    | 'kitchen_display'
    | 'basic_stats'
    | 'advanced_stats'
    | 'stock_alerts'
    | 'data_export'
    | 'custom_branding'
    | 'priority_support'
    | 'api_access'
    | 'multiple_locations'

export type FeatureLimit = number | boolean | 'unlimited'

export interface PlanFeatures {
    // Limites quantitatives
    max_tables: number | 'unlimited'
    max_products: number | 'unlimited'
    max_categories: number | 'unlimited'
    max_orders_per_day: number | 'unlimited'

    // Fonctionnalités booléennes (activées ou non)
    kitchen_display: boolean
    basic_stats: boolean
    advanced_stats: boolean
    stock_alerts: boolean
    data_export: boolean
    custom_branding: boolean
    priority_support: boolean
    api_access: boolean
    multiple_locations: boolean
}

/**
 * Configuration complète des fonctionnalités par plan
 *
 * Chaque plan hérite des fonctionnalités du plan inférieur,
 * mais nous les définissons explicitement pour plus de clarté.
 */
export const PLAN_FEATURES: Record<SubscriptionPlan, PlanFeatures> = {
    starter: {
        // Limites quantitatives
        max_tables: 10,
        max_products: 50,
        max_categories: 10,
        max_orders_per_day: 100,

        // Fonctionnalités de base
        kitchen_display: true,
        basic_stats: true,

        // Fonctionnalités avancées désactivées
        advanced_stats: false,
        stock_alerts: false,
        data_export: false,
        custom_branding: false,
        priority_support: false,
        api_access: false,
        multiple_locations: false,
    },

    business: {
        // Limites augmentées
        max_tables: 30,
        max_products: 200,
        max_categories: 30,
        max_orders_per_day: 500,

        // Fonctionnalités de base
        kitchen_display: true,
        basic_stats: true,

        // Fonctionnalités intermédiaires activées
        advanced_stats: true,
        stock_alerts: true,
        data_export: true,

        // Fonctionnalités premium désactivées
        custom_branding: false,
        priority_support: false,
        api_access: false,
        multiple_locations: false,
    },

    premium: {
        // Pas de limites sur les ressources
        max_tables: 'unlimited',
        max_products: 'unlimited',
        max_categories: 'unlimited',
        max_orders_per_day: 'unlimited',

        // Toutes les fonctionnalités activées
        kitchen_display: true,
        basic_stats: true,
        advanced_stats: true,
        stock_alerts: true,
        data_export: true,
        custom_branding: true,
        priority_support: true,
        api_access: true,
        multiple_locations: true,
    },
}

/**
 * Labels lisibles pour l'affichage dans l'UI
 */
export const FEATURE_LABELS: Record<FeatureKey, string> = {
    max_tables: 'Nombre maximum de tables',
    max_products: 'Nombre maximum de produits',
    max_categories: 'Nombre maximum de catégories',
    max_orders_per_day: 'Commandes par jour',
    kitchen_display: 'Interface cuisine',
    basic_stats: 'Statistiques basiques',
    advanced_stats: 'Statistiques avancées',
    stock_alerts: 'Alertes de stock',
    data_export: 'Export de données',
    custom_branding: 'Personnalisation de la marque',
    priority_support: 'Support prioritaire',
    api_access: 'Accès API',
    multiple_locations: 'Multi-établissements',
}

/**
 * Descriptions pour le marketing et l'aide
 */
export const FEATURE_DESCRIPTIONS: Record<FeatureKey, string> = {
    max_tables: 'Nombre de tables QR que vous pouvez créer',
    max_products: 'Nombre de produits dans votre menu',
    max_categories: 'Nombre de catégories de produits',
    max_orders_per_day: 'Limite quotidienne de commandes',
    kitchen_display: 'Écran de cuisine en temps réel',
    basic_stats: 'Tableaux de bord avec ventes du jour',
    advanced_stats: 'Analyses détaillées et graphiques avancés',
    stock_alerts: 'Notifications quand le stock est bas',
    data_export: 'Exporter vos données en Excel/CSV',
    custom_branding: 'Logo et couleurs personnalisés',
    priority_support: 'Assistance prioritaire par email/chat',
    api_access: 'Accès à l\'API REST pour intégrations',
    multiple_locations: 'Gérer plusieurs établissements',
}