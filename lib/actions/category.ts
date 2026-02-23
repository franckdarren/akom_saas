// lib/actions/categories.ts
'use server'

import {revalidatePath} from 'next/cache'
import {createClient} from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import {capitalizeFirst, formatDescription} from '@/lib/utils/format-text'
import {checkQuota} from '@/lib/services/subscription-checker'

interface CategoryData {
    name: string
    description?: string
}

// -----------------------------
// Typage correct du callback tx
// -----------------------------
type PrismaTx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0]

// ============================================================
// Récupérer le restaurant de l'utilisateur connecté
// ============================================================
async function getCurrentRestaurantId() {
    const supabase = await createClient()
    const {
        data: {user},
    } = await supabase.auth.getUser()

    if (!user) throw new Error('Non authentifié')

    const restaurantUser = await prisma.restaurantUser.findFirst({
        where: {userId: user.id},
        select: {restaurantId: true},
    })

    if (!restaurantUser) throw new Error('Aucun restaurant trouvé')

    return restaurantUser.restaurantId
}

// ============================================================
// Créer une catégorie
// ============================================================
/**
 * Crée une nouvelle catégorie
 *
 * PROTECTION PAR QUOTA :
 * ======================
 * Avant de créer la catégorie, on vérifie que le restaurant
 * n'a pas atteint sa limite de catégories selon son plan d'abonnement.
 *
 * Si la limite est atteinte, la création est bloquée et un message
 * d'erreur explicite est retourné avec une suggestion d'upgrade.
 *
 * @param data - Données de la catégorie à créer
 * @returns Object avec success et category, ou error
 */
export async function createCategory(data: CategoryData) {
    try {
        const restaurantId = await getCurrentRestaurantId()

        // ============================================================
        // NOUVEAU : Vérifier le quota de catégories
        // ============================================================

        const quotaCheck = await checkQuota(restaurantId, 'max_categories')

        if (!quotaCheck.allowed) {
            // La limite est atteinte, bloquer la création
            return {
                success: false,
                error: quotaCheck.reason || 'Limite de catégories atteinte',
                quotaExceeded: true, // Flag pour permettre à l'UI de gérer différemment
                currentUsage: quotaCheck.currentUsage,
                limit: quotaCheck.limit,
            }
        }

        // ============================================================
        // Si le quota est OK, procéder à la création normale
        // ============================================================

        // Récupérer la position maximale actuelle
        const maxPosition = await prisma.category.aggregate({
            where: {restaurantId},
            _max: {position: true},
        })

        // Créer la catégorie
        const category = await prisma.category.create({
            data: {
                restaurantId,
                name: capitalizeFirst(data.name),
                description: data.description ? formatDescription(data.description) : null,
                position: (maxPosition._max.position || 0) + 1,
                isActive: true,
            },
        })

        revalidatePath('/dashboard/menu/categories')

        return {
            success: true,
            category,
            message: 'Catégorie créée avec succès',
        }
    } catch (error) {
        console.error('Erreur création catégorie:', error)
        return {
            success: false,
            error: 'Erreur lors de la création de la catégorie'
        }
    }
}

// ============================================================
// Modifier une catégorie
// ============================================================
/**
 * Met à jour une catégorie existante
 *
 * Note : Pas de vérification de quota ici car on modifie une catégorie
 * existante, on ne crée pas une nouvelle. Le quota n'est vérifié que
 * lors de la création.
 */
export async function updateCategory(id: string, data: CategoryData) {
    try {
        const restaurantId = await getCurrentRestaurantId()

        const category = await prisma.category.update({
            where: {id, restaurantId},
            data: {
                name: capitalizeFirst(data.name),
                description: data.description ? formatDescription(data.description) : null,
            },
        })

        revalidatePath('/dashboard/menu/categories')

        return {
            success: true,
            category,
            message: 'Catégorie mise à jour avec succès',
        }
    } catch (error) {
        console.error('Erreur mise à jour catégorie:', error)
        return {
            success: false,
            error: 'Erreur lors de la mise à jour de la catégorie'
        }
    }
}

