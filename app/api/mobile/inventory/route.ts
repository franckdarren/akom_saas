import { NextRequest, NextResponse } from 'next/server'
import { validateMobileRequest } from '@/lib/mobile-auth'
import prisma from '@/lib/prisma'

// ============================================================
// POST — Clôture d'un inventaire depuis l'app mobile
// Crée en une transaction une InventorySession (scope operational,
// status completed) avec une InventoryLine par produit compté,
// applique les écarts au stock réel et journalise les mouvements —
// équivalent de completeInventorySession() côté dashboard web.
// Body : { label?: string, entries: [{ productId: string, countedQty: number, note?: string }] }
// ============================================================
export async function POST(req: NextRequest) {
    const { ctx, error } = await validateMobileRequest(req)
    if (error) return error

    try {
        const body = await req.json()
        const { label, entries } = body as {
            label?: string
            entries?: { productId: string; countedQty: number; note?: string }[]
        }

        if (!Array.isArray(entries) || entries.length === 0) {
            return NextResponse.json({ error: 'entries est obligatoire et doit contenir au moins un produit' }, { status: 400 })
        }

        for (const entry of entries) {
            if (
                typeof entry?.productId !== 'string' ||
                typeof entry?.countedQty !== 'number' ||
                entry.countedQty < 0
            ) {
                return NextResponse.json(
                    { error: 'Chaque entrée doit avoir un productId et une countedQty entière positive' },
                    { status: 400 }
                )
            }
        }

        const productIds = entries.map((e) => e.productId)

        const stocks = await prisma.stock.findMany({
            where: { restaurantId: ctx.restaurantId, productId: { in: productIds } },
            select: { productId: true, quantity: true },
        })
        const stockByProduct = new Map(stocks.map((s) => [s.productId, s.quantity]))

        const missing = productIds.filter((id) => !stockByProduct.has(id))
        if (missing.length > 0) {
            return NextResponse.json(
                { error: 'Stock introuvable pour certains produits', productIds: missing },
                { status: 404 }
            )
        }

        const now = new Date()

        const result = await prisma.$transaction(async (tx) => {
            const session = await tx.inventorySession.create({
                data: {
                    restaurantId: ctx.restaurantId,
                    scope: 'operational',
                    status: 'completed',
                    label: label?.trim() || 'Inventaire mobile',
                    createdBy: ctx.userId,
                    completedBy: ctx.userId,
                    completedAt: now,
                },
            })

            const reason = `Inventaire mobile #${session.id.slice(0, 8)}`

            await tx.inventoryLine.createMany({
                data: entries.map((entry) => ({
                    sessionId: session.id,
                    restaurantId: ctx.restaurantId,
                    productId: entry.productId,
                    expectedQty: stockByProduct.get(entry.productId)!,
                    countedQty: Math.floor(entry.countedQty),
                    countedBy: ctx.userId,
                    countedAt: now,
                    notes: entry.note ?? null,
                })),
            })

            let adjustedCount = 0
            let totalGapQty = 0

            for (const entry of entries) {
                const expected = stockByProduct.get(entry.productId)!
                const counted = Math.floor(entry.countedQty)
                const gap = counted - expected
                totalGapQty += gap
                if (gap === 0) continue
                adjustedCount++

                await tx.stock.update({
                    where: { restaurantId_productId: { restaurantId: ctx.restaurantId, productId: entry.productId } },
                    data: { quantity: counted },
                })
                await tx.stockMovement.create({
                    data: {
                        restaurantId: ctx.restaurantId,
                        productId: entry.productId,
                        userId: ctx.userId,
                        type: 'adjustment',
                        quantity: gap,
                        previousQty: expected,
                        newQty: counted,
                        reason: entry.note ?? reason,
                    },
                })
                await tx.product.update({
                    where: { id: entry.productId },
                    data: { isAvailable: counted > 0 },
                })
            }

            return { sessionId: session.id, adjustedCount, totalGapQty }
        })

        return NextResponse.json({
            sessionId: result.sessionId,
            completedAt: now,
            linesCount: entries.length,
            adjustedCount: result.adjustedCount,
            totalGapQty: result.totalGapQty,
        })
    } catch (err) {
        console.error('POST /api/mobile/inventory:', err)
        return NextResponse.json({ error: "Erreur lors de la clôture de l'inventaire" }, { status: 500 })
    }
}
