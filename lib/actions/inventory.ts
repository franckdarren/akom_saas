'use server'

import {revalidatePath} from 'next/cache'
import prisma from '@/lib/prisma'
import {requirePermission} from '@/lib/permissions/check'
import type {InventoryScope} from '@prisma/client'

// ============================================================
// Action 1 : Créer une session d'inventaire (snapshot du stock théorique)
// ============================================================

export async function createInventorySession(input: {
    scope: InventoryScope
    label?: string
    categoryFilter?: string
}) {
    try {
        const {restaurantId, userId} = await requirePermission('stocks', 'create')

        const session = await prisma.$transaction(async (tx) => {
            const newSession = await tx.inventorySession.create({
                data: {
                    restaurantId,
                    scope: input.scope,
                    label: input.label?.trim() || null,
                    createdBy: userId,
                },
            })

            if (input.scope === 'operational') {
                const stocks = await tx.stock.findMany({
                    where: {
                        restaurantId,
                        ...(input.categoryFilter ? {product: {categoryId: input.categoryFilter}} : {}),
                    },
                    select: {productId: true, quantity: true},
                })

                if (stocks.length === 0) {
                    throw new Error('Aucun produit avec suivi de stock trouvé pour ce périmètre')
                }

                await tx.inventoryLine.createMany({
                    data: stocks.map((s) => ({
                        sessionId: newSession.id,
                        restaurantId,
                        productId: s.productId,
                        expectedQty: s.quantity,
                    })),
                })
            } else {
                const warehouseStocks = await tx.warehouseStock.findMany({
                    where: {
                        restaurantId,
                        warehouseProduct: {
                            isActive: true,
                            ...(input.categoryFilter ? {category: input.categoryFilter} : {}),
                        },
                    },
                    select: {warehouseProductId: true, quantity: true, unitCost: true},
                })

                if (warehouseStocks.length === 0) {
                    throw new Error("Aucun produit d'entrepôt trouvé pour ce périmètre")
                }

                await tx.inventoryLine.createMany({
                    data: warehouseStocks.map((s) => ({
                        sessionId: newSession.id,
                        restaurantId,
                        warehouseProductId: s.warehouseProductId,
                        expectedQty: s.quantity,
                        unitCost: s.unitCost,
                    })),
                })
            }

            return newSession
        })

        revalidatePath('/dashboard/inventory')
        return {success: true, sessionId: session.id}
    } catch (error) {
        console.error('Erreur création session inventaire:', error)
        return {
            error: error instanceof Error ? error.message : "Erreur lors de la création de l'inventaire",
        }
    }
}

// ============================================================
// Action 2 : Sauvegarder un comptage (brouillon, sans impact sur le stock)
// ============================================================

export async function saveInventoryCounts(
    sessionId: string,
    counts: {lineId: string; countedQty: number}[]
) {
    try {
        const {restaurantId, userId} = await requirePermission('stocks', 'update')

        const session = await prisma.inventorySession.findFirst({
            where: {id: sessionId, restaurantId},
            select: {id: true, status: true},
        })
        if (!session) return {error: 'Session introuvable'}
        if (session.status === 'completed' || session.status === 'cancelled') {
            return {error: 'Cette session est déjà clôturée'}
        }

        await prisma.$transaction([
            ...counts.map((c) =>
                prisma.inventoryLine.updateMany({
                    where: {id: c.lineId, sessionId},
                    data: {countedQty: c.countedQty, countedBy: userId, countedAt: new Date()},
                })
            ),
            prisma.inventorySession.update({
                where: {id: sessionId},
                data: {status: 'in_progress'},
            }),
        ])

        revalidatePath(`/dashboard/inventory/${sessionId}`)
        return {success: true}
    } catch (error) {
        console.error('Erreur sauvegarde comptage:', error)
        return {error: 'Erreur lors de la sauvegarde du comptage'}
    }
}

// ============================================================
// Action 3 : Valider l'inventaire (applique les écarts au stock réel)
// ============================================================