// ============================================================
// Changer le statut d'une catégorie
// ============================================================
/**
 * Active ou désactive une catégorie
 *
 * Note : Pas de vérification de quota car changer le statut
 * ne modifie pas le nombre total de catégories.
 */
export async function toggleCategoryStatus(id: string) {
    try {
        const restaurantId = await getCurrentRestaurantId()

        const category = await prisma.category.findUnique({
            where: {id, restaurantId},
            select: {isActive: true},
        })

        if (!category) {
            return {
                success: false,
                error: 'Catégorie introuvable'
            }
        }

        await prisma.category.update({
            where: {id},
            data: {isActive: !category.isActive},
        })

        revalidatePath('/dashboard/menu/categories')

        return {
            success: true,
            message: `Catégorie ${!category.isActive ? 'activée' : 'désactivée'} avec succès`,
        }
    } catch (error) {
        console.error('Erreur toggle statut catégorie:', error)
        return {
            success: false,
            error: 'Erreur lors du changement de statut'
        }
    }
}

// ============================================================
// Supprimer une catégorie
// ============================================================
/**
 * Supprime une catégorie
 *
 * IMPORTANT : Vérifie d'abord qu'aucun produit n'est lié à cette
 * catégorie avant de permettre la suppression.
 *
 * Note : Après suppression, les positions des catégories suivantes
 * sont automatiquement réajustées pour éviter les trous dans la
 * séquence de positions.
 */
export async function deleteCategory(id: string) {
    try {
        const restaurantId = await getCurrentRestaurantId()

        // ============================================================
        // Vérifier qu'aucun produit n'est lié à cette catégorie
        // ============================================================

        const productsCount = await prisma.product.count({
            where: {categoryId: id},
        })

        if (productsCount > 0) {
            return {
                success: false,
                error: `Impossible de supprimer : ${productsCount} produit(s) sont liés à cette catégorie`,
                hasLinkedProducts: true,
                linkedProductsCount: productsCount,
            }
        }

        // ============================================================
        // Récupérer la position de la catégorie à supprimer
        // ============================================================

        const deletedCategory = await prisma.category.findUnique({
            where: {id, restaurantId},
            select: {position: true},
        })

        if (!deletedCategory) {
            return {
                success: false,
                error: 'Catégorie introuvable'
            }
        }

        // ============================================================
        // Supprimer la catégorie et réajuster les positions
        // ============================================================

        await prisma.$transaction(async (tx: PrismaTx) => {
            // Supprimer la catégorie
            await tx.category.delete({where: {id, restaurantId}})

            // Décrémenter la position de toutes les catégories suivantes
            await tx.category.updateMany({
                where: {
                    restaurantId,
                    position: {gt: deletedCategory.position},
                },
                data: {position: {decrement: 1}},
            })
        })

        revalidatePath('/dashboard/menu/categories')

        return {
            success: true,
            message: 'Catégorie supprimée avec succès',
        }
    } catch (error) {
        console.error('Erreur suppression catégorie:', error)
        return {
            success: false,
            error: 'Erreur lors de la suppression de la catégorie'
        }
    }
}

// ============================================================
// Réorganiser les catégories
// ============================================================
/**
 * Réorganise l'ordre des catégories selon un nouveau tableau d'IDs
 *
 * Note : Pas de vérification de quota car on ne fait que réorganiser
 * des catégories existantes.
 *
 * @param categoryIds - Tableau d'IDs des catégories dans le nouvel ordre
 */
