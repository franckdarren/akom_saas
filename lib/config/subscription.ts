// lib/config/subscription.ts
import type {SubscriptionPlan as PrismaSubscriptionPlan} from '@prisma/client'

export type SubscriptionPlan = PrismaSubscriptionPlan
export type BillingCycle = 1 | 3 | 6 | 12

export type FeatureKey =
    | 'max_tables'
    | 'max_products'
    | 'max_categories'
    | 'max_orders_per_day'
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
    | 'warehouse_module'
    | 'caisse_module'

/**
 * Configuration tarifaire pour les utilisateurs
 *
 * IMPORTANT : Comprendre le modèle de tarification Akôm
 * =====================================================
 *
 * Dans notre système, TOUS les plans incluent par défaut UN SEUL utilisateur
 * dans leur prix de base : le compte administrateur. C'est l'utilisateur obligatoire
 * qui crée le restaurant et qui ne peut jamais être supprimé.
 *
 * Le prix de base (baseMonthlyPrice) couvre UNIQUEMENT cet administrateur.
 * Tout utilisateur ajouté au-delà de l'admin coûte un supplément mensuel.
 *
 * Les champs de cette interface définissent :
 * - maxUsers : Le nombre TOTAL maximum d'utilisateurs (admin inclus)
 *              Pour Starter, c'est 3 (admin + 2 users max)
 *              Pour Business, c'est 5 (admin + 4 users max)
 *              Pour Premium, c'est 'unlimited' (pas de limite)
 * - pricePerExtraUser : Le coût mensuel de CHAQUE utilisateur AU-DELÀ de l'admin
 *
 * Exemple concret avec le plan Starter :
 * -------------------------------------
 * Prix de base : 3 000 FCFA/mois (inclut SEULEMENT l'admin)
 * Maximum d'utilisateurs : 3 (admin + 2 users supplémentaires maximum)
 * Prix par utilisateur supplémentaire : 5 000 FCFA/mois
 *
 * Scénario 1 : Restaurant avec seulement l'admin
 * → 1 utilisateur total
 * → Prix = 3 000 FCFA (prix de base, aucun supplément)
 *
 * Scénario 2 : Restaurant avec admin + 1 cuisinier
 * → 2 utilisateurs total
 * → Prix = 3 000 + (1 × 5 000) = 8 000 FCFA/mois
 *
 * Scénario 3 : Restaurant avec admin + 2 cuisiniers
 * → 3 utilisateurs total (MAXIMUM pour Starter)
 * → Prix = 3 000 + (2 × 5 000) = 13 000 FCFA/mois
 *
 * Si le restaurant a besoin d'un 4ème utilisateur, il DOIT upgrader vers Business.
 */
interface UserPricingConfig {
    maxUsers: number | 'unlimited'  // Nombre TOTAL maximum d'utilisateurs (admin inclus)
    pricePerExtraUser: number       // Prix mensuel par utilisateur AU-DELÀ de l'admin
}

interface CompletePlanConfig {
    // Informations marketing
    name: string
    tagline: string
    description: string

    // Prix de BASE qui inclut UNIQUEMENT le compte administrateur
    // Tout utilisateur supplémentaire coûte en plus
    baseMonthlyPrice: number

    isPopular?: boolean
    isBestValue?: boolean

    // Configuration de tarification par utilisateur
    userPricing: UserPricingConfig

    // Limites techniques (quotas)
    limits: {
        max_tables: number | 'unlimited'
        max_products: number | 'unlimited'
        max_categories: number | 'unlimited'
        max_orders_per_day: number | 'unlimited'
    }

    // Fonctionnalités activées
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
        warehouse_module: boolean
        caisse_module: boolean
    }

    // Textes marketing
    marketingFeatures: string[]
    cta: string
}

/**
 * Configuration complète de tous les plans d'abonnement Akôm
 *
 * RÈGLES DE TARIFICATION (à respecter absolument) :
 * =================================================
 *
 * 1. Le baseMonthlyPrice inclut UNIQUEMENT l'administrateur
 * 2. Chaque utilisateur ajouté coûte pricePerExtraUser en supplément
 * 3. maxUsers définit le plafond total (admin inclus dans le compte)
 * 4. Un utilisateur = 1 dans le décompte, qu'il soit admin, cuisine, serveur, etc.
 */
