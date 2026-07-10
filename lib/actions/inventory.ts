'use server'

import {revalidatePath} from 'next/cache'
import prisma from '@/lib/prisma'
import {requirePermission} from '@/lib/permissions/check'
import {Prisma} from '@prisma/client'
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

        // Écarts à appliquer, pré-calculés hors transaction pour minimiser le temps
        // passé à tenir les verrous (voir audit perf : ex-boucle N+1 sur des centaines
        // de lignes, remplacée par des updates en masse + createMany).
        const operationalChanges = session.lines
            .filter((l) => l.countedQty !== null && l.productId)
            .map((l) => ({
                productId: l.productId as string,
                counted: Number(l.countedQty),
                expected: Number(l.expectedQty),
            }))
            .filter((c) => c.counted - c.expected !== 0)

        const warehouseChanges = session.lines
            .filter((l) => l.countedQty !== null && l.warehouseProductId)
            .map((l) => ({
                warehouseProductId: l.warehouseProductId as string,
                counted: Number(l.countedQty),
                expected: Number(l.expectedQty),
            }))
            .filter((c) => c.counted - c.expected !== 0)

        await prisma.$transaction(async (tx) => {
            if (session.scope === 'operational' && operationalChanges.length > 0) {
                const stockValues = Prisma.join(
                    operationalChanges.map((c) => Prisma.sql`(${c.productId}::uuid, ${c.counted}::int)`)
                )
                await tx.$executeRaw`
                    UPDATE stocks AS s
                    SET quantity = v.quantity
                    FROM (VALUES ${stockValues}) AS v(product_id, quantity)
                    WHERE s.restaurant_id = ${restaurantId}::uuid AND s.product_id = v.product_id
                `

                const availabilityValues = Prisma.join(
                    operationalChanges.map((c) => Prisma.sql`(${c.productId}::uuid, ${c.counted > 0})`)
                )
                await tx.$executeRaw`
                    UPDATE products AS p
                    SET is_available = v.is_available
                    FROM (VALUES ${availabilityValues}) AS v(product_id, is_available)
                    WHERE p.restaurant_id = ${restaurantId}::uuid AND p.id = v.product_id
                `

                await tx.stockMovement.createMany({
                    data: operationalChanges.map((c) => ({
                        restaurantId,
                        productId: c.productId,
                        userId,
                        type: 'adjustment',
                        quantity: c.counted - c.expected,
                        previousQty: c.expected,
                        newQty: c.counted,
                        reason,
                    })),
                })
            } else if (session.scope === 'warehouse' && warehouseChanges.length > 0) {
                const stockValues = Prisma.join(
                    warehouseChanges.map(
                        (c) => Prisma.sql`(${c.warehouseProductId}::uuid, ${c.counted}::decimal)`
                    )
                )
                await tx.$executeRaw`
                    UPDATE warehouse_stock AS s
                    SET quantity = v.quantity, last_inventory_date = now()
                    FROM (VALUES ${stockValues}) AS v(warehouse_product_id, quantity)
                    WHERE s.restaurant_id = ${restaurantId}::uuid AND s.warehouse_product_id = v.warehouse_product_id
                `

                await tx.warehouseMovement.createMany({
                    data: warehouseChanges.map((c) => ({
                        restaurantId,
                        warehouseProductId: c.warehouseProductId,
                        movementType: 'adjustment',
                        quantity: c.counted - c.expected,
                        previousQty: c.expected,
                        newQty: c.counted,
                        reason,
                        performedBy: userId,
                    })),
                })
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
