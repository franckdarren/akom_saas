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
    /** Libellé de création accordé en genre/élision : "Nouveau plat", "Nouvelle chambre", "Nouvel article" */
    newProductLabel: string
    /** Libellé d'édition accordé en genre/élision : "Modifier le plat", "Modifier la chambre", "Modifier l'article" */
    editProductLabel: string
    /** ex: "catégorie", "rayon", "type de véhicule" */
    categoryName: string
    /** ex: "Catégorie", "Rayon", "Type" */
    categoryNameCapital: string
    /** ex: "catégories", "rayons", "types de chambre" */
    categoryNamePlural: string
    /** ex: "Catégories", "Rayons", "Types de chambre" */
    categoryNamePluralCapital: string
    /** Genre grammatical du nom de catégorie (pour accorder les articles) */
    categoryGender: 'm' | 'f'

    // ── Commandes / Transactions ─────────────────────────────
    /** ex: "commande", "réservation", "location" */
    orderName: string
    /** ex: "commandes", "réservations", "locations" */
    orderNamePlural: string
    /** ex: "Commande", "Réservation", "Location" */
    orderNameCapital: string
    /** ex: "Commandes", "Réservations", "Rendez-vous" — pluriel correct (jamais via "+ s") */
    orderNamePluralCapital: string
    /** Genre grammatical du nom de commande (pour accorder "nouvelle/nouveau") */
    orderGender: 'm' | 'f'

    // ── Points de service / Tables ───────────────────────────
    /** ex: "table", "borne", "espace", "chambre" */
    tableName: string
    /** ex: "tables", "bornes", "espaces", "chambres" */
    tableNamePlural: string
    /** ex: "Table", "Borne", "Espace", "Chambre" */
    tableNameCapital: string
    /** Genre grammatical du nom de point de service (pour accorder les articles) */
    tableGender: 'm' | 'f'

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

    // ── Statuts de commande ────────────────────────────────────
    /** Labels dynamiques pour chaque statut de commande */
    orderStatuses: {
        awaiting_payment: { label: string; filterLabel: string; description: string }
        pending:    { label: string; filterLabel: string; actionLabel: string; description: string }
        preparing:  { label: string; filterLabel: string; actionLabel: string; description: string }
        ready:      { label: string; filterLabel: string; actionLabel: string; description: string }
        delivered:  { label: string; filterLabel: string; description: string }
        cancelled:  { label: string; filterLabel: string; description: string }
    }

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
        productNamePlural: 'produits',
        productNameCapital: 'Produit',
        newProductLabel: 'Nouveau produit',
        editProductLabel: 'Modifier le produit',
        categoryName: 'catégorie',
        categoryNameCapital: 'Catégorie',
        categoryNamePlural: 'catégories',
        categoryNamePluralCapital: 'Catégories',
        categoryGender: 'f',
        orderName: 'commande',
        orderNamePlural: 'commandes',
        orderNameCapital: 'Commande',
        orderNamePluralCapital: 'Commandes',
        orderGender: 'f',
        tableName: 'table',
        tableNamePlural: 'tables',
        tableNameCapital: 'Table',
        tableGender: 'f',
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
        orderStatuses: {
            awaiting_payment: { label: 'Attente paiement', filterLabel: 'Attente paiement', description: 'En attente du paiement' },
            pending:    { label: 'En attente', filterLabel: 'Nouvelles', actionLabel: 'Commencer', description: 'Votre commande a été reçue' },
            preparing:  { label: 'En préparation', filterLabel: 'En préparation', actionLabel: 'Marquer prête', description: 'La cuisine prépare votre commande' },
            ready:      { label: 'Prête', filterLabel: 'Prêtes', actionLabel: 'Marquer servie', description: 'Votre commande est prête à être servie' },
            delivered:  { label: 'Servie', filterLabel: 'Servies', description: 'Bon appétit !' },
            cancelled:  { label: 'Annulée', filterLabel: 'Annulées', description: 'Cette commande a été annulée' },
        },
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
        newProductLabel: 'Nouvel article',
        editProductLabel: "Modifier l'article",
        categoryName: 'rayon',
        categoryNameCapital: 'Rayon',
        categoryNamePlural: 'rayons',
        categoryNamePluralCapital: 'Rayons',
        categoryGender: 'm',
        orderName: 'commande',
        orderNamePlural: 'commandes',
        orderNameCapital: 'Commande',
        orderNamePluralCapital: 'Commandes',
        orderGender: 'f',
        tableName: 'caisse',
        tableNamePlural: 'caisses',
        tableNameCapital: 'Caisse',
        tableGender: 'f',
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
        orderStatuses: {
            awaiting_payment: { label: 'Attente paiement', filterLabel: 'Attente paiement', description: 'En attente du paiement' },
            pending:    { label: 'En attente', filterLabel: 'Nouvelles', actionLabel: 'Préparer', description: 'Votre commande a été reçue' },
            preparing:  { label: 'En préparation', filterLabel: 'En préparation', actionLabel: 'Prête à retirer', description: 'Votre commande est en préparation' },
            ready:      { label: 'Prête', filterLabel: 'Prêtes', actionLabel: 'Marquer remise', description: 'Votre commande est prête à retirer' },
            delivered:  { label: 'Remise', filterLabel: 'Remises', description: 'Bonne utilisation !' },
            cancelled:  { label: 'Annulée', filterLabel: 'Annulées', description: 'Cette commande a été annulée' },
        },
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
        newProductLabel: 'Nouveau trajet',
        editProductLabel: 'Modifier le trajet',
        categoryName: 'ligne',
        categoryNameCapital: 'Ligne',
        categoryNamePlural: 'lignes',
        categoryNamePluralCapital: 'Lignes',
        categoryGender: 'f',
        orderName: 'réservation',
        orderNamePlural: 'réservations',
        orderNameCapital: 'Réservation',
        orderNamePluralCapital: 'Réservations',
        orderGender: 'f',
        tableName: 'guichet',
        tableNamePlural: 'guichets',
        tableNameCapital: 'Guichet',
        tableGender: 'm',
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
        orderStatuses: {
            awaiting_payment: { label: 'Attente paiement', filterLabel: 'Attente paiement', description: 'En attente du paiement' },
            pending:    { label: 'En attente', filterLabel: 'Nouvelles', actionLabel: 'Confirmer', description: 'Votre réservation a été reçue' },
            preparing:  { label: 'Confirmée', filterLabel: 'Confirmées', actionLabel: 'Prêt à embarquer', description: 'Votre réservation est confirmée' },
            ready:      { label: 'Prêt à embarquer', filterLabel: 'Embarquement', actionLabel: 'Marquer embarqué', description: 'Embarquement en cours' },
            delivered:  { label: 'Embarqué', filterLabel: 'Embarqués', description: 'Bon voyage !' },
            cancelled:  { label: 'Annulée', filterLabel: 'Annulées', description: 'Cette réservation a été annulée' },
        },
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
        newProductLabel: 'Nouveau véhicule',
        editProductLabel: 'Modifier le véhicule',
        categoryName: 'catégorie',
        categoryNameCapital: 'Catégorie',
        categoryNamePlural: 'catégories',
        categoryNamePluralCapital: 'Catégories',
        categoryGender: 'f',
        orderName: 'location',
        orderNamePlural: 'locations',
        orderNameCapital: 'Location',
        orderNamePluralCapital: 'Locations',
        orderGender: 'f',
        tableName: 'espace',
        tableNamePlural: 'espaces',
        tableNameCapital: 'Espace',
        tableGender: 'm',
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
        orderStatuses: {
            awaiting_payment: { label: 'Attente paiement', filterLabel: 'Attente paiement', description: 'En attente du paiement' },
            pending:    { label: 'En attente', filterLabel: 'Nouvelles', actionLabel: 'Confirmer', description: 'Votre location a été reçue' },
            preparing:  { label: 'Confirmée', filterLabel: 'Confirmées', actionLabel: 'Disponible', description: 'Votre location est confirmée' },
            ready:      { label: 'Prêt', filterLabel: 'Disponibles', actionLabel: 'Marquer récupéré', description: 'Votre véhicule est disponible' },
            delivered:  { label: 'Récupéré', filterLabel: 'Récupérés', description: 'Bonne route !' },
            cancelled:  { label: 'Annulée', filterLabel: 'Annulées', description: 'Cette location a été annulée' },
        },
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
        newProductLabel: 'Nouveau service',
        editProductLabel: 'Modifier le service',
        categoryName: 'catégorie',
        categoryNameCapital: 'Catégorie',
        categoryNamePlural: 'catégories',
        categoryNamePluralCapital: 'Catégories',
        categoryGender: 'f',
        orderName: 'réservation',
        orderNamePlural: 'réservations',
        orderNameCapital: 'Réservation',
        orderNamePluralCapital: 'Réservations',
        orderGender: 'f',
        tableName: 'espace',
        tableNamePlural: 'espaces',
        tableNameCapital: 'Espace',
        tableGender: 'm',
        customerName: 'client',
        customerNameCapital: 'Client',
        coverImageLabel: "Photo de l'entreprise",
        logoLabel: "Logo de l'entreprise",
        settingsTitle: "Paramètres de l'entreprise",
        nameFieldLabel: "Nom de l'entreprise",
        onboardingTitle: 'Créer mon entreprise de services',
        onboardingSubtitle: 'Gérez vos services et réservations facilement',
        onboardingNameLabel: "Nom de l'entreprise",
        onboardingNamePlaceholder: 'ex : TechLoc, Services Pro...',
        orderStatuses: {
            awaiting_payment: { label: 'Attente paiement', filterLabel: 'Attente paiement', description: 'En attente du paiement' },
            pending:    { label: 'En attente', filterLabel: 'Nouvelles', actionLabel: 'Démarrer', description: 'Votre réservation a été reçue' },
            preparing:  { label: 'En cours', filterLabel: 'En cours', actionLabel: 'Terminé', description: 'Votre prestation est en cours' },
            ready:      { label: 'Terminé', filterLabel: 'Terminés', actionLabel: 'Marquer remis', description: 'Votre prestation est terminée' },
            delivered:  { label: 'Remis', filterLabel: 'Remis', description: 'Merci !' },
            cancelled:  { label: 'Annulée', filterLabel: 'Annulées', description: 'Cette réservation a été annulée' },
        },
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
        newProductLabel: 'Nouvelle chambre',
        editProductLabel: 'Modifier la chambre',
        categoryName: 'type de chambre',
        categoryNameCapital: 'Type de chambre',
        categoryNamePlural: 'types de chambre',
        categoryNamePluralCapital: 'Types de chambre',
        categoryGender: 'm',
        orderName: 'réservation',
        orderNamePlural: 'réservations',
        orderNameCapital: 'Réservation',
        orderNamePluralCapital: 'Réservations',
        orderGender: 'f',
        tableName: 'chambre',
        tableNamePlural: 'chambres',
        tableNameCapital: 'Chambre',
        tableGender: 'f',
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
        orderStatuses: {
            awaiting_payment: { label: 'Attente paiement', filterLabel: 'Attente paiement', description: 'En attente du paiement' },
            pending:    { label: 'En attente', filterLabel: 'Nouvelles', actionLabel: 'Préparer', description: 'Votre réservation a été reçue' },
            preparing:  { label: 'En préparation', filterLabel: 'En préparation', actionLabel: 'Prête', description: 'Votre chambre est en préparation' },
            ready:      { label: 'Prête', filterLabel: 'Prêtes', actionLabel: 'Check-in', description: 'Votre chambre est prête' },
            delivered:  { label: 'Check-out', filterLabel: 'Check-out', description: 'Merci de votre séjour !' },
            cancelled:  { label: 'Annulée', filterLabel: 'Annulées', description: 'Cette réservation a été annulée' },
        },
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
        newProductLabel: 'Nouvelle prestation',
        editProductLabel: 'Modifier la prestation',
        categoryName: 'catégorie',
        categoryNameCapital: 'Catégorie',
        categoryNamePlural: 'catégories',
        categoryNamePluralCapital: 'Catégories',
        categoryGender: 'f',
        orderName: 'rendez-vous',
        orderNamePlural: 'rendez-vous',
        orderNameCapital: 'Rendez-vous',
        orderNamePluralCapital: 'Rendez-vous',
        orderGender: 'm',
        tableName: 'cabine',
        tableNamePlural: 'cabines',
        tableNameCapital: 'Cabine',
        tableGender: 'f',
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
        orderStatuses: {
            awaiting_payment: { label: 'Attente paiement', filterLabel: 'Attente paiement', description: 'En attente du paiement' },
            pending:    { label: 'En attente', filterLabel: 'Nouveaux', actionLabel: 'Démarrer', description: 'Votre rendez-vous a bien été enregistré' },
            preparing:  { label: 'En cours', filterLabel: 'En cours', actionLabel: 'Terminé', description: 'Votre prestation est en cours' },
            ready:      { label: 'Terminé', filterLabel: 'Terminés', actionLabel: 'Clôturer', description: 'Votre prestation est terminée' },
            delivered:  { label: 'Clôturé', filterLabel: 'Clôturés', description: 'Merci de votre visite !' },
            cancelled:  { label: 'Annulé', filterLabel: 'Annulés', description: 'Ce rendez-vous a été annulé' },
        },
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
        newProductLabel: 'Nouvel article',
        editProductLabel: "Modifier l'article",
        categoryName: 'catégorie',
        categoryNameCapital: 'Catégorie',
        categoryNamePlural: 'catégories',
        categoryNamePluralCapital: 'Catégories',
        categoryGender: 'f',
        orderName: 'commande',
        orderNamePlural: 'commandes',
        orderNameCapital: 'Commande',
        orderNamePluralCapital: 'Commandes',
        orderGender: 'f',
        tableName: 'espace',
        tableNamePlural: 'espaces',
        tableNameCapital: 'Espace',
        tableGender: 'm',
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
        orderStatuses: {
            awaiting_payment: { label: 'Attente paiement', filterLabel: 'Attente paiement', description: 'En attente du paiement' },
            pending:    { label: 'En attente', filterLabel: 'Nouvelles', actionLabel: 'Démarrer', description: 'Votre commande a été reçue' },
            preparing:  { label: 'En cours', filterLabel: 'En cours', actionLabel: 'Prêt', description: 'Votre commande est en cours de traitement' },
            ready:      { label: 'Prêt', filterLabel: 'Prêts', actionLabel: 'Marquer remis', description: 'Votre commande est prête' },
            delivered:  { label: 'Remis', filterLabel: 'Remis', description: 'Merci !' },
            cancelled:  { label: 'Annulée', filterLabel: 'Annulées', description: 'Cette commande a été annulée' },
        },
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

// ============================================================
// Helper statuts de commande
// ============================================================

export type OrderStatusKey = keyof ActivityLabels['orderStatuses']

/**
 * Raccourci pour obtenir le label d'un statut de commande.
 *
 * @example
 * const { label, description } = getOrderStatusLabel('retail', 'delivered')
 * // → { label: 'Remise', description: 'Bonne utilisation !' }
 */
export function getOrderStatusLabel(
    activityType: ActivityType | string | null | undefined,
    status: OrderStatusKey
) {
    return getLabels(activityType).orderStatuses[status]
}