export const SUBSCRIPTION_CONFIG: Record<SubscriptionPlan, CompletePlanConfig> = {
    starter: {
        name: 'Starter',
        tagline: 'Parfait pour débuter',
        description: 'Idéal pour les petits restaurants qui veulent digitaliser leurs commandes',

        // Prix de base : 3 000 FCFA/mois pour l'administrateur SEUL
        // Ce prix ne couvre QUE le compte admin, aucun utilisateur supplémentaire n'est inclus
        baseMonthlyPrice: 3000,

        cta: 'Commencer avec Starter',

        userPricing: {
            // Maximum 3 utilisateurs TOTAL (admin + 2 users supplémentaires possibles)
            // Si le restaurant a besoin d'un 4ème utilisateur, il DOIT upgrader vers Business
            maxUsers: 3,

            // Chaque utilisateur AU-DELÀ de l'admin coûte 5 000 FCFA/mois
            // Donc avec 1 user en plus de l'admin : 3 000 + 5 000 = 8 000 FCFA/mois
            // Donc avec 2 users en plus de l'admin : 3 000 + 10 000 = 13 000 FCFA/mois
            pricePerExtraUser: 5000,
        },

        limits: {
            max_tables: 10,
            max_products: 30,
            max_categories: 5,
            max_orders_per_day: 100000,
        },

        features: {
            kitchen_display: true,
            basic_stats: true,
            advanced_stats: false,
            stock_management: true,
            stock_alerts: false,
            data_export: false,
            mobile_payment: false,
            multi_restaurants: false,
            custom_branding: false,
            priority_support: false,
            api_access: false,
            warehouse_module: false,
            caisse_module: false,
        },

        marketingFeatures: [
            'Jusqu\'à 10 tables avec QR codes',
            'Maximum 30 produits au menu',
            'Maximum 5 catégories produits',
            'Maximum 3 utilisateurs (1 admin + 2 comptes)',
            'Prix de base : 3 000 FCFA/mois (admin seul)',
            '+ 5 000 FCFA/mois par utilisateur supplémentaire',
            'Menu digital avec photos',
            'Gestion des commandes en temps réel',
            'Interface cuisine dédiée',
            'Statistiques basiques (CA, commandes)',
            'Support par email sous 48h',
        ],
    },

    business: {
        name: 'Business',
        tagline: 'Pour structure en croissance',
        description: 'Tout ce dont vous avez besoin pour gérer efficacement votre établissement',

        // Prix de base : 5 000 FCFA/mois pour l'administrateur SEUL
        // Ce prix ne couvre QUE le compte admin
        baseMonthlyPrice: 5000,

        isPopular: true,
        cta: 'Choisir Business',

        userPricing: {
            // Maximum 5 utilisateurs TOTAL (admin + 4 users supplémentaires possibles)
            // Si le restaurant a besoin d'un 6ème utilisateur, il DOIT upgrader vers Premium
            maxUsers: 5,

            // Chaque utilisateur AU-DELÀ de l'admin coûte 7 500 FCFA/mois
            // Donc avec 1 user en plus : 5 000 + 7 500 = 12 500 FCFA/mois
            // Donc avec 2 users en plus : 5 000 + 15 000 = 20 000 FCFA/mois
            // Donc avec 3 users en plus : 5 000 + 22 500 = 27 500 FCFA/mois
            // Donc avec 4 users en plus : 5 000 + 30 000 = 35 000 FCFA/mois (maximum)
            pricePerExtraUser: 7500,
        },

        limits: {
            max_tables: 50,
            max_products: 80,
            max_categories: 15,
            max_orders_per_day: 100000,
        },

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
            warehouse_module: true,
            caisse_module: true,
        },

        marketingFeatures: [
            'Jusqu\'à 50 tables avec QR codes',
            'Maximum 50 produits au menu',
            'Maximum 15 catégories produits',
            'Maximum 5 utilisateurs (1 admin + 4 comptes)',
            'Prix de base : 5 000 FCFA/mois (admin seul)',
            '+ 7 500 FCFA/mois par utilisateur supplémentaire',
            'Gestion de stock complète',
            'Module caisse intégré',
            'Module entrepôt avancé',
            'Alertes automatiques stock bas',
            'Statistiques avancées avec graphiques',
            'Export des données (CSV, Excel)',
            'Support prioritaire sous 24h',
            'Formation en ligne incluse',
        ],
    },

    premium: {
        name: 'Premium',
        tagline: 'Solution complète sans limites',
        description: 'La puissance maximale pour les établissements exigeants',

        // Prix de base : 8 000 FCFA/mois pour l'administrateur SEUL
        // Ce prix ne couvre QUE le compte admin
        baseMonthlyPrice: 8000,

        isBestValue: true,
        cta: 'Passer au Premium',

        userPricing: {
            // PAS DE LIMITE d'utilisateurs sur le plan Premium
            // Le restaurant peut ajouter autant d'utilisateurs qu'il veut
            maxUsers: 'unlimited',

            // Chaque utilisateur AU-DELÀ de l'admin coûte 10 000 FCFA/mois
            // Donc avec 1 user en plus : 8 000 + 10 000 = 18 000 FCFA/mois
            // Donc avec 5 users en plus : 8 000 + 50 000 = 58 000 FCFA/mois
            // Donc avec 10 users en plus : 8 000 + 100 000 = 108 000 FCFA/mois
            // Et ainsi de suite, sans limite
            pricePerExtraUser: 10000,
        },

        limits: {
            max_tables: 'unlimited',
            max_products: 'unlimited',
            max_categories: 'unlimited',
            max_orders_per_day: 'unlimited',
        },

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
            warehouse_module: true,
            caisse_module: true,
        },

        marketingFeatures: [
            '🔥 Tables illimitées',
            '🔥 Produits illimités',
            '🔥 Utilisateurs illimités',
            '🔥 Catégories illimitées',
            'Prix de base : 8 000 FCFA/mois (admin seul)',
            '+ 10 000 FCFA/mois par utilisateur supplémentaire',
            'Multi-restaurants (jusqu\'à 3 établissements)',
            'Paiement Mobile Money intégré',
            'Module caisse et entrepôt avancés',
            'Dashboard avancé avec prévisions IA',
            'Personnalisation complète (logo, couleurs)',
            'Support WhatsApp prioritaire 7j/7',
            'Formation personnalisée sur site',
            'Gestionnaire de compte dédié',
        ],
    },
}

