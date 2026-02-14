import { z } from 'zod'

// ============================================================
// Schémas de validation pour le module entrepôt
// ============================================================

/**
 * Liste des unités de stockage valides.
 * Correspond au type StorageUnit dans les interfaces.
 */
export const storageUnits = [
    'casier',
    'carton',
    'palette',
    'sac',
    'bidon',
    'fût',
    'unité',
] as const

/**
 * Schéma pour créer un produit d'entrepôt.
 * Valide les données côté serveur avant insertion en base.
 */
export const createWarehouseProductSchema = z.object({
    name: z
        .string()
        .min(2, 'Le nom doit contenir au moins 2 caractères')
        .max(255, 'Le nom ne peut pas dépasser 255 caractères'),

    sku: z
        .string()
        .max(100, 'Le code SKU ne peut pas dépasser 100 caractères')
        .optional(),

    description: z
        .string()
        .max(1000, 'La description ne peut pas dépasser 1000 caractères')
        .optional(),

    storageUnit: z.enum(storageUnits).refine(Boolean, {
        message: 'Veuillez sélectionner une unité de stockage',
    }),


    unitsPerStorage: z
        .number()
        .int('Le nombre d\'unités doit être un entier')
        .min(1, 'Le nombre d\'unités doit être au moins 1')
        .max(10000, 'Le nombre d\'unités ne peut pas dépasser 10000'),

    category: z
        .string()
        .max(100, 'La catégorie ne peut pas dépasser 100 caractères')
        .optional(),

    imageUrl: z
        .string()
        .url('L\'URL de l\'image n\'est pas valide')
        .optional(),

    linkedProductId: z
        .string()
        .uuid('L\'ID du produit lié n\'est pas valide')
        .optional(),

    conversionRatio: z
        .number()
        .positive('Le ratio de conversion doit être positif')
        .max(10000, 'Le ratio de conversion est trop élevé')
        .default(1),

    initialQuantity: z
        .number()
        .min(0, 'La quantité initiale ne peut pas être négative')
        .max(100000, 'La quantité initiale est trop élevée')
        .optional(),

    unitCost: z
        .number()
        .positive('Le coût unitaire doit être positif')
        .max(10000000, 'Le coût unitaire est trop élevé')
        .optional(),

    alertThreshold: z
        .number()
        .min(0, 'Le seuil d\'alerte ne peut pas être négatif')
        .max(10000, 'Le seuil d\'alerte est trop élevé')
        .default(10),
})

/**
 * Schéma pour mettre à jour un produit d'entrepôt.
 * Tous les champs sont optionnels sauf l'ID.
 */
export const updateWarehouseProductSchema = z.object({
    id: z.string().uuid('L\'ID du produit n\'est pas valide'),

    name: z
        .string()
        .min(2, 'Le nom doit contenir au moins 2 caractères')
        .max(255, 'Le nom ne peut pas dépasser 255 caractères')
        .optional(),

    sku: z
        .string()
        .max(100, 'Le code SKU ne peut pas dépasser 100 caractères')
        .optional(),

    description: z
        .string()
        .max(1000, 'La description ne peut pas dépasser 1000 caractères')
        .optional(),

    storageUnit: z.enum(storageUnits).optional(),

    unitsPerStorage: z
        .number()
        .int('Le nombre d\'unités doit être un entier')
        .min(1, 'Le nombre d\'unités doit être au moins 1')
        .max(10000, 'Le nombre d\'unités ne peut pas dépasser 10000')
        .optional(),

    category: z
        .string()
        .max(100, 'La catégorie ne peut pas dépasser 100 caractères')
        .optional(),

    imageUrl: z
        .string()
        .url('L\'URL de l\'image n\'est pas valide')
        .optional(),

    linkedProductId: z
        .string()
        .uuid('L\'ID du produit lié n\'est pas valide')
        .optional(),

    conversionRatio: z
        .number()
        .positive('Le ratio de conversion doit être positif')
        .max(10000, 'Le ratio de conversion est trop élevé')
        .optional(),

    alertThreshold: z
        .number()
        .min(0, 'Le seuil d\'alerte ne peut pas être négatif')
        .max(10000, 'Le seuil d\'alerte est trop élevé')
        .optional(),

    isActive: z.boolean().optional(),

    notes: z
        .string()
        .max(1000, 'Les notes ne peuvent pas dépasser 1000 caractères')
        .optional(),
})

