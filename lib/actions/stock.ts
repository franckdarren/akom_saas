// lib/actions/stock.ts
'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { requirePermission } from '@/lib/permissions/check'
import { computeEntryUnitCost, computeNewAvgCost } from '@/lib/stock/costing'


// ============================================================
// Ajuster le stock d'un produit (entrée ou sortie manuelle)
// ============================================================

export async function adjustStock(
    productId: string,
    quantity: number,
    type: 'manual_in' | 'manual_out' | 'adjustment',
    reason?: string,
    // Valorisation, uniquement pour les entrées. Si `purchasePrice` est absent,
    // le mouvement n'est pas valorisé et le CUMP existant reste inchangé.
    costing?: { purchasePrice?: number | null; extraCosts?: number | null }
) {
    try {
        const { userId, restaurantId } = await requirePermission('stocks', 'update')

        // Récupérer le stock actuel
        const currentStock = await prisma.stock.findUnique({
            where: {
                restaurantId_productId: {
                    restaurantId,
                    productId,
                },
            },
            include: {
                product: {
                    select: { name: true },
                },
            },
        })

        if (!currentStock) {
            return { error: 'Stock introuvable' }
        }

        const previousQty = currentStock.quantity
        let newQty: number

        // Calculer la nouvelle quantité selon le type
        if (type === 'manual_in') {
            newQty = previousQty + quantity
        } else if (type === 'manual_out') {
            newQty = previousQty - quantity
            if (newQty < 0) {
                return { error: 'Stock insuffisant pour cette sortie' }
            }
        } else {
            // adjustment : on set directement la nouvelle valeur
            newQty = quantity
        }

        // ------------------------------------------------------------
        // Valorisation (CUMP)
        // ------------------------------------------------------------
        // Une seule situation fait bouger le coût de revient : une entrée
        // réelle de marchandise valorisée. Les sorties consomment le stock au
        // CUMP courant sans le modifier. Un `adjustment` à la hausse est traité
        // comme une entrée s'il est valorisé (cas du réapprovisionnement saisi
        // via un recomptage), sinon il ne touche pas au coût.
        const purchasePrice =
            costing?.purchasePrice !== undefined && costing.purchasePrice !== null
                ? Math.round(costing.purchasePrice)
                : null
        const extraCosts =
            costing?.extraCosts !== undefined && costing.extraCosts !== null
                ? Math.round(costing.extraCosts)
                : null

        if (purchasePrice !== null && purchasePrice < 0) {
            return { error: 'Le prix d\'achat ne peut pas être négatif' }
        }
        if (extraCosts !== null && extraCosts < 0) {
            return { error: 'Les frais annexes ne peuvent pas être négatifs' }
        }

        const entryQty = type === 'manual_in' ? quantity : newQty - previousQty
        const isValuedEntry = purchasePrice !== null && entryQty > 0

        const entryUnitCost = isValuedEntry
            ? computeEntryUnitCost(purchasePrice, extraCosts, entryQty)
            : null

        const newAvgCost = computeNewAvgCost(
            previousQty,
            currentStock.avgCost,
            entryQty,
            entryUnitCost
        )

        // Mettre à jour le stock et créer le mouvement dans une transaction
        await prisma.$transaction(async (tx) => {
            // Mettre à jour le stock
            await tx.stock.update({
                where: {
                    restaurantId_productId: {
                        restaurantId,
                        productId,
                    },
                },
                data: {
                    quantity: newQty,
                    ...(entryUnitCost !== null
                        ? { avgCost: newAvgCost, lastPurchasePrice: entryUnitCost }
                        : {}),
                },
            })

            // Créer le mouvement
            await tx.stockMovement.create({
                data: {
                    restaurantId,
                    productId,
                    userId,
                    type,
                    quantity: type === 'manual_out' ? -quantity : quantity,
                    previousQty,
                    newQty,
                    reason: reason || null,
                    purchasePrice: isValuedEntry ? purchasePrice : null,
                    extraCosts: isValuedEntry ? extraCosts : null,
                    unitCost: entryUnitCost,
                    avgCostAfter: newAvgCost,
                },
            })

            // Mettre à jour la disponibilité du produit
            // Si stock > 0 → disponible, sinon indisponible
            await tx.product.update({
                where: { id: productId },
                data: { isAvailable: newQty > 0 },
            })
        })

        revalidatePath('/dashboard/stocks')
        revalidatePath('/dashboard/menu/products')
        return { success: true, newQty }
    } catch (error) {
        console.error('Erreur ajustement stock:', error)
        return { error: 'Erreur lors de l\'ajustement du stock' }
    }
}


// ============================================================
// Récupérer l'historique des mouvements d'un produit
// ============================================================

export async function getProductStockHistory(productId: string) {
    try {
        const { restaurantId } = await requirePermission('stocks', 'read')

        const movements = await prisma.stockMovement.findMany({
            where: {
                restaurantId,
                productId,
            },
            orderBy: { createdAt: 'desc' },
            take: 50, // Limiter à 50 derniers mouvements
        })

        return { success: true, movements }
    } catch (error) {
        console.error('Erreur récupération historique:', error)
        return { error: 'Erreur lors de la récupération de l\'historique' }
    }
}


// ============================================================
// Modifier le seuil d'alerte d'un produit
// ============================================================

export async function updateAlertThreshold(
    productId: string,
    threshold: number
) {
    try {
        const { restaurantId } = await requirePermission('stocks', 'update')

        // Validation
        if (threshold < 0) {
            return { error: 'Le seuil doit être un nombre positif' }
        }

        if (threshold > 1000) {
            return { error: 'Le seuil ne peut pas dépasser 1000' }
        }

        // Mettre à jour le seuil
        const stock = await prisma.stock.update({
            where: {
                restaurantId_productId: {
                    restaurantId,
                    productId,
                },
            },
            data: {
                alertThreshold: threshold,
            },
        })

        revalidatePath('/dashboard/stocks')
        revalidatePath('/dashboard/menu/products')
        return { success: true, stock }
    } catch (error) {
        console.error('Erreur mise à jour seuil:', error)
        return { error: 'Erreur lors de la mise à jour du seuil d\'alerte' }
    }
}