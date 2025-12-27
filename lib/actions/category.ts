// lib/actions/category.ts
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'

interface CategoryData {
    name: string
    description?: string
}

// Récupérer le restaurant de l'utilisateur connecté
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

        await prisma.category.delete({
            where: { id, restaurantId },
        })

        revalidatePath('/dashboard/menu/categories')
        return { success: true }
    } catch (error) {
        console.error('Erreur suppression catégorie:', error)
        return { error: 'Erreur lors de la suppression de la catégorie' }
    }
}