/**
 * Schéma pour une entrée de stock (réception fournisseur).
 */
export const stockEntrySchema = z.object({
    warehouseProductId: z
        .string()
        .uuid('L\'ID du produit n\'est pas valide'),

    quantity: z
        .number()
        .positive('La quantité doit être positive')
        .max(100000, 'La quantité est trop élevée'),

    supplierName: z
        .string()
        .max(255, 'Le nom du fournisseur ne peut pas dépasser 255 caractères')
        .optional(),

    invoiceReference: z
        .string()
        .max(100, 'La référence de facture ne peut pas dépasser 100 caractères')
        .optional(),

    unitCost: z
        .number()
        .positive('Le coût unitaire doit être positif')
        .max(10000000, 'Le coût unitaire est trop élevé')
        .optional(),

    notes: z
        .string()
        .max(1000, 'Les notes ne peuvent pas dépasser 1000 caractères')
        .optional(),
})

/**
 * Schéma pour un transfert vers le stock opérationnel.
 * C'est l'action la plus critique du module.
 */
export const transferToOpsSchema = z.object({
    warehouseProductId: z
        .string()
        .uuid('L\'ID du produit entrepôt n\'est pas valide'),

    warehouseQuantity: z
        .number()
        .positive('La quantité doit être positive')
        .max(100000, 'La quantité est trop élevée'),

    opsProductId: z
        .string()
        .uuid('L\'ID du produit opérationnel n\'est pas valide'),

    notes: z
        .string()
        .max(1000, 'Les notes ne peuvent pas dépasser 1000 caractères')
        .optional(),
})

/**
 * Schéma pour un ajustement d'inventaire.
 */
export const stockAdjustmentSchema = z.object({
    warehouseProductId: z
        .string()
        .uuid('L\'ID du produit n\'est pas valide'),

    newQuantity: z
        .number()
        .min(0, 'La quantité ne peut pas être négative')
        .max(100000, 'La quantité est trop élevée'),

    reason: z
        .string()
        .min(5, 'La raison doit contenir au moins 5 caractères')
        .max(500, 'La raison ne peut pas dépasser 500 caractères'),
})

/**
 * Schéma pour une sortie de stock.
 */
export const stockExitSchema = z.object({
    warehouseProductId: z
        .string()
        .uuid('L\'ID du produit n\'est pas valide'),

    quantity: z
        .number()
        .positive('La quantité doit être positive')
        .max(100000, 'La quantité est trop élevée'),

    destination: z
        .string()
        .min(2, 'La destination doit contenir au moins 2 caractères')
        .max(255, 'La destination ne peut pas dépasser 255 caractères'),

    reason: z
        .string()
        .max(500, 'La raison ne peut pas dépasser 500 caractères')
        .optional(),

    notes: z
        .string()
        .max(1000, 'Les notes ne peuvent pas dépasser 1000 caractères')
        .optional(),
})

/**
 * Type inféré pour TypeScript à partir du schéma de création.
 */
export type CreateWarehouseProductInput = z.infer<typeof createWarehouseProductSchema>

/**
 * Type inféré pour TypeScript à partir du schéma de mise à jour.
 */
export type UpdateWarehouseProductInput = z.infer<typeof updateWarehouseProductSchema>

/**
 * Type inféré pour TypeScript à partir du schéma d'entrée de stock.
 */
export type StockEntryInput = z.infer<typeof stockEntrySchema>

/**
 * Type inféré pour TypeScript à partir du schéma de transfert.
 */
export type TransferToOpsInput = z.infer<typeof transferToOpsSchema>

/**
 * Type inféré pour TypeScript à partir du schéma d'ajustement.
 */
export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>

/**
 * Type inféré pour TypeScript à partir du schéma de sortie.
 */
export type StockExitInput = z.infer<typeof stockExitSchema>