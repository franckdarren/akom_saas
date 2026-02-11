// lib/actions/product.ts
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { capitalizeFirst, formatDescription } from '@/lib/utils/format-text'
import type { ProductType } from '@/types/product'

interface ProductData {
    name: string
    description?: string
    categoryId?: string
    familyId?: string
    
    // Type et tarification
    productType: ProductType
    price?: number | null
    includePrice: boolean
    
    // Image
    imageUrl?: string
}

// ============================================================
// Récupérer le restaurant de l'utilisateur connecté
// ============================================================

async function getCurrentRestaurantId() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Non authentifié')
    }

    const restaurantUser = await prisma.restaurantUser.findFirst({
        where: { userId: user.id },
        select: { restaurantId: true },
    })

    if (!restaurantUser) {
        throw new Error('Aucun restaurant trouvé')
    }

    return restaurantUser.restaurantId
}

// ============================================================
// Créer un produit (bien ou service)
// ============================================================

export async function createProduct(data: ProductData) {
    try {
        const restaurantId = await getCurrentRestaurantId()

        // Validation selon le type de produit
        if (data.productType === 'good') {
            // Un bien DOIT avoir un prix
            if (data.includePrice && (!data.price || data.price < 0)) {
                return { error: 'Le prix est obligatoire pour un bien' }
            }
        }

        if (data.productType === 'service') {
            // Un service peut ne pas avoir de prix (sur devis)
            if (!data.includePrice && data.price) {
                return { error: 'Un service "sur devis" ne peut pas avoir de prix' }
            }
        }

        // Déterminer has_stock selon productType
        const hasStock = data.productType === 'good'

        // Déterminer is_available selon productType
        // Services → disponibles par défaut
        // Biens → indisponibles jusqu'à ajout de stock
        const isAvailable = data.productType === 'service'

        // Formatage des données
        const formattedData = {
            name: capitalizeFirst(data.name),
            description: data.description 
                ? formatDescription(data.description) 
                : null,
            categoryId: data.categoryId || null,
            familyId: data.familyId || null,
            productType: data.productType,
            price: data.includePrice ? (data.price ? Math.floor(data.price) : null) : null,
            includePrice: data.includePrice,
            hasStock,
            imageUrl: data.imageUrl || null,
            isAvailable,
        }

        // Transaction pour créer le produit + son stock (si bien)
        const product = await prisma.$transaction(async (tx) => {
            // Créer le produit
            const newProduct = await tx.product.create({
                data: {
                    restaurantId,
                    ...formattedData,
                },
            })

            // Si c'est un bien, créer automatiquement son stock
            if (hasStock) {
                await tx.stock.create({
                    data: {
                        restaurantId,
                        productId: newProduct.id,
                        quantity: 0,
                        alertThreshold: 5,
                    },
                })
            }

            return newProduct
        })

        revalidatePath('/dashboard/menu/products')
        return { success: true, product }
    } catch (error) {
        console.error('Erreur création produit:', error)
        return { error: 'Erreur lors de la création du produit' }
    }
}

// ============================================================
// Modifier un produit
// ============================================================

