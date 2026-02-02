'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { capitalizeFirst, formatDescription } from '@/lib/utils/format-text'

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

  if (!user) throw new Error('Non authentifié')

  const restaurantUser = await prisma.restaurantUser.findFirst({
    where: { userId: user.id },
    select: { restaurantId: true },
  })

  if (!restaurantUser) throw new Error('Aucun restaurant trouvé')

  return restaurantUser.restaurantId
}

// ============================================================
// Créer une catégorie
// ============================================================

export async function createCategory(data: CategoryData) {
  try {
    const restaurantId = await getCurrentRestaurantId()

    const maxPosition = await prisma.category.aggregate({
      where: { restaurantId },
      _max: { position: true },
    })

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
      where: { id, restaurantId },
      data: {
        name: capitalizeFirst(data.name),
        description: data.description ? formatDescription(data.description) : null,
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
// Changer le statut d'une catégorie
// ============================================================

export async function toggleCategoryStatus(id: string) {
  try {
    const restaurantId = await getCurrentRestaurantId()

    const category = await prisma.category.findUnique({
      where: { id, restaurantId },
      select: { isActive: true },
    })

    if (!category) return { error: 'Catégorie introuvable' }

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

    const productsCount = await prisma.product.count({
      where: { categoryId: id },
    })

    if (productsCount > 0) {
      return {
        error: `Impossible de supprimer : ${productsCount} produit(s) sont liés à cette catégorie`,
      }
    }

    const deletedCategory = await prisma.category.findUnique({
      where: { id, restaurantId },
      select: { position: true },
    })

    if (!deletedCategory) return { error: 'Catégorie introuvable' }

    // Transaction Prisma compatible Prisma 7.2
    await prisma.$transaction(async (tx) => {
      await tx.category.delete({ where: { id, restaurantId } })
      await tx.category.updateMany({
        where: {
          restaurantId,
          position: { gt: deletedCategory.position },
        },
        data: { position: { decrement: 1 } },
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
// Réordonner les catégories
// ============================================================

export async function reorderCategories(categoryIds: string[]) {
  try {
    const restaurantId = await getCurrentRestaurantId()

    const categories = await prisma.category.findMany({
      where: {
        id: { in: categoryIds },
        restaurantId,
      },
    })

    if (categories.length !== categoryIds.length) {
      return { error: 'Certaines catégories sont invalides' }
    }

    await prisma.$transaction(
      categoryIds.map((categoryId, index) =>
        prisma.category.update({
          where: { id: categoryId },
          data: { position: index + 1 },
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
// Déplacer une catégorie vers le haut
// ============================================================

export async function moveCategoryUp(categoryId: string) {
  try {
    const restaurantId = await getCurrentRestaurantId()

    const category = await prisma.category.findUnique({
      where: { id: categoryId, restaurantId },
      select: { position: true },
    })

    if (!category) return { error: 'Catégorie introuvable' }
    if (category.position <= 1) return { success: true }

    const categoryAbove = await prisma.category.findFirst({
      where: {
        restaurantId,
        position: category.position - 1,
      },
    })

    if (!categoryAbove) return { error: 'Aucune catégorie au-dessus' }

    await prisma.$transaction(async (tx) => {
      await tx.category.update({
        where: { id: categoryId },
        data: { position: category.position - 1 },
      })
      await tx.category.update({
        where: { id: categoryAbove.id },
        data: { position: categoryAbove.position + 1 },
      })
    })

    revalidatePath('/dashboard/menu/categories')
    return { success: true }
  } catch (error) {
    console.error('Erreur déplacement catégorie:', error)
    return { error: 'Erreur lors du déplacement' }
  }
}

// ============================================================
// Déplacer une catégorie vers le bas
// ============================================================

export async function moveCategoryDown(categoryId: string) {
  try {
    const restaurantId = await getCurrentRestaurantId()

    const category = await prisma.category.findUnique({
      where: { id: categoryId, restaurantId },
      select: { position: true },
    })

    if (!category) return { error: 'Catégorie introuvable' }

    const categoryBelow = await prisma.category.findFirst({
      where: {
        restaurantId,
        position: category.position + 1,
      },
    })

    if (!categoryBelow) return { success: true }

    await prisma.$transaction(async (tx) => {
      await tx.category.update({
        where: { id: categoryId },
        data: { position: category.position + 1 },
      })
      await tx.category.update({
        where: { id: categoryBelow.id },
        data: { position: categoryBelow.position - 1 },
      })
    })

    revalidatePath('/dashboard/menu/categories')
    return { success: true }
  } catch (error) {
    console.error('Erreur déplacement catégorie:', error)
    return { error: 'Erreur lors du déplacement' }
  }
}
