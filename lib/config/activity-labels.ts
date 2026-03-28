// lib/config/activity-labels.ts
// ============================================================
// Configuration centrale des labels par type d'activité.
// Ce fichier est l'unique source de vérité pour tous les textes
// qui dépendent du type d'activité de la structure.
//
// Usage Server Component :
//   import { getLabels } from '@/lib/config/activity-labels'
//   const labels = getLabels(restaurant.activityType)
//
// Usage Client Component :
//   const labels = useActivityLabels() // via le hook dédié
// ============================================================

export type ActivityType =
    | 'restaurant'
    | 'retail'
    | 'transport'
    | 'vehicle_rental'
    | 'service_rental'
    | 'hotel'
    | 'beauty'
    | 'other'

export interface ActivityLabels {
    // ── Nom de la structure ──────────────────────────────────
    /** ex: "restaurant", "boutique", "agence" */
    structureName: string
    /** ex: "restaurants", "boutiques", "agences" */
    structureNamePlural: string
    /** ex: "Restaurant", "Boutique", "Agence" */
    structureNameCapital: string

    // ── Catalogue / Produits ─────────────────────────────────
    /** ex: "menu", "catalogue", "tarifs" */
    catalogName: string
    /** ex: "Menu", "Catalogue", "Tarifs" */
    catalogNameCapital: string
    /** ex: "plat", "article", "véhicule", "prestation" */
    productName: string
    /** ex: "plats", "articles", "véhicules" */
    productNamePlural: string
    /** ex: "Plat", "Article", "Véhicule" */
    productNameCapital: string
    /** ex: "catégorie", "rayon", "type de véhicule" */
    categoryName: string
    /** ex: "Catégorie", "Rayon", "Type" */
    categoryNameCapital: string

    // ── Commandes / Transactions ─────────────────────────────
    /** ex: "commande", "réservation", "location" */
    orderName: string
    /** ex: "commandes", "réservations", "locations" */
    orderNamePlural: string
    /** ex: "Commande", "Réservation", "Location" */
    orderNameCapital: string

    // ── Points de service / Tables ───────────────────────────
    /** ex: "table", "borne", "espace", "chambre" */
    tableName: string
    /** ex: "tables", "bornes", "espaces", "chambres" */
    tableNamePlural: string
    /** ex: "Table", "Borne", "Espace", "Chambre" */
    tableNameCapital: string

    // ── Clients ──────────────────────────────────────────────
    /** ex: "client", "passager", "locataire" */
    customerName: string
    /** ex: "Client", "Passager", "Locataire" */
    customerNameCapital: string

    // ── Médias ───────────────────────────────────────────────
    /** ex: "Photo du restaurant", "Photo de la boutique" */
    coverImageLabel: string
    /** ex: "Logo du restaurant", "Logo de l'agence" */
    logoLabel: string

    // ── Interface / Navigation ───────────────────────────────
    /** Titre de la page settings général */
    settingsTitle: string
    /** Label du champ nom dans les settings */
    nameFieldLabel: string

    // ── Onboarding ───────────────────────────────────────────
    /** ex: "Créer mon restaurant", "Créer ma boutique" */
    onboardingTitle: string
    /** Sous-titre du formulaire onboarding */
    onboardingSubtitle: string
    /** Label du champ nom dans l'onboarding */
    onboardingNameLabel: string
    /** Placeholder du champ nom dans l'onboarding */
    onboardingNamePlaceholder: string

    // ── Icône Lucide recommandée ─────────────────────────────
    /** Nom de l'icône lucide-react (ex: "ChefHat", "Store") */
    icon: string

    // ── Emoji ────────────────────────────────────────────────
    /** Emoji représentatif (pour le select onboarding) */
    emoji: string
}