export async function updateProduct(id: string, data: ProductData) {
    try {
        const restaurantId = await getCurrentRestaurantId()

        // Récupérer le produit existant
        const existingProduct = await prisma.product.findUnique({
            where: { id, restaurantId },
            select: { productType: true, hasStock: true },
        })

        if (!existingProduct) {
            return { error: 'Produit introuvable' }
        }

        // Validation selon le type de produit
        if (data.productType === 'good') {
            if (data.includePrice && (!data.price || data.price < 0)) {
                return { error: 'Le prix est obligatoire pour un bien' }
            }
        }

        if (data.productType === 'service') {
            if (!data.includePrice && data.price) {
                return { error: 'Un service "sur devis" ne peut pas avoir de prix' }
            }
        }

        // ⚠️ IMPORTANT : Vérifier le changement de type
        if (existingProduct.productType !== data.productType) {
            // Changement de type détecté
            if (data.productType === 'service' && existingProduct.hasStock) {
                // Passage de bien → service
                // Supprimer le stock existant
                await prisma.stock.delete({
                    where: { 
                        restaurantId_productId: {
                            restaurantId,
                            productId: id,
                        }
                    },
                })
            } else if (data.productType === 'good' && !existingProduct.hasStock) {
                // Passage de service → bien
                // Créer le stock
                await prisma.stock.create({
                    data: {
                        restaurantId,
                        productId: id,
                        quantity: 0,
                        alertThreshold: 5,
                    },
                })
            }
        }

        // Déterminer has_stock selon productType
        const hasStock = data.productType === 'good'

        // Formatage des données
        const formattedData = {
            name: capitalizeFirst(data.name),
            description: data.description 
                ? formatDescription(data.description) 
                : null,
            categoryId: data.categoryId || null,
            familyId: data.familyId || null,
            productType: data.productType,
            price: data.includePrice ? (data.price ? Math.floor(data.price) : null) : null,
            includePrice: data.includePrice,
            hasStock,
            imageUrl: data.imageUrl || null,
        }

        const product = await prisma.product.update({
            where: { id, restaurantId },
            data: formattedData,
        })

        revalidatePath('/dashboard/menu/products')
        return { success: true, product }
    } catch (error) {
        console.error('Erreur mise à jour produit:', error)
        return { error: 'Erreur lors de la mise à jour du produit' }
    }
}

// ============================================================
// Changer la disponibilité d'un produit
// ============================================================

export async function toggleProductAvailability(id: string) {
    try {
        const restaurantId = await getCurrentRestaurantId()

        const product = await prisma.product.findUnique({
            where: { id, restaurantId },
            select: { 
                isAvailable: true,
                productType: true,
                hasStock: true,
            },
        })

        if (!product) {
            return { error: 'Produit introuvable' }
        }

        // Si c'est un bien avec stock, vérifier qu'il a du stock avant d'activer
        if (product.productType === 'good' && product.hasStock && !product.isAvailable) {
            const stock = await prisma.stock.findUnique({
                where: {
                    restaurantId_productId: {
                        restaurantId,
                        productId: id,
                    }
                },
                select: { quantity: true },
            })

            if (stock && stock.quantity === 0) {
                return { 
                    error: 'Impossible d\'activer un produit sans stock. Ajoutez du stock d\'abord.' 
                }
            }
        }

        await prisma.product.update({
            where: { id },
            data: { isAvailable: !product.isAvailable },
        })

        revalidatePath('/dashboard/menu/products')
        return { success: true }
    } catch (error) {
        console.error('Erreur toggle disponibilité:', error)
        return { error: 'Erreur lors du changement de disponibilité' }
    }
}

// ============================================================
// Supprimer un produit
// ============================================================

export async function deleteProduct(id: string) {
    try {
        const restaurantId = await getCurrentRestaurantId()

        // Le stock sera automatiquement supprimé grâce au onDelete: Cascade
        await prisma.product.delete({
            where: { id, restaurantId },
        })

        revalidatePath('/dashboard/menu/products')
        return { success: true }
    } catch (error) {
        console.error('Erreur suppression produit:', error)
        return { error: 'Erreur lors de la suppression du produit' }
    }
}

// ============================================================
// Récupérer un produit avec toutes ses informations
// ============================================================

export async function getProductWithDetails(id: string) {
    try {
        const restaurantId = await getCurrentRestaurantId()

        const product = await prisma.product.findUnique({
            where: { id, restaurantId },
            include: {
                category: {
                    select: { id: true, name: true },
                },
                family: {
                    select: { id: true, name: true },
                },
                stock: {
                    select: { quantity: true, alertThreshold: true },
                },
            },
        })

        if (!product) {
            return { error: 'Produit introuvable' }
        }

        return { success: true, product }
    } catch (error) {
        console.error('Erreur récupération produit:', error)
        return { error: 'Erreur lors de la récupération du produit' }
    }
}