// lib/actions/table.ts
'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { requirePermission } from '@/lib/permissions/check'


// ============================================================
// Créer une table
// ============================================================

export async function createTable(number: number) {
  try {
    const { restaurantId } = await requirePermission('tables', 'create')

    // Vérifier si le numéro existe déjà
    const existing = await prisma.table.findUnique({
      where: {
        restaurantId_number: {
          restaurantId,
          number,
        },
      },
    })

    if (existing) {
      return { error: `La table ${number} existe déjà` }
    }

    const table = await prisma.table.create({
      data: {
        restaurantId,
        number,
        isActive: true,
      },
    })

    revalidatePath('/dashboard/tables')
    return { success: true, table }
  } catch (error) {
    console.error('Erreur création table:', error)
    return { error: 'Erreur lors de la création de la table' }
  }
}


// ============================================================
// Modifier le statut de la table
// ============================================================

export async function toggleTableStatus(id: string) {
  try {
    const { restaurantId } = await requirePermission('tables', 'update')

    const table = await prisma.table.findUnique({
      where: { id, restaurantId },
      select: { isActive: true },
    })

    if (!table) {
      return { error: 'Table introuvable' }
    }

    await prisma.table.update({
      where: { id },
      data: { isActive: !table.isActive },
    })

    revalidatePath('/dashboard/tables')
    return { success: true }
  } catch (error) {
    console.error('Erreur toggle statut table:', error)
    return { error: 'Erreur lors du changement de statut' }
  }
}

export async function deleteTable(id: string) {
  try {
    const { restaurantId } = await requirePermission('tables', 'delete')

    // Vérifier qu'il n'y a pas de commandes en cours
    const ordersCount = await prisma.order.count({
      where: {
        tableId: id,
        status: { in: ['pending', 'preparing', 'ready'] },
      },
    })

    if (ordersCount > 0) {
      return {
        error: `Impossible de supprimer : ${ordersCount} commande(s) en cours sur cette table`,
      }
    }

    await prisma.table.delete({
      where: { id, restaurantId },
    })

    revalidatePath('/dashboard/tables')
    return { success: true }
  } catch (error) {
    console.error('Erreur suppression table:', error)
    return { error: 'Erreur lors de la suppression de la table' }
  }
}


// ============================================================
// Récuperer le QR Code de la table
// ============================================================

export async function getTableQRCodeUrl(tableId: string) {
  try {
    const { restaurantId } = await requirePermission('tables', 'read')

    const table = await prisma.table.findUnique({
      where: { id: tableId, restaurantId },
      select: {
        number: true,
        restaurant: { select: { slug: true } },
      },
    })

    if (!table) {
      return { error: 'Table introuvable' }
    }

    // URL du menu pour cette table
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const menuUrl = `${baseUrl}/r/${table.restaurant.slug}/t/${table.number}`

    return { success: true, url: menuUrl }
  } catch (error) {
    console.error('Erreur génération URL:', error)
    return { error: 'Erreur lors de la génération de l\'URL' }
  }
}