// ============================================================
// Définition des labels pour chaque type d'activité
// ============================================================
export const ACTIVITY_LABELS: Record<ActivityType, ActivityLabels> = {
    restaurant: {
        structureName: 'restaurant',
        structureNamePlural: 'restaurants',
        structureNameCapital: 'Restaurant',
        catalogName: 'menu',
        catalogNameCapital: 'Menu',
        productName: 'produit',
        productNamePlural: 'Produits',
        productNameCapital: 'Produit',
        categoryName: 'catégorie',
        categoryNameCapital: 'Catégorie',
        orderName: 'commande',
        orderNamePlural: 'commandes',
        orderNameCapital: 'Commande',
        tableName: 'table',
        tableNamePlural: 'tables',
        tableNameCapital: 'Table',
        customerName: 'client',
        customerNameCapital: 'Client',
        coverImageLabel: 'Photo du restaurant',
        logoLabel: 'Logo du restaurant',
        settingsTitle: 'Paramètres du restaurant',
        nameFieldLabel: 'Nom du restaurant',
        onboardingTitle: 'Créer mon restaurant',
        onboardingSubtitle: 'Configurez votre espace en quelques secondes',
        onboardingNameLabel: 'Nom du restaurant',
        onboardingNamePlaceholder: 'ex : Chez Maman, Le Palmier...',
        icon: 'ChefHat',
        emoji: '🍽️',
    },

    retail: {
        structureName: 'boutique',
        structureNamePlural: 'boutiques',
        structureNameCapital: 'Boutique',
        catalogName: 'catalogue',
        catalogNameCapital: 'Catalogue',
        productName: 'article',
        productNamePlural: 'articles',
        productNameCapital: 'Article',
        categoryName: 'rayon',
        categoryNameCapital: 'Rayon',
        orderName: 'commande',
        orderNamePlural: 'commandes',
        orderNameCapital: 'Commande',
        tableName: 'caisse',
        tableNamePlural: 'caisses',
        tableNameCapital: 'Caisse',
        customerName: 'client',
        customerNameCapital: 'Client',
        coverImageLabel: 'Photo de la boutique',
        logoLabel: 'Logo de la boutique',
        settingsTitle: 'Paramètres de la boutique',
        nameFieldLabel: 'Nom de la boutique',
        onboardingTitle: 'Créer ma boutique',
        onboardingSubtitle: 'Configurez votre espace commercial',
        onboardingNameLabel: 'Nom de la boutique',
        onboardingNamePlaceholder: 'ex : Boutique Lumière, Shop Express...',
        icon: 'Store',
        emoji: '🏪',
    },

    transport: {
        structureName: 'compagnie',
        structureNamePlural: 'compagnies',
        structureNameCapital: 'Compagnie',
        catalogName: 'lignes & tarifs',
        catalogNameCapital: 'Lignes & Tarifs',
        productName: 'trajet',
        productNamePlural: 'trajets',
        productNameCapital: 'Trajet',
        categoryName: 'ligne',
        categoryNameCapital: 'Ligne',
        orderName: 'réservation',
        orderNamePlural: 'réservations',
        orderNameCapital: 'Réservation',
        tableName: 'guichet',
        tableNamePlural: 'guichets',
        tableNameCapital: 'Guichet',
        customerName: 'passager',
        customerNameCapital: 'Passager',
        coverImageLabel: 'Photo de la compagnie',
        logoLabel: 'Logo de la compagnie',
        settingsTitle: 'Paramètres de la compagnie',
        nameFieldLabel: 'Nom de la compagnie',
        onboardingTitle: 'Créer ma compagnie de transport',
        onboardingSubtitle: 'Gérez vos lignes et réservations simplement',
        onboardingNameLabel: 'Nom de la compagnie',
        onboardingNamePlaceholder: 'ex : Trans Gabon Express...',
        icon: 'Bus',
        emoji: '🚌',
    },

    vehicle_rental: {
        structureName: 'agence',
        structureNamePlural: 'agences',
        structureNameCapital: 'Agence',
        catalogName: 'catalogue véhicules',
        catalogNameCapital: 'Catalogue Véhicules',
        productName: 'véhicule',
        productNamePlural: 'véhicules',
        productNameCapital: 'Véhicule',
        categoryName: 'catégorie',
        categoryNameCapital: 'Catégorie',
        orderName: 'location',
        orderNamePlural: 'locations',
        orderNameCapital: 'Location',
        tableName: 'espace',
        tableNamePlural: 'espaces',
        tableNameCapital: 'Espace',
        customerName: 'locataire',
        customerNameCapital: 'Locataire',
        coverImageLabel: "Photo de l'agence",
        logoLabel: "Logo de l'agence",
        settingsTitle: "Paramètres de l'agence",
        nameFieldLabel: "Nom de l'agence",
        onboardingTitle: 'Créer mon agence de location',
        onboardingSubtitle: 'Gérez vos véhicules et locations facilement',
        onboardingNameLabel: "Nom de l'agence",
        onboardingNamePlaceholder: 'ex : AutoLoc Gabon, Location Express...',
        icon: 'Car',
        emoji: '🚗',
    },

    service_rental: {
        structureName: 'entreprise',
        structureNamePlural: 'entreprises',
        structureNameCapital: 'Entreprise',
        catalogName: 'catalogue services',
        catalogNameCapital: 'Catalogue Services',
        productName: 'service',
        productNamePlural: 'services',
        productNameCapital: 'Service',
        categoryName: 'catégorie',
        categoryNameCapital: 'Catégorie',
        orderName: 'réservation',
        orderNamePlural: 'réservations',
        orderNameCapital: 'Réservation',
        tableName: 'espace',
        tableNamePlural: 'espaces',
        tableNameCapital: 'Espace',
        customerName: 'client',
        customerNameCapital: 'Client',
        coverImageLabel: "Photo de l'entreprise",
        logoLabel: "Logo de l'entreprise",
        settingsTitle: "Paramètres de l'entreprise",
        nameFieldLabel: "Nom de l'entreprise",
        onboardingTitle: 'Créer mon entreprise de services',
        onboardingSubtitle: 'Gérez vos prestations et réservations facilement',
        onboardingNameLabel: "Nom de l'entreprise",
        onboardingNamePlaceholder: 'ex : TechLoc, Services Pro...',
        icon: 'Wrench',
        emoji: '🔧',
    },

    hotel: {
        structureName: 'établissement',
        structureNamePlural: 'établissements',
        structureNameCapital: 'Établissement',
        catalogName: 'catalogue chambres',
        catalogNameCapital: 'Catalogue Chambres',
        productName: 'chambre',
        productNamePlural: 'chambres',
        productNameCapital: 'Chambre',
        categoryName: 'type de chambre',
        categoryNameCapital: 'Type de chambre',
        orderName: 'réservation',
        orderNamePlural: 'réservations',
        orderNameCapital: 'Réservation',
        tableName: 'chambre',
        tableNamePlural: 'chambres',
        tableNameCapital: 'Chambre',
        customerName: 'hôte',
        customerNameCapital: 'Hôte',
        coverImageLabel: "Photo de l'établissement",
        logoLabel: "Logo de l'établissement",
        settingsTitle: "Paramètres de l'établissement",
        nameFieldLabel: "Nom de l'établissement",
        onboardingTitle: 'Créer mon établissement',
        onboardingSubtitle: 'Gérez vos chambres et réservations facilement',
        onboardingNameLabel: "Nom de l'établissement",
        onboardingNamePlaceholder: "ex : Hôtel du Lac, Auberge du Soleil...",
        icon: 'Hotel',
        emoji: '🏨',
    },

    beauty: {
        structureName: 'salon',
        structureNamePlural: 'salons',
        structureNameCapital: 'Salon',
        catalogName: 'catalogue prestations',
        catalogNameCapital: 'Catalogue Prestations',
        productName: 'prestation',
        productNamePlural: 'prestations',
        productNameCapital: 'Prestation',
        categoryName: 'catégorie',
        categoryNameCapital: 'Catégorie',
        orderName: 'rendez-vous',
        orderNamePlural: 'rendez-vous',
        orderNameCapital: 'Rendez-vous',
        tableName: 'cabine',
        tableNamePlural: 'cabines',
        tableNameCapital: 'Cabine',
        customerName: 'client',
        customerNameCapital: 'Client',
        coverImageLabel: 'Photo du salon',
        logoLabel: 'Logo du salon',
        settingsTitle: 'Paramètres du salon',
        nameFieldLabel: 'Nom du salon',
        onboardingTitle: 'Créer mon salon',
        onboardingSubtitle: 'Gérez vos prestations et rendez-vous facilement',
        onboardingNameLabel: 'Nom du salon',
        onboardingNamePlaceholder: 'ex : Salon Élégance, Beauty Studio...',
        icon: 'Scissors',
        emoji: '💅',
    },

    other: {
        structureName: 'structure',
        structureNamePlural: 'structures',
        structureNameCapital: 'Structure',
        catalogName: 'catalogue',
        catalogNameCapital: 'Catalogue',
        productName: 'article',
        productNamePlural: 'articles',
        productNameCapital: 'Article',
        categoryName: 'catégorie',
        categoryNameCapital: 'Catégorie',
        orderName: 'commande',
        orderNamePlural: 'commandes',
        orderNameCapital: 'Commande',
        tableName: 'espace',
        tableNamePlural: 'espaces',
        tableNameCapital: 'Espace',
        customerName: 'client',
        customerNameCapital: 'Client',
        coverImageLabel: 'Photo de la structure',
        logoLabel: 'Logo de la structure',
        settingsTitle: 'Paramètres de la structure',
        nameFieldLabel: 'Nom de la structure',
        onboardingTitle: 'Créer ma structure',
        onboardingSubtitle: 'Configurez votre espace en quelques secondes',
        onboardingNameLabel: 'Nom de la structure',
        onboardingNamePlaceholder: 'ex : Mon Entreprise...',
        icon: 'Building2',
        emoji: '⚙️',
    },
}