/**
 * Calcule le prix mensuel total en fonction du nombre d'utilisateurs
 *
 * LOGIQUE DE CALCUL (corrigée selon le vrai modèle Akôm) :
 * ========================================================
 *
 * 1. Le prix de base inclut UNIQUEMENT l'administrateur
 * 2. On calcule le nombre d'utilisateurs SUPPLÉMENTAIRES (userCount - 1)
 *    Le "-1" représente l'admin qui est déjà inclus dans le prix de base
 * 3. On multiplie ce nombre par le pricePerExtraUser
 * 4. On additionne au prix de base
 *
 * Exemple avec Starter et 3 utilisateurs :
 * - Prix de base : 3 000 FCFA (pour l'admin)
 * - Utilisateurs supplémentaires : 3 - 1 = 2
 * - Coût supplémentaire : 2 × 5 000 = 10 000 FCFA
 * - Total : 3 000 + 10 000 = 13 000 FCFA/mois
 *
 * @param plan - Le plan d'abonnement choisi
 * @param userCount - Le nombre TOTAL d'utilisateurs (admin inclus dans le compte)
 * @returns Le prix mensuel total en FCFA
 */
export function calculateMonthlyPrice(
    plan: SubscriptionPlan,
    userCount: number
): number {
    // Récupérer la configuration du plan
    const config = SUBSCRIPTION_CONFIG[plan]
    const basePrice = config.baseMonthlyPrice
    const pricePerExtraUser = config.userPricing.pricePerExtraUser

    // ÉTAPE 1 : Cas spécial - un seul utilisateur (seulement l'admin)
    // ---------------------------------------------------------------
    // Si userCount est 1, cela signifie qu'il n'y a que l'administrateur
    // Dans ce cas, on paie juste le prix de base, aucun supplément
    if (userCount <= 1) {
        return basePrice
    }

    // ÉTAPE 2 : Calculer le nombre d'utilisateurs supplémentaires
    // ----------------------------------------------------------
    // On soustrait 1 de userCount parce que l'admin est déjà compté
    // dans le prix de base. Seuls les utilisateurs AU-DELÀ de l'admin
    // coûtent un supplément.
    //
    // Exemple : Si userCount est 3, on a :
    // - 1 admin (inclus dans le prix de base)
    // - 2 utilisateurs supplémentaires (qui coûtent un supplément)
    // Donc extraUsers = 3 - 1 = 2
    const extraUsers = userCount - 1

    // ÉTAPE 3 : Calculer le coût des utilisateurs supplémentaires
    // ----------------------------------------------------------
    // On multiplie le nombre d'utilisateurs supplémentaires par
    // le prix unitaire de chaque utilisateur supplémentaire
    const extraCost = extraUsers * pricePerExtraUser

    // ÉTAPE 4 : Retourner le prix total
    // --------------------------------
    // Prix total = Prix de base (admin) + Coût des users supplémentaires
    return basePrice + extraCost
}

