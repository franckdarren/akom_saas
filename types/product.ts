// types/product.ts

export type ProductType = 'good' | 'service'

/* =========================================================
   TYPE PRINCIPAL (modèle complet DB)
========================================================= */

export interface ProductWithDetails {
    id: string
    restaurantId: string
    categoryId: string | null
    familyId: string | null
    name: string
    description: string | null

    productType: ProductType
    price: number | null
    includePrice: boolean

    hasStock: boolean
    stockQuantity: number | null
    stockAlertThreshold: number | null

    imageUrl: string | null
    isAvailable: boolean

    createdAt: Date
    updatedAt: Date

    category?: {
        id: string
        name: string
    } | null

    family?: {
        id: string
        name: string
    } | null

    stock?: {
        quantity: number
        alertThreshold: number
    } | null
}

/* =========================================================
   TYPES CRUD
========================================================= */

export interface CreateProductData {
    name: string
    description?: string
    categoryId?: string
    familyId?: string
    productType: ProductType
    price?: number
    includePrice: boolean
    imageUrl?: string
}

export interface UpdateProductData {
    name?: string
    description?: string
    categoryId?: string
    familyId?: string
    productType?: ProductType
    price?: number | null
    includePrice?: boolean
    imageUrl?: string
}

/* =========================================================
   TYPES UTILISÉS PAR LES HELPERS (découplés du modèle DB)
========================================================= */

export type ProductPriceInput = Pick<
    ProductWithDetails,
    'price' | 'includePrice' | 'productType'
>

export type ProductAvailabilityInput = Pick<
    ProductWithDetails,
    'productType' | 'isAvailable' | 'hasStock' | 'stockQuantity' | 'stockAlertThreshold'
>

/* =========================================================
   AFFICHAGE PRIX
========================================================= */

export interface PriceDisplayOptions {
    showPrice: boolean
    price?: number
    formattedPrice?: string
    label?: string
}

export function getPriceDisplay(
    product: ProductPriceInput
): PriceDisplayOptions {
    if (!product.includePrice || product.price === null) {
        return {
            showPrice: false,
            label: 'Sur devis'
        }
    }

    const formatted = `${product.price.toLocaleString('fr-FR')} FCFA`

    if (product.productType === 'service') {
        return {
            showPrice: true,
            price: product.price,
            formattedPrice: formatted,
            label: 'À partir de'
        }
    }

    return {
        showPrice: true,
        price: product.price,
        formattedPrice: formatted
    }
}

/* =========================================================
   STATUT DISPONIBILITÉ
========================================================= */

export function getAvailabilityStatus(
    product: ProductAvailabilityInput
): {
    available: boolean
    status: string
    variant: 'default' | 'success' | 'destructive' | 'secondary'
} {
    // SERVICE → pas de gestion stock
    if (product.productType === 'service') {
        return {
            available: product.isAvailable,
            status: product.isAvailable ? 'Disponible' : 'Indisponible',
            variant: product.isAvailable ? 'success' : 'destructive'
        }
    }

    // GOOD sans gestion stock
    if (!product.hasStock) {
        return {
            available: product.isAvailable,
            status: product.isAvailable ? 'Disponible' : 'Indisponible',
            variant: product.isAvailable ? 'success' : 'destructive'
        }
    }

    const quantity = product.stockQuantity ?? 0

    if (quantity === 0) {
        return {
            available: false,
            status: 'Rupture de stock',
            variant: 'destructive'
        }
    }

    if (quantity <= (product.stockAlertThreshold ?? 5)) {
        return {
            available: true,
            status: `Stock bas (${quantity})`,
            variant: 'secondary'
        }
    }

    return {
        available: true,
        status: `En stock (${quantity})`,
        variant: 'success'
    }
}

/* =========================================================
   COMMANDE POSSIBLE ?
========================================================= */

export function canOrderProduct(
    product: ProductAvailabilityInput
): boolean {
    if (product.productType === 'service') {
        return product.isAvailable
    }

    if (!product.hasStock) {
        return product.isAvailable
    }

    return product.isAvailable && (product.stockQuantity ?? 0) > 0
}

/* =========================================================
   CONSTANTES AFFICHAGE
========================================================= */

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
    good: 'Bien',
    service: 'Service'
}

export const PRODUCT_TYPE_DESCRIPTIONS: Record<ProductType, string> = {
    good: 'Article physique avec gestion de stock',
    service: 'Prestation sans gestion de stock'
}

export const PRODUCT_TYPE_ICONS: Record<ProductType, string> = {
    good: 'Package',
    service: 'Wrench'
}