// ============================================================
// Options pour le select dans le formulaire d'onboarding
// ============================================================
export const ACTIVITY_TYPE_OPTIONS: {
    value: ActivityType
    label: string
    description: string
    emoji: string
}[] = [
    {
        value: 'restaurant',
        label: 'Restaurant / Bar / Snack',
        description: 'Restauration, café, fast-food',
        emoji: '🍽️',
    },
    {
        value: 'retail',
        label: 'Commerce / Boutique',
        description: 'Vente de produits, superette',
        emoji: '🏪',
    },
    {
        value: 'vehicle_rental',
        label: 'Location de véhicules',
        description: 'Voitures, motos, engins',
        emoji: '🚗',
    },
    {
        value: 'transport',
        label: 'Transport de personnes',
        description: 'Bus, taxi, compagnie',
        emoji: '🚌',
    },
    {
        value: 'service_rental',
        label: 'Location de matériel / services',
        description: 'Équipements, prestations',
        emoji: '🔧',
    },
    {
        value: 'hotel',
        label: 'Hôtel / Hébergement',
        description: 'Hôtel, auberge, résidence',
        emoji: '🏨',
    },
    {
        value: 'beauty',
        label: 'Salon / Spa / Beauté',
        description: 'Coiffure, esthétique, bien-être',
        emoji: '💅',
    },
    {
        value: 'other',
        label: 'Autre activité',
        description: 'Autre type de structure',
        emoji: '⚙️',
    },
]

// ============================================================
// Helper principal — à utiliser partout dans l'app
// ============================================================

/**
 * Retourne les labels correspondant au type d'activité.
 * Fallback sur 'restaurant' si le type est null/undefined.
 *
 * @example
 * // Server Component
 * const labels = getLabels(restaurant.activityType)
 * <h1>{labels.structureNameCapital}</h1>
 *
 * // Client Component → utiliser le hook useActivityLabels()
 */
export function getLabels(activityType?: ActivityType | string | null): ActivityLabels {
    if (activityType && activityType in ACTIVITY_LABELS) {
        return ACTIVITY_LABELS[activityType as ActivityType]
    }
    return ACTIVITY_LABELS['restaurant']
}