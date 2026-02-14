import { ReactNode } from 'react'

// ============================================================
// Types de base pour le module magasin de stockage
// ============================================================

/**
 * Types d'unités de stockage possibles.
 * Ces unités représentent les emballages courants dans la restauration.
 * 
 * Important : Ceci est un type enum qui définit les valeurs possibles.
 * Il doit être défini AVANT les interfaces qui l'utilisent.
 */
export type StorageUnit =
    | 'casier'    // Casier de boissons (12, 24, 36 bouteilles)
    | 'carton'    // Carton de produits divers
    | 'palette'   // Palette pour volumes importants
    | 'sac'       // Sac (riz, farine, sucre, etc.)
    | 'bidon'     // Bidon d'huile, etc.
    | 'fût'       // Fût de bière
    | 'unité'     // Unité simple (par défaut)

/**
 * Représente un produit stocké dans le magasin/entrepôt.
 * 
 * Cette interface correspond EXACTEMENT à la table warehouse_products
 * de votre base de données. Chaque propriété ici représente une colonne
 * de cette table.
 * 
 * Les propriétés storageUnit et unitsPerStorage sont ICI car elles
 * définissent les caractéristiques intrinsèques du produit, pas de son stock.
 */
export interface WarehouseProduct {
    id: string
    restaurantId: string

    // Informations produit
    name: string
    sku: string | null
    description: string | null

    // Configuration de l'unité de stockage
    // Ces propriétés définissent COMMENT le produit est emballé
    storageUnit: string // Note : string car vient de la BDD, sera validé comme StorageUnit
    unitsPerStorage: number // Combien d'unités dans chaque emballage

    // Catégorisation et visualisation
    imageUrl: string | null
    category: string | null

    // Lien avec le stock opérationnel
    linkedProductId: string | null
    conversionRatio: number // Combien d'unités menu = 1 unité warehouse

    notes: string | null
    isActive: boolean

    createdAt: Date
    updatedAt: Date
}

/**
 * Représente le stock actuel d'un produit dans le magasin.
 * 
 * Cette interface correspond EXACTEMENT à la table warehouse_stock
 * de votre base de données.
 * 
 * IMPORTANT : Cette interface ne contient PAS storageUnit ni unitsPerStorage
 * car ces informations ne font PAS partie du stock, elles font partie
 * de la définition du produit.
 */
export interface WarehouseStock {
    id: string
    restaurantId: string
    warehouseProductId: string

    // Quantités et seuils
    quantity: number // Combien d'emballages vous avez (ex: 5 casiers)
    alertThreshold: number // À combien d'emballages vous voulez être alerté

    // Gestion de la valeur (pour comptabilité)
    unitCost: number | null // Coût d'achat par emballage
    totalValue: number | null // Valeur totale = quantity × unitCost

    lastInventoryDate: Date | null // Dernière fois qu'on a compté physiquement

    updatedAt: Date
}

/**
 * Vue enrichie combinant un produit et son stock.
 * 
 * C'est cette interface que vous utilisez dans vos composants React
 * pour afficher toutes les informations nécessaires.
 * 
 * Elle HÉRITE de WarehouseProduct (donc elle a déjà storageUnit et unitsPerStorage)
 * et AJOUTE l'objet stock séparé.
 */
export interface WarehouseProductWithStock extends WarehouseProduct {
    // L'objet stock contient UNIQUEMENT les informations de stock
    // Il ne contient PAS storageUnit ni unitsPerStorage car vous y accédez
    // directement depuis l'objet parent (le produit)
    stock: WarehouseStock
    
    // Propriété calculée pour l'UI
    isLowStock: boolean // true si stock.quantity < stock.alertThreshold
    
    // Informations sur le produit menu lié (si existe)
    linkedProduct?: {
        id: string
        name: string
        imageUrl: string | null
        currentStock: number
    }
}

/**
 * Types de mouvements possibles dans le magasin.
 * Chaque type a une signification métier spécifique.
 */
export type WarehouseMovementType =
    | 'entry'          // Entrée de stock (réception fournisseur)
    | 'exit'           // Sortie de stock (vers autre lieu)
    | 'transfer_to_ops' // Transfert vers le stock opérationnel
    | 'adjustment'     // Ajustement d'inventaire
    | 'loss'           // Perte ou casse

/**
 * Représente un mouvement de stock dans le magasin.
 * Chaque mouvement est immuable et constitue un audit trail complet.
 */
export interface WarehouseMovement {
    id: string
    restaurantId: string
    warehouseProductId: string