export async function completeInventorySession(sessionId: string) {
    try {
        const {restaurantId, userId} = await requirePermission('stocks', 'update')

        const session = await prisma.inventorySession.findFirst({
            where: {id: sessionId, restaurantId},
            include: {lines: true},
        })
        if (!session) return {error: 'Session introuvable'}
        if (session.status === 'completed') return {error: 'Cette session est déjà validée'}
        if (session.status === 'cancelled') return {error: 'Cette session a été annulée'}

        const reason = `Inventaire #${session.id.slice(0, 8)}`

        await prisma.$transaction(async (tx) => {
            for (const line of session.lines) {
                if (line.countedQty === null) continue

                const counted = Number(line.countedQty)
                const expected = Number(line.expectedQty)
                const gap = counted - expected
                if (gap === 0) continue

                if (session.scope === 'operational' && line.productId) {
                    await tx.stock.update({
                        where: {restaurantId_productId: {restaurantId, productId: line.productId}},
                        data: {quantity: counted},
                    })
                    await tx.stockMovement.create({
                        data: {
                            restaurantId,
                            productId: line.productId,
                            userId,
                            type: 'adjustment',
                            quantity: gap,
                            previousQty: expected,
                            newQty: counted,
                            reason,
                        },
                    })
                    await tx.product.update({
                        where: {id: line.productId},
                        data: {isAvailable: counted > 0},
                    })
                } else if (session.scope === 'warehouse' && line.warehouseProductId) {
                    await tx.warehouseStock.update({
                        where: {
                            restaurantId_warehouseProductId: {
                                restaurantId,
                                warehouseProductId: line.warehouseProductId,
                            },
                        },
                        data: {quantity: counted, lastInventoryDate: new Date()},
                    })
                    await tx.warehouseMovement.create({
                        data: {
                            restaurantId,
                            warehouseProductId: line.warehouseProductId,
                            movementType: 'adjustment',
                            quantity: gap,
                            previousQty: expected,
                            newQty: counted,
                            reason,
                            performedBy: userId,
                        },
                    })
                }
            }

            await tx.inventorySession.update({
                where: {id: sessionId},
                data: {status: 'completed', completedAt: new Date(), completedBy: userId},
            })
        })

        revalidatePath('/dashboard/inventory')
        revalidatePath(`/dashboard/inventory/${sessionId}`)
        revalidatePath(session.scope === 'operational' ? '/dashboard/stocks' : '/dashboard/warehouse')

        return {success: true}
    } catch (error) {
        console.error('Erreur validation inventaire:', error)
        return {error: "Erreur lors de la validation de l'inventaire"}
    }
}

// ============================================================
// Action 4 : Annuler une session d'inventaire
// ============================================================

export async function cancelInventorySession(sessionId: string) {
    try {
        const {restaurantId} = await requirePermission('stocks', 'update')

        const result = await prisma.inventorySession.updateMany({
            where: {id: sessionId, restaurantId, status: {in: ['draft', 'in_progress']}},
            data: {status: 'cancelled'},
        })

        if (result.count === 0) {
            return {error: 'Session introuvable ou déjà clôturée'}
        }

        revalidatePath('/dashboard/inventory')
        return {success: true}
    } catch (error) {
        console.error('Erreur annulation inventaire:', error)
        return {error: "Erreur lors de l'annulation de l'inventaire"}
    }
}

// ============================================================
// Action 5 : Lister les sessions d'inventaire (historique)
// ============================================================

export async function getInventorySessions(filters?: {scope?: InventoryScope}) {
    try {
        const {restaurantId} = await requirePermission('stocks', 'read')

        const sessions = await prisma.inventorySession.findMany({
            where: {restaurantId, ...(filters?.scope ? {scope: filters.scope} : {})},
            include: {
                lines: {select: {expectedQty: true, countedQty: true, unitCost: true}},
            },
            orderBy: {createdAt: 'desc'},
            take: 50,
        })

        const data = sessions.map((session) => {
            const countedLines = session.lines.filter((l) => l.countedQty !== null)
            let totalGapQty = 0
            let totalGapValue = 0
            for (const line of countedLines) {
                const gap = Number(line.countedQty) - Number(line.expectedQty)
                totalGapQty += gap
                if (line.unitCost !== null) totalGapValue += gap * Number(line.unitCost)
            }

            return {
                id: session.id,
                scope: session.scope,
                status: session.status,
                label: session.label,
                createdAt: session.createdAt,
                completedAt: session.completedAt,
                linesCount: session.lines.length,
                countedCount: countedLines.length,
                totalGapQty,
                totalGapValue,
            }
        })

        return {success: true, data}
    } catch (error) {
        console.error('Erreur récupération sessions inventaire:', error)
        return {error: 'Erreur lors de la récupération des sessions'}
    }
}

// ============================================================
// Action 6 : Détail d'une session (écran de comptage + rapport)
// ============================================================

export async function getInventorySessionDetail(sessionId: string) {
    try {
        const {restaurantId} = await requirePermission('stocks', 'read')

        const session = await prisma.inventorySession.findFirst({
            where: {id: sessionId, restaurantId},
            include: {
                lines: {
                    include: {
                        product: {select: {id: true, name: true}},
                        warehouseProduct: {select: {id: true, name: true, storageUnit: true}},
                    },
                    orderBy: {id: 'asc'},
                },
            },
        })

        if (!session) return {error: 'Session introuvable'}

        return {success: true, data: session}
    } catch (error) {
        console.error('Erreur récupération détail inventaire:', error)
        return {error: 'Erreur lors de la récupération de la session'}
    }
}
