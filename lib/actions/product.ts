// lib/actions/product.ts
'use server'

import {revalidatePath} from 'next/cache'
import {createClient} from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import {capitalizeFirst, formatDescription} from '@/lib/utils/format-text'
import {checkQuota} from '@/lib/services/subscription-checker'
import type {ProductType} from '@/types/product'

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
        data: {user},
    } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Non authentifié')
    }

    const restaurantUser = await prisma.restaurantUser.findFirst({
        where: {userId: user.id},
        select: {restaurantId: true},
    })

    if (!restaurantUser) {
        throw new Error('Aucun restaurant trouvé')
    }

    return restaurantUser.restaurantId
}

// ============================================================
// Créer un produit (bien ou service)
// ============================================================
/**
 * Crée un nouveau produit (bien ou service)
 *
 * PROTECTION PAR QUOTA :
 * ======================
 * Avant de créer le produit, on vérifie que le restaurant
 * n'a pas atteint sa limite de produits selon son plan d'abonnement.
 *
 * LOGIQUE MÉTIER :
 * ================
 * - Les BIENS (goods) :
 *   • Doivent avoir un prix si includePrice = true
 *   • Ont automatiquement un stock créé (initialisé à 0)
 *   • Sont indisponibles par défaut (jusqu'à ajout de stock)
 *
 * - Les SERVICES :
 *   • Peuvent être "sur devis" (includePrice = false) ou avoir un prix fixe
 *   • N'ont PAS de stock
 *   • Sont disponibles par défaut
 *
 * @param data - Données du produit à créer
 * @returns Object avec success et product, ou error
 */
export async function createProduct(data: ProductData) {
    try {
        const restaurantId = await getCurrentRestaurantId()

        // ============================================================
        // NOUVEAU : Vérifier le quota de produits
        // ============================================================

        const quotaCheck = await checkQuota(restaurantId, 'max_products')

        if (!quotaCheck.allowed) {
            // La limite est atteinte, bloquer la création
            return {
                success: false,
                error: quotaCheck.reason || 'Limite de produits atteinte',
                quotaExceeded: true,
                currentUsage: quotaCheck.currentUsage,
                limit: quotaCheck.limit,
            }
        }

        // ============================================================
        // Validation selon le type de produit
        // ============================================================

        if (data.productType === 'good') {
            if (data.includePrice && (!data.price || data.price < 0)) {
                return {
                    success: false,
                    error: 'Le prix est obligatoire pour un bien'
                }
            }
        }

        if (data.productType === 'service') {
            if (!data.includePrice && data.price) {
                return {
                    success: false,
                    error: 'Un service "sur devis" ne peut pas avoir de prix'
                }
            }
        }

        // ============================================================
        // Préparer les données formatées
        // ============================================================

        const hasStock = data.productType === 'good'

        // Services → disponibles par défaut
        // Biens → indisponibles jusqu'à ajout de stock
        const isAvailable = data.productType === 'service'

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

        // ============================================================
        // Créer le produit et son stock (si bien) en transaction
        // ============================================================

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

        return {
            success: true,
            product,
            message: 'Produit créé avec succès',
        }
    } catch (error) {
        console.error('Erreur création produit:', error)
        return {
            success: false,
            error: 'Erreur lors de la création du produit'
        }
    }
}

// ============================================================
// Modifier un produit
// ============================================================
/**
 * Met à jour un produit existant
 *
 * GESTION DU CHANGEMENT DE TYPE :
 * ================================
 * Si le type de produit change (bien ↔ service), on gère automatiquement
 * le stock associé :
 * - Bien → Service : supprime le stock
 * - Service → Bien : crée le stock (initialisé à 0)
 *
 * Note : Pas de vérification de quota car on modifie un produit existant,
 * on ne crée pas un nouveau.
 */