export async function reorderCategories(categoryIds: string[]) {
    try {
        const restaurantId = await getCurrentRestaurantId()

        // ============================================================
        // Vérifier que toutes les catégories appartiennent au restaurant
        // ============================================================

        const categories = await prisma.category.findMany({
            where: {id: {in: categoryIds}, restaurantId},
        })

        if (categories.length !== categoryIds.length) {
            return {
                success: false,
                error: 'Certaines catégories sont invalides'
            }
        }

        // ============================================================
        // Mettre à jour les positions en une transaction
        // ============================================================

        await prisma.$transaction(async (tx: PrismaTx) => {
            for (let i = 0; i < categoryIds.length; i++) {
                await tx.category.update({
                    where: {id: categoryIds[i]},
                    data: {position: i + 1},
                })
            }
        })

        revalidatePath('/dashboard/menu/categories')

        return {
            success: true,
            message: 'Catégories réorganisées avec succès',
        }
    } catch (error) {
        console.error('Erreur réorganisation catégories:', error)
        return {
            success: false,
            error: 'Erreur lors de la réorganisation'
        }
    }
}

// ============================================================
// Déplacer une catégorie vers le haut
// ============================================================
/**
 * Déplace une catégorie d'une position vers le haut
 *
 * Échange la position avec la catégorie qui se trouve juste au-dessus.
 * Si la catégorie est déjà en première position, ne fait rien.
 */
export async function moveCategoryUp(categoryId: string) {
    try {
        const restaurantId = await getCurrentRestaurantId()

        const category = await prisma.category.findUnique({
            where: {id: categoryId, restaurantId},
            select: {position: true},
        })

        if (!category) {
            return {
                success: false,
                error: 'Catégorie introuvable'
            }
        }

        // Si déjà en première position, ne rien faire
        if (category.position <= 1) {
            return {
                success: true,
                message: 'La catégorie est déjà en première position',
            }
        }

        // Trouver la catégorie juste au-dessus
        const categoryAbove = await prisma.category.findFirst({
            where: {restaurantId, position: category.position - 1},
        })

        if (!categoryAbove) {
            return {
                success: false,
                error: 'Aucune catégorie au-dessus'
            }
        }

        // Échanger les positions
        await prisma.$transaction(async (tx: PrismaTx) => {
            await tx.category.update({
                where: {id: categoryId},
                data: {position: category.position - 1},
            })
            await tx.category.update({
                where: {id: categoryAbove.id},
                data: {position: categoryAbove.position + 1},
            })
        })

        revalidatePath('/dashboard/menu/categories')

        return {
            success: true,
            message: 'Catégorie déplacée vers le haut',
        }
    } catch (error) {
        console.error('Erreur déplacement catégorie:', error)
        return {
            success: false,
            error: 'Erreur lors du déplacement'
        }
    }
}

// ============================================================
// Déplacer une catégorie vers le bas
// ============================================================
/**
 * Déplace une catégorie d'une position vers le bas
 *
 * Échange la position avec la catégorie qui se trouve juste en-dessous.
 * Si la catégorie est déjà en dernière position, ne fait rien.
 */
export async function moveCategoryDown(categoryId: string) {
    try {
        const restaurantId = await getCurrentRestaurantId()

        const category = await prisma.category.findUnique({
            where: {id: categoryId, restaurantId},
            select: {position: true},
        })

        if (!category) {
            return {
                success: false,
                error: 'Catégorie introuvable'
            }
        }

        // Trouver la catégorie juste en-dessous
        const categoryBelow = await prisma.category.findFirst({
            where: {restaurantId, position: category.position + 1},
        })

        // Si pas de catégorie en-dessous, déjà en dernière position
        if (!categoryBelow) {
            return {
                success: true,
                message: 'La catégorie est déjà en dernière position',
            }
        }

        // Échanger les positions
        await prisma.$transaction(async (tx: PrismaTx) => {
            await tx.category.update({
                where: {id: categoryId},
                data: {position: category.position + 1},
            })
            await tx.category.update({
                where: {id: categoryBelow.id},
                data: {position: categoryBelow.position - 1},
            })
        })

        revalidatePath('/dashboard/menu/categories')

        return {
            success: true,
            message: 'Catégorie déplacée vers le bas',
        }
    } catch (error) {
        console.error('Erreur déplacement catégorie:', error)
        return {
            success: false,
            error: 'Erreur lors du déplacement'
        }
    }
}