'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { capitalizeFirst, formatDescription } from '@/lib/utils/format-text'

interface FamilyData {
  name: string
  description?: string
  categoryId: string
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
// Créer une famille
// ============================================================
export async function createFamily(data: FamilyData) {
  try {
    const restaurantId = await getCurrentRestaurantId()

    // Vérifier que la catégorie existe et appartient au restaurant
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
      select: { restaurantId: true },
    })

    if (!category || category.restaurantId !== restaurantId) {
      return { error: 'Catégorie introuvable ou accès refusé' }
    }

    // Calculer la position suivante au sein de cette catégorie
    const maxPosition = await prisma.family.aggregate({
      where: { 
        restaurantId,
        categoryId: data.categoryId 
      },
      _max: { position: true },
    })

    const family = await prisma.family.create({
      data: {
        restaurantId,
        categoryId: data.categoryId,
        name: capitalizeFirst(data.name),
        description: data.description ? formatDescription(data.description) : null,
        position: (maxPosition._max.position || 0) + 1,
        isActive: true,
      },
    })

    revalidatePath('/dashboard/menu/categories')
    return { success: true, family }
  } catch (error) {
    console.error('Erreur création famille:', error)
    
    // Gérer l'erreur d'unicité
    if (error instanceof Error && error.message.includes('unique_family_per_category')) {
      return { error: 'Une famille avec ce nom existe déjà dans cette catégorie' }
    }
    
    return { error: 'Erreur lors de la création de la famille' }
  }
}

// ============================================================
// Modifier une famille
// ============================================================
export async function updateFamily(id: string, data: Partial<FamilyData>) {
  try {
    const restaurantId = await getCurrentRestaurantId()

    // Si categoryId est fourni, vérifier qu'elle existe
    if (data.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: data.categoryId },
        select: { restaurantId: true },
      })

      if (!category || category.restaurantId !== restaurantId) {
        return { error: 'Catégorie introuvable ou accès refusé' }
      }
    }

    const family = await prisma.family.update({
      where: { id, restaurantId },
      data: {
        ...(data.name && { name: capitalizeFirst(data.name) }),
        ...(data.description !== undefined && { 
          description: data.description ? formatDescription(data.description) : null 
        }),
        ...(data.categoryId && { categoryId: data.categoryId }),
      },
    })

    revalidatePath('/dashboard/menu/categories')
    return { success: true, family }
  } catch (error) {
    console.error('Erreur mise à jour famille:', error)
    
    if (error instanceof Error && error.message.includes('unique_family_per_category')) {
      return { error: 'Une famille avec ce nom existe déjà dans cette catégorie' }
    }
    
    return { error: 'Erreur lors de la mise à jour de la famille' }
  }
}

// ============================================================
// Changer le statut d'une famille
// ============================================================
export async function toggleFamilyStatus(id: string) {
  try {
    const restaurantId = await getCurrentRestaurantId()

    const family = await prisma.family.findUnique({
      where: { id, restaurantId },
      select: { isActive: true },
    })

    if (!family) return { error: 'Famille introuvable' }

    await prisma.family.update({
      where: { id },
      data: { isActive: !family.isActive },
    })

    revalidatePath('/dashboard/menu/categories')
    return { success: true }
  } catch (error) {
    console.error('Erreur toggle statut famille:', error)
    return { error: 'Erreur lors du changement de statut' }
  }
}