export async function updateProduct(id: string, data: ProductData) {
    try {
        const restaurantId = await getCurrentRestaurantId()

        // ============================================================
        // Récupérer le produit existant pour comparer le type
        // ============================================================

        const existingProduct = await prisma.product.findUnique({
            where: {id, restaurantId},
            select: {productType: true, hasStock: true},
        })

        if (!existingProduct) {
            return {
                success: false,
                error: 'Produit introuvable'
            }
        }

        // ============================================================
        // Validation selon le type de produit
        // ============================================================

        if (data.productType === 'good') {
            if (data.includePrice && (!data.price || data.price < 0)) {
                return {
                    success: false,
                    error: 'Le prix est obligatoire pour un bien'
                }
            }
        }

        if (data.productType === 'service') {
            if (!data.includePrice && data.price) {
                return {
                    success: false,
                    error: 'Un service "sur devis" ne peut pas avoir de prix'
                }
            }
        }

        // ============================================================
        // Gestion du changement de type de produit
        // ============================================================

        if (existingProduct.productType !== data.productType) {
            if (data.productType === 'service' && existingProduct.hasStock) {
                // Passage bien → service : supprimer le stock s'il existe
                const existingStock = await prisma.stock.findUnique({
                    where: {
                        restaurantId_productId: {
                            restaurantId,
                            productId: id,
                        },
                    },
                })

                if (existingStock) {
                    await prisma.stock.delete({
                        where: {
                            restaurantId_productId: {
                                restaurantId,
                                productId: id,
                            },
                        },
                    })
                }
            } else if (data.productType === 'good' && !existingProduct.hasStock) {
                // Passage service → bien : créer le stock s'il n'existe pas
                const existingStock = await prisma.stock.findUnique({
                    where: {
                        restaurantId_productId: {
                            restaurantId,
                            productId: id,
                        },
                    },
                })

                if (!existingStock) {
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
        }

        // ============================================================
        // Préparer et appliquer la mise à jour
        // ============================================================

        const hasStock = data.productType === 'good'

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
            where: {id, restaurantId},
            data: formattedData,
        })

        revalidatePath('/dashboard/menu/products')

        return {
            success: true,
            product,
            message: 'Produit mis à jour avec succès',
        }
    } catch (error) {
        console.error('Erreur mise à jour produit:', error)
        return {
            success: false,
            error: 'Erreur lors de la mise à jour du produit'
        }
    }
}

// ============================================================
// Changer la disponibilité d'un produit
// ============================================================
/**
 * Active ou désactive un produit
 *
 * PROTECTION IMPORTANTE :
 * =======================
 * Pour un BIEN avec stock, on ne peut pas l'activer s'il n'a pas de stock.
 * Cette vérification évite qu'un client ne commande un produit indisponible.
 *
 * Pour un SERVICE, pas de vérification de stock (n'en a pas).
 */
export async function toggleProductAvailability(id: string) {
    try {
        const restaurantId = await getCurrentRestaurantId()

        const product = await prisma.product.findUnique({
            where: {id, restaurantId},
            select: {
                isAvailable: true,
                productType: true,
                hasStock: true,
            },
        })

        if (!product) {
            return {
                success: false,
                error: 'Produit introuvable'
            }
        }

        // ============================================================
        // Si c'est un bien avec stock, vérifier qu'il a du stock
        // ============================================================

        if (product.productType === 'good' && product.hasStock && !product.isAvailable) {
            const stock = await prisma.stock.findUnique({
                where: {
                    restaurantId_productId: {
                        restaurantId,
                        productId: id,
                    },
                },
                select: {quantity: true},
            })

            // Guard : stock inexistant ou vide → bloquer
            if (!stock || stock.quantity === 0) {
                return {
                    success: false,
                    error: "Impossible d'activer un produit sans stock. Ajoutez du stock d'abord.",
                    noStock: true,
                }
            }
        }

        // ============================================================
        // Basculer la disponibilité
        // ============================================================

        await prisma.product.update({
            where: {id},
            data: {isAvailable: !product.isAvailable},
        })

        revalidatePath('/dashboard/menu/products')

        return {
            success: true,
            message: `Produit ${!product.isAvailable ? 'activé' : 'désactivé'} avec succès`,
        }
    } catch (error) {
        console.error('Erreur toggle disponibilité:', error)
        return {
            success: false,
            error: 'Erreur lors du changement de disponibilité'
        }
    }
}

// ============================================================
// Supprimer un produit
// ============================================================
/**
 * Supprime un produit
 *
 * Note : Le stock sera automatiquement supprimé grâce au
 * onDelete: Cascade défini dans le schéma Prisma.
 */
export async function deleteProduct(id: string) {
    try {
        const restaurantId = await getCurrentRestaurantId()

        // Le stock sera automatiquement supprimé grâce au onDelete: Cascade
        await prisma.product.delete({
            where: {id, restaurantId},
        })

        revalidatePath('/dashboard/menu/products')

        return {
            success: true,
            message: 'Produit supprimé avec succès',
        }
    } catch (error) {
        console.error('Erreur suppression produit:', error)
        return {
            success: false,
            error: 'Erreur lors de la suppression du produit'
        }
    }
}

// ============================================================
// Récupérer un produit avec toutes ses informations
// ============================================================
/**
 * Récupère un produit avec toutes ses relations
 *
 * Utile pour afficher les détails d'un produit ou préparer
 * un formulaire d'édition pré-rempli.
 */
export async function getProductWithDetails(id: string) {
    try {
        const restaurantId = await getCurrentRestaurantId()

        const product = await prisma.product.findUnique({
            where: {id, restaurantId},
            include: {
                category: {
                    select: {id: true, name: true},
                },
                family: {
                    select: {id: true, name: true},
                },
                stock: {
                    select: {quantity: true, alertThreshold: true},
                },
            },
        })

        if (!product) {
            return {
                success: false,
                error: 'Produit introuvable'
            }
        }

        return {
            success: true,
            product
        }
    } catch (error) {
        console.error('Erreur récupération produit:', error)
        return {
            success: false,
            error: 'Erreur lors de la récupération du produit'
        }
    }
}