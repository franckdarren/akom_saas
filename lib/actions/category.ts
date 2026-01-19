// lib/actions/category.ts
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'

interface CategoryData {
    name: string
    description?: string
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
// Créer une catégorie
// ============================================================

export async function createCategory(data: CategoryData) {
    try {
        const restaurantId = await getCurrentRestaurantId()

        // Récupérer la position max pour placer la nouvelle catégorie à la fin
        const maxPosition = await prisma.category.aggregate({
            where: { restaurantId },
            _max: { position: true },
        })

        const category = await prisma.category.create({
            data: {
                restaurantId,
                name: data.name.trim(),
                description: data.description?.trim() || null,
                position: (maxPosition._max.position || 0) + 1,
                isActive: true,
            },
        })

        revalidatePath('/dashboard/menu/categories')
        return { success: true, category }
    } catch (error) {
        console.error('Erreur création catégorie:', error)
        return { error: 'Erreur lors de la création de la catégorie' }
    }
}


// ============================================================
// Modifier une catégorie
// ============================================================

export async function updateCategory(id: string, data: CategoryData) {
    try {
        const restaurantId = await getCurrentRestaurantId()

        const category = await prisma.category.update({
            where: {
                id,
                restaurantId, // Sécurité : s'assurer que la catégorie appartient au restaurant
            },
            data: {
                name: data.name.trim(),
                description: data.description?.trim() || null,
            },
        })

        revalidatePath('/dashboard/menu/categories')
        return { success: true, category }
    } catch (error) {
        console.error('Erreur mise à jour catégorie:', error)
        return { error: 'Erreur lors de la mise à jour de la catégorie' }
    }
}


// ============================================================
// Changer le status d'une catégorie
// ============================================================

export async function toggleCategoryStatus(id: string) {
    try {
        const restaurantId = await getCurrentRestaurantId()

        const category = await prisma.category.findUnique({
            where: { id, restaurantId },
            select: { isActive: true },
        })

        if (!category) {
            return { error: 'Catégorie introuvable' }
        }

        await prisma.category.update({
            where: { id },
            data: { isActive: !category.isActive },
        })

        revalidatePath('/dashboard/menu/categories')
        return { success: true }
    } catch (error) {
        console.error('Erreur toggle statut catégorie:', error)
        return { error: 'Erreur lors du changement de statut' }
    }
}


// ============================================================
// Supprimer une catégorie
// ============================================================

export async function deleteCategory(id: string) {
    try {
        const restaurantId = await getCurrentRestaurantId()

        // Vérifier qu'il n'y a pas de produits liés
        const productsCount = await prisma.product.count({
            where: { categoryId: id },
        })

        if (productsCount > 0) {
            return {
                error: `Impossible de supprimer : ${productsCount} produit(s) sont liés à cette catégorie`,
            }
        }

        // Récupérer la position de la catégorie supprimée
        const deletedCategory = await prisma.category.findUnique({
            where: { id, restaurantId },
            select: { position: true },
        })

        if (!deletedCategory) {
            return { error: 'Catégorie introuvable' }
        }

        // Supprimer la catégorie et réorganiser les positions dans une transaction
        await prisma.$transaction(async (tx) => {
            // Supprimer la catégorie
            await tx.category.delete({
                where: { id, restaurantId },
            })

            // Décaler toutes les catégories suivantes d'une position vers le haut
            await tx.category.updateMany({
                where: {
                    restaurantId,
                    position: { gt: deletedCategory.position },
                },
                data: {
                    position: { decrement: 1 },
                },
            })
        })

        revalidatePath('/dashboard/menu/categories')
        return { success: true }
    } catch (error) {
        console.error('Erreur suppression catégorie:', error)
        return { error: 'Erreur lors de la suppression de la catégorie' }
    }
}

// ============================================================
// NOUVELLE FONCTION : Réorganiser les catégories
// ============================================================

/**
 * Réorganise l'ordre des catégories
 * @param categoryIds - Tableau des IDs de catégories dans le nouvel ordre souhaité
 * 
 * Exemple d'utilisation :
 * categoryIds = ['uuid-desserts', 'uuid-boissons', 'uuid-plats']
 * → "Desserts" aura position 1
 * → "Boissons" aura position 2
 * → "Plats" aura position 3
 */
export async function reorderCategories(categoryIds: string[]) {
    try {
        const restaurantId = await getCurrentRestaurantId()

        // Vérifier que toutes les catégories appartiennent bien au restaurant
        const categories = await prisma.category.findMany({
            where: {
                id: { in: categoryIds },
                restaurantId,
            },
        })

        if (categories.length !== categoryIds.length) {
            return { error: 'Certaines catégories sont invalides' }
        }

        // Mettre à jour les positions dans une transaction
        // pour garantir la cohérence des données
        await prisma.$transaction(
            categoryIds.map((categoryId, index) =>
                prisma.category.update({
                    where: { id: categoryId },
                    data: { position: index + 1 }, // Position commence à 1
                })
            )
        )

        revalidatePath('/dashboard/menu/categories')
        return { success: true }
    } catch (error) {
        console.error('Erreur réorganisation catégories:', error)
        return { error: 'Erreur lors de la réorganisation' }
    }
}


// ============================================================
// NOUVELLE FONCTION : Déplacer une catégorie vers le haut
// ============================================================

/**
 * Déplace une catégorie d'une position vers le haut
 * Si elle est déjà en première position, ne fait rien
 */
export async function moveCategoryUp(categoryId: string) {
    try {
        const restaurantId = await getCurrentRestaurantId()

        const category = await prisma.category.findUnique({
            where: { id: categoryId, restaurantId },
            select: { position: true },
        })

        if (!category) {
            return { error: 'Catégorie introuvable' }
        }

        // Si déjà en première position, on ne peut pas monter
        if (category.position <= 1) {
            return { success: true } // Pas d'erreur, juste rien à faire
        }

        // Trouver la catégorie qui est juste au-dessus
        const categoryAbove = await prisma.category.findFirst({
            where: {
                restaurantId,
                position: category.position - 1,
            },
        })

        if (!categoryAbove) {
            return { error: 'Aucune catégorie au-dessus' }
        }

        // Échanger les positions dans une transaction
        await prisma.$transaction([
            prisma.category.update({
                where: { id: categoryId },
                data: { position: category.position - 1 },
            }),
            prisma.category.update({
                where: { id: categoryAbove.id },
                data: { position: categoryAbove.position + 1 },
            }),
        ])

        revalidatePath('/dashboard/menu/categories')
        return { success: true }
    } catch (error) {
        console.error('Erreur déplacement catégorie:', error)
        return { error: 'Erreur lors du déplacement' }
    }
}


// ============================================================
// NOUVELLE FONCTION : Déplacer une catégorie vers le bas
// ============================================================

/**
 * Déplace une catégorie d'une position vers le bas
 * Si elle est déjà en dernière position, ne fait rien
 */
export async function moveCategoryDown(categoryId: string) {
    try {
        const restaurantId = await getCurrentRestaurantId()

        const category = await prisma.category.findUnique({
            where: { id: categoryId, restaurantId },
            select: { position: true },
        })

        if (!category) {
            return { error: 'Catégorie introuvable' }
        }

        // Trouver la catégorie qui est juste en-dessous
        const categoryBelow = await prisma.category.findFirst({
            where: {
                restaurantId,
                position: category.position + 1,
            },
        })

        // Si aucune catégorie en dessous, on est déjà en dernière position
        if (!categoryBelow) {
            return { success: true }
        }

        // Échanger les positions dans une transaction
        await prisma.$transaction([
            prisma.category.update({
                where: { id: categoryId },
                data: { position: category.position + 1 },
            }),
            prisma.category.update({
                where: { id: categoryBelow.id },
                data: { position: categoryBelow.position - 1 },
            }),
        ])

        revalidatePath('/dashboard/menu/categories')
        return { success: true }
    } catch (error) {
        console.error('Erreur déplacement catégorie:', error)
        return { error: 'Erreur lors du déplacement' }
    }
}