// ============================================================
// Supprimer une famille
// ============================================================
export async function deleteFamily(id: string) {
  try {
    const restaurantId = await getCurrentRestaurantId()

    // Vérifier s'il y a des produits liés
    const productsCount = await prisma.product.count({
      where: { familyId: id },
    })

    if (productsCount > 0) {
      return {
        error: `Impossible de supprimer : ${productsCount} produit(s) sont liés à cette famille`,
      }
    }

    // Récupérer la position et la catégorie avant suppression
    const deletedFamily = await prisma.family.findUnique({
      where: { id, restaurantId },
      select: { position: true, categoryId: true },
    })

    if (!deletedFamily) return { error: 'Famille introuvable' }

    // Supprimer la famille et réorganiser les positions
    await prisma.$transaction(async (tx: PrismaTx) => {
      await tx.family.delete({ where: { id, restaurantId } })

      // Décrémenter la position des familles suivantes dans la même catégorie
      await tx.family.updateMany({
        where: {
          restaurantId,
          categoryId: deletedFamily.categoryId,
          position: { gt: deletedFamily.position },
        },
        data: { position: { decrement: 1 } },
      })
    })

    revalidatePath('/dashboard/menu/categories')
    return { success: true }
  } catch (error) {
    console.error('Erreur suppression famille:', error)
    return { error: 'Erreur lors de la suppression de la famille' }
  }
}

// ============================================================
// Déplacer une famille vers le haut (au sein de sa catégorie)
// ============================================================
export async function moveFamilyUp(familyId: string) {
  try {
    const restaurantId = await getCurrentRestaurantId()

    const family = await prisma.family.findUnique({
      where: { id: familyId, restaurantId },
      select: { position: true, categoryId: true },
    })

    if (!family) return { error: 'Famille introuvable' }
    if (family.position <= 1) return { success: true } // Déjà en première position

    // Trouver la famille au-dessus dans la même catégorie
    const familyAbove = await prisma.family.findFirst({
      where: { 
        restaurantId, 
        categoryId: family.categoryId,
        position: family.position - 1 
      },
    })

    if (!familyAbove) return { error: 'Aucune famille au-dessus' }

    // Échanger les positions
    await prisma.$transaction(async (tx: PrismaTx) => {
      await tx.family.update({
        where: { id: familyId },
        data: { position: family.position - 1 },
      })
      await tx.family.update({
        where: { id: familyAbove.id },
        data: { position: familyAbove.position + 1 },
      })
    })

    revalidatePath('/dashboard/menu/categories')
    return { success: true }
  } catch (error) {
    console.error('Erreur déplacement famille:', error)
    return { error: 'Erreur lors du déplacement' }
  }
}

// ============================================================
// Déplacer une famille vers le bas (au sein de sa catégorie)
// ============================================================
export async function moveFamilyDown(familyId: string) {
  try {
    const restaurantId = await getCurrentRestaurantId()

    const family = await prisma.family.findUnique({
      where: { id: familyId, restaurantId },
      select: { position: true, categoryId: true },
    })

    if (!family) return { error: 'Famille introuvable' }

    // Trouver la famille en dessous dans la même catégorie
    const familyBelow = await prisma.family.findFirst({
      where: { 
        restaurantId, 
        categoryId: family.categoryId,
        position: family.position + 1 
      },
    })

    if (!familyBelow) return { success: true } // Déjà en dernière position

    // Échanger les positions
    await prisma.$transaction(async (tx: PrismaTx) => {
      await tx.family.update({
        where: { id: familyId },
        data: { position: family.position + 1 },
      })
      await tx.family.update({
        where: { id: familyBelow.id },
        data: { position: familyBelow.position - 1 },
      })
    })

    revalidatePath('/dashboard/menu/categories')
    return { success: true }
  } catch (error) {
    console.error('Erreur déplacement famille:', error)
    return { error: 'Erreur lors du déplacement' }
  }
}

// ============================================================
// Récupérer toutes les familles d'une catégorie
// ============================================================
export async function getFamiliesByCategory(categoryId: string) {
  try {
    const restaurantId = await getCurrentRestaurantId()

    const families = await prisma.family.findMany({
      where: {
        restaurantId,
        categoryId,
      },
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { position: 'asc' },
    })

    return { success: true, families }
  } catch (error) {
    console.error('Erreur récupération familles:', error)
    return { error: 'Erreur lors de la récupération des familles' }
  }
}