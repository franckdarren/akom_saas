// lib/config/modules.ts
// Registre statique des modules activables par structure.
// Source de vérité pour la sidebar, la page /settings/modules et l'onboarding.

import type { ActivityType } from '@/lib/config/activity-labels'
import type { FeatureKey } from '@/lib/config/subscription'

export type ModuleKey =
    | 'catalog'
    | 'tables'
    | 'orders'
    | 'stocks'
    | 'transactions'
    | 'caisse'
    | 'pos'
    | 'warehouse'
    | 'stats'

export interface ModuleDefinition {
    key: ModuleKey
    label: string
    description: string
    iconName: string // nom de l'icône Lucide
    isCore: boolean  // true = non désactivable (toujours visible)
    requiredFeature?: FeatureKey
    defaultFor: ActivityType[] | '*' // activé par défaut pour ces types d'activité
    group: 'catalog' | 'operations' | 'pos' | 'warehouse' | 'analytics'
}

export const MODULE_CATALOG: Record<ModuleKey, ModuleDefinition> = {
    catalog: {
        key: 'catalog',
        label: 'Catalogue',
        description: 'Catégories et produits / services de votre établissement',
        iconName: 'BookOpen',
        isCore: true,
        defaultFor: '*',
        group: 'catalog',
    },
    tables: {
        key: 'tables',
        label: 'Espaces & tables',
        description: 'Gestion des espaces, tables, chambres ou zones de service',
        iconName: 'LayoutGrid',
        isCore: false,
        defaultFor: ['restaurant', 'hotel', 'beauty', 'other'],
        group: 'operations',
    },
    orders: {
        key: 'orders',
        label: 'Commandes',
        description: 'Réception, suivi et gestion des commandes en temps réel',
        iconName: 'ShoppingCart',
        isCore: false,
        defaultFor: '*',
        group: 'operations',
    },
    stocks: {
        key: 'stocks',
        label: 'Stocks',
        description: 'Suivi des niveaux de stock et alertes de rupture',
        iconName: 'Package',
        isCore: false,
        requiredFeature: 'stock_management',
        defaultFor: ['restaurant', 'retail', 'hotel', 'other'],
        group: 'operations',
    },
    transactions: {
        key: 'transactions',
        label: 'Transactions',
        description: 'Historique des paiements et mouvements financiers',
        iconName: 'ArrowRightLeft',
        isCore: false,
        defaultFor: '*',
        group: 'operations',
    },
    caisse: {
        key: 'caisse',
        label: 'Caisse',
        description: 'Sessions de caisse, rapports journaliers et clôture',
        iconName: 'Wallet',
        isCore: false,
        requiredFeature: 'caisse_module',
        defaultFor: [],
        group: 'pos',
    },
    pos: {
        key: 'pos',
        label: 'Comptoir (POS)',
        description: 'Prise de commande rapide directement au comptoir',
        iconName: 'MonitorSmartphone',
        isCore: false,
        defaultFor: ['restaurant', 'retail', 'beauty', 'other'],
        group: 'pos',
    },
    warehouse: {
        key: 'warehouse',
        label: 'Entrepôt',
        description: 'Gestion multi-sites, mouvements et transferts de stock',
        iconName: 'Warehouse',
        isCore: false,
        requiredFeature: 'warehouse_module',
        defaultFor: [],
        group: 'warehouse',
    },
    stats: {
        key: 'stats',
        label: 'Statistiques avancées',
        description: 'Analyses de performance, rapports et tableaux de bord',
        iconName: 'BarChart3',
        isCore: false,
        requiredFeature: 'advanced_stats',
        defaultFor: [],
        group: 'analytics',
    },
}

export const MODULE_GROUPS: Record<ModuleDefinition['group'], { label: string }> = {
    catalog:    { label: 'Catalogue' },
    operations: { label: 'Opérations' },
    pos:        { label: 'Comptoir & Caisse' },
    warehouse:  { label: 'Entrepôt' },
    analytics:  { label: 'Analyse' },
}

/** Retourne les clés de modules activés par défaut pour un type d'activité. */
export function getDefaultModulesForActivity(activityType: ActivityType): ModuleKey[] {
    return (Object.values(MODULE_CATALOG) as ModuleDefinition[])
        .filter(m => m.defaultFor === '*' || (m.defaultFor as ActivityType[]).includes(activityType))
        .map(m => m.key)
}