    movementType: WarehouseMovementType
    quantity: number

    previousQty: number
    newQty: number

    supplierName: string | null
    invoiceReference: string | null
    destination: string | null
    reason: string | null

    performedBy: string | null
    notes: string | null

    createdAt: Date

    warehouseProduct?: WarehouseProduct
    user?: {
        id: string
        email: string
    }
}

/**
 * Représente un transfert du magasin vers le stock opérationnel.
 */
export interface WarehouseToOpsTransfer {
    id: string
    restaurantId: string

    warehouseProductId: string
    warehouseQuantity: number

    opsProductId: string
    opsQuantity: number

    conversionRatio: number

    transferredBy: string | null
    notes: string | null

    createdAt: Date

    warehouseProduct?: WarehouseProduct
    opsProduct?: {
        id: string
        name: string
        imageUrl: string | null
    }
    user?: {
        id: string
        email: string
    }
}

// ============================================================
// Types pour les statistiques et vues agrégées
// ============================================================

export interface WarehouseStats {
    totalProducts: number
    totalValue: number
    lowStockCount: number
    averageStockValue: number
    lastInventoryDate: Date | null
}

export interface TransferSummary {
    id: string
    date: Date
    warehouseProductName: string
    warehouseQuantity: number
    warehouseUnit: StorageUnit
    opsProductName: string
    opsQuantity: number
    performedBy: string
    notes: string | null
}

// ============================================================
// Types pour les formulaires et validations
// ============================================================

export interface CreateWarehouseProductInput {
    name: string
    sku?: string
    description?: string
    storageUnit: StorageUnit
    unitsPerStorage: number
    category?: string
    imageUrl?: string
    linkedProductId?: string
    conversionRatio?: number
    initialQuantity?: number
    unitCost?: number
    alertThreshold?: number
}

export interface UpdateWarehouseProductInput {
    id: string
    name?: string
    sku?: string
    description?: string
    storageUnit?: StorageUnit
    unitsPerStorage?: number
    category?: string
    imageUrl?: string
    linkedProductId?: string
    conversionRatio?: number
    alertThreshold?: number
    isActive?: boolean
    notes?: string
}

export interface StockEntryInput {
    warehouseProductId: string
    quantity: number
    supplierName?: string
    invoiceReference?: string
    unitCost?: number
    notes?: string
}

export interface TransferToOpsInput {
    warehouseProductId: string
    warehouseQuantity: number
    opsProductId: string
    notes?: string
}

export interface StockAdjustmentInput {
    warehouseProductId: string
    newQuantity: number
    reason: string
}

export interface StockExitInput {
    warehouseProductId: string
    quantity: number
    destination: string
    reason?: string
    notes?: string
}

// ============================================================
// Types pour les résultats d'actions serveur
// ============================================================

export interface WarehouseActionSuccess<T = void> {
    success: true
    data?: T
    message?: string
}

export interface WarehouseActionError {
    success: false
    error: string
}

export type WarehouseActionResult<T = void> =
    | WarehouseActionSuccess<T>
    | WarehouseActionError

export interface TransferResult {
    warehouseProduct: string
    opsProduct: string
    warehouseQty: number
    opsQty: number
    conversionRatio: number
}

// ============================================================
// Types pour les filtres et recherches
// ============================================================

export interface WarehouseProductFilters {
    category?: string
    storageUnit?: StorageUnit
    lowStockOnly?: boolean
    linkedOnly?: boolean
    search?: string
}

export interface WarehouseMovementFilters {
    warehouseProductId?: string
    movementType?: WarehouseMovementType
    startDate?: Date
    endDate?: Date
    performedBy?: string
}

export type WarehouseSortOption =
    | 'name-asc'
    | 'name-desc'
    | 'quantity-asc'
    | 'quantity-desc'
    | 'value-asc'
    | 'value-desc'
    | 'updated-asc'
    | 'updated-desc'

// ============================================================
// Types pour les composants UI
// ============================================================

export interface WarehouseStatCardProps {
    title: string
    value: string | number
    icon: ReactNode
    trend?: {
        value: number
        isPositive: boolean
    }
    className?: string
}

export interface TransferModalProps {
    warehouseProduct: WarehouseProductWithStock
    onClose: () => void
    onSuccess: () => void
}

export interface WarehouseProductRowProps {
    product: WarehouseProductWithStock
    onEdit: (id: string) => void
    onTransfer: (product: WarehouseProductWithStock) => void
    onAdjust: (id: string) => void
}