/**
 * Calcule le prix total pour un cycle de facturation donné
 * en tenant compte des réductions pour engagement long terme
 *
 * Cette fonction prend le prix mensuel (qui inclut déjà les utilisateurs
 * supplémentaires) et l'étend sur plusieurs mois avec réduction.
 */
export function calculateTotalPrice(
    plan: SubscriptionPlan,
    userCount: number,
    billingCycle: BillingCycle
): number {
    // Obtenir le prix mensuel avec tous les utilisateurs inclus
    const monthlyPrice = calculateMonthlyPrice(plan, userCount)

    // Calculer le total brut (sans réduction)
    const totalBeforeDiscount = monthlyPrice * billingCycle

    // Appliquer les réductions pour engagement long terme
    const discounts: Record<BillingCycle, number> = {
        1: 0,    // Mensuel : aucune réduction
        3: 0.10, // Trimestriel : 10% de réduction
        6: 0.15, // Semestriel : 15% de réduction
        12: 0.20, // Annuel : 20% de réduction
    }

    const discount = discounts[billingCycle]
    return Math.round(totalBeforeDiscount * (1 - discount))
}

/**
 * Calcule les économies réalisées avec un cycle long
 */
export function calculateSavings(
    plan: SubscriptionPlan,
    userCount: number,
    billingCycle: BillingCycle
): number {
    if (billingCycle === 1) return 0

    const monthlyPrice = calculateMonthlyPrice(plan, userCount)
    const fullPrice = monthlyPrice * billingCycle
    const discountedPrice = calculateTotalPrice(plan, userCount, billingCycle)

    return fullPrice - discountedPrice
}

/**
 * Calcule uniquement le coût des utilisateurs supplémentaires
 *
 * Cette fonction retourne SEULEMENT le surcoût des utilisateurs
 * au-delà de l'admin, sans le prix de base.
 */
export function calculateExtraUsersCost(
    plan: SubscriptionPlan,
    userCount: number
): number {
    const config = SUBSCRIPTION_CONFIG[plan]

    // Si un seul utilisateur (l'admin), aucun coût supplémentaire
    if (userCount <= 1) {
        return 0
    }

    // Calculer le nombre d'utilisateurs au-delà de l'admin
    const extraUsers = userCount - 1

    // Retourner uniquement le coût de ces utilisateurs supplémentaires
    return extraUsers * config.userPricing.pricePerExtraUser
}

/**
 * Vérifie si un plan peut accepter un utilisateur supplémentaire
 *
 * Cette fonction est cruciale pour la validation côté frontend.
 * Elle empêche qu'on essaye d'ajouter un 4ème utilisateur sur Starter,
 * ou un 6ème sur Business.
 */
export function canAddUser(
    plan: SubscriptionPlan,
    currentUserCount: number
): boolean {
    const config = SUBSCRIPTION_CONFIG[plan]
    const maxUsers = config.userPricing.maxUsers

    // Premium n'a pas de limite
    if (maxUsers === 'unlimited') {
        return true
    }

    // Vérifier si on est en dessous du maximum
    return currentUserCount < maxUsers
}

/**
 * Retourne le nombre d'utilisateurs supplémentaires encore disponibles
 *
 * Cette fonction est utile pour afficher à l'utilisateur combien
 * d'utilisateurs il peut encore ajouter avant d'atteindre sa limite.
 */
export function getRemainingUserSlots(
    plan: SubscriptionPlan,
    currentUserCount: number
): number | 'unlimited' {
    const config = SUBSCRIPTION_CONFIG[plan]
    const maxUsers = config.userPricing.maxUsers

    // Premium n'a pas de limite
    if (maxUsers === 'unlimited') {
        return 'unlimited'
    }

    // Calculer combien de slots restent
    return Math.max(0, maxUsers - currentUserCount)
}

/**
 * Génère un résumé détaillé de la facturation
 */
export function getPricingBreakdown(
    plan: SubscriptionPlan,
    userCount: number,
    billingCycle: BillingCycle
) {
    const config = SUBSCRIPTION_CONFIG[plan]
    const basePrice = config.baseMonthlyPrice

    // Le nombre d'utilisateurs supplémentaires est userCount - 1
    // car l'admin est déjà inclus dans le prix de base
    const extraUsers = Math.max(0, userCount - 1)

    const extraUsersCost = calculateExtraUsersCost(plan, userCount)
    const monthlyTotal = calculateMonthlyPrice(plan, userCount)
    const totalPrice = calculateTotalPrice(plan, userCount, billingCycle)
    const savings = calculateSavings(plan, userCount, billingCycle)

    return {
        planName: config.name,
        basePrice, // Prix pour l'admin seul
        currentUsers: userCount,
        extraUsers, // Nombre d'users au-delà de l'admin
        pricePerExtraUser: config.userPricing.pricePerExtraUser,
        extraUsersCost, // Coût total des users supplémentaires
        monthlyTotal, // Total mensuel (base + extra)
        billingCycle,
        totalBeforeDiscount: monthlyTotal * billingCycle,
        discount: savings,
        totalPrice, // Prix final avec réduction de cycle
        maxUsers: config.userPricing.maxUsers,
        remainingSlots: getRemainingUserSlots(plan, userCount),
    }
}

// Garder les autres fonctions utilitaires existantes
export function formatPrice(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'XAF',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount)
}

export function getPlanConfig(plan: SubscriptionPlan): CompletePlanConfig {
    return SUBSCRIPTION_CONFIG[plan]
}

export function getAllPlans(): SubscriptionPlan[] {
    return ['starter', 'business', 'premium']
}

export function comparePlans(
    plan1: SubscriptionPlan,
    plan2: SubscriptionPlan
): -1 | 0 | 1 {
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

// Export pour compatibilité avec subscription-checker
export const PLAN_FEATURES = Object.entries(SUBSCRIPTION_CONFIG).reduce(
    (acc, [plan, config]) => {
        acc[plan as SubscriptionPlan] = {
            ...config.limits,
            ...config.features,
            // Pour compatibilité : max_users correspond au nombre maximum d'utilisateurs
            max_users: config.userPricing.maxUsers === 'unlimited'
                ? 999
                : config.userPricing.maxUsers,
        }
        return acc
    },
    {} as Record<
        SubscriptionPlan,
        CompletePlanConfig['limits'] & CompletePlanConfig['features'] & { max_users: number }
    >
)

export const FEATURE_LABELS: Record<FeatureKey, string> = {
    max_tables: 'Nombre maximum de tables',
    max_products: 'Nombre maximum de produits',
    max_categories: 'Nombre maximum de catégories',
    max_orders_per_day: 'Commandes par jour',
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
    warehouse_module: 'Module entrepôt',
    caisse_module: 'Module caisse',
}

export const FEATURE_DESCRIPTIONS: Record<FeatureKey, string> = {
    max_tables: 'Nombre de tables QR que vous pouvez créer',
    max_products: 'Nombre de produits dans votre menu',
    max_categories: 'Nombre de catégories de produits',
    max_orders_per_day: 'Limite quotidienne de commandes',
    kitchen_display: 'Écran de cuisine en temps réel',
    basic_stats: 'Tableaux de bord avec ventes du jour',
    advanced_stats: 'Analyses détaillées et graphiques avancés',
    stock_management: 'Suivi complet des stocks',
    stock_alerts: 'Notifications quand le stock est bas',
    data_export: 'Exporter vos données en Excel/CSV',
    mobile_payment: 'Paiements Airtel Money et Moov Money',
    multi_restaurants: 'Gérer plusieurs établissements',
    custom_branding: 'Logo et couleurs personnalisés',
    priority_support: 'Assistance prioritaire',
    api_access: 'Accès à l\'API REST',
    warehouse_module: 'Module de gestion d\'entrepôt',
    caisse_module: 'Module de gestion de caisse',
}