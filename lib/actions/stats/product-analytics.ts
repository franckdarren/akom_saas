// lib/actions/stats/product-analytics.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { getPeriodRange } from '@/lib/utils/period'
import type {
    TimePeriod,
    CustomPeriod,
    ProductAnalytics,
    StockMovementByStat,
    StockRotationItem,
    StockValuation,
    StockAlert,
} from '@/types/stats'

// ============================================================
// Auth interne — même pattern que les autres actions stats
// ============================================================

async function getCurrentRestaurantId(): Promise<string> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Non authentifié')

    const restaurantUser = await prisma.restaurantUser.findFirst({
        where: { userId: user.id },
        select: { restaurantId: true },
    })
    if (!restaurantUser) throw new Error('Aucun restaurant trouvé')

    return restaurantUser.restaurantId
}

// ============================================================
// ANALYTICS PRODUITS & STOCK
// ============================================================

export async function getProductAnalytics(
    period: TimePeriod,
    customPeriod?: CustomPeriod,
): Promise<ProductAnalytics> {
    const restaurantId = await getCurrentRestaurantId()
    const { startDate, endDate, previousStartDate, previousEndDate } = getPeriodRange(period, customPeriod)

    const [stocks, movementsGrouped, rotationRaw, alertsRaw, previousMovementsCount] = await Promise.all([

        // ——— Valorisation : tous les stocks avec leur produit + prix ———
        prisma.stock.findMany({
            where: { restaurantId },
            select: {
                quantity: true,
                alertThreshold: true,
                product: {
                    select: {
                        id: true,
                        name: true,
                        price: true,
                        hasStock: true,
                        isAvailable: true,
                    },
                },
            },
        }),

        // ——— Mouvements par type sur la période ———
        prisma.stockMovement.groupBy({
            by: ['type'],
            where: {
                restaurantId,
                createdAt: { gte: startDate, lte: endDate },
            },
            _count: { id: true },
            _sum: { quantity: true },
        }),

        // ——— Rotation : mouvements par produit sur la période ———
        prisma.stockMovement.groupBy({
            by: ['productId', 'type'],
            where: {
                restaurantId,
                createdAt: { gte: startDate, lte: endDate },
                type: { in: ['order_out', 'sale_manual', 'manual_in', 'purchase'] },
            },
            _sum: { quantity: true },
        }),

        // ——— Alertes de stock (ruptures / stock bas) ———
        prisma.stock.findMany({
            where: {
                restaurantId,
                quantity: { lte: prisma.stock.fields.alertThreshold },
            },
            select: {
                quantity: true,
                alertThreshold: true,
                product: {
                    select: {
                        id: true,
                        name: true,
                        category: { select: { name: true } },
                    },
                },
            },
            orderBy: { quantity: 'asc' },
        }),

        // ——— Count mouvements période précédente (N-1) ———
        prisma.stockMovement.count({
            where: {
                restaurantId,
                createdAt: { gte: previousStartDate, lte: previousEndDate },
            },
        }),
    ])

    // ——— Calcul valorisation ———
    const productsWithStock = stocks.length
    let totalValue = 0
    let productsOutOfStock = 0
    let productsInAlert = 0

    for (const s of stocks) {
        if (s.quantity === 0) {
            productsOutOfStock++
        } else if (s.quantity <= s.alertThreshold) {
            productsInAlert++
        }
        if (s.product.price != null && s.quantity > 0) {
            totalValue += s.quantity * s.product.price
        }
    }

    const valuation: StockValuation = {
        totalValue,
        productsWithStock,
        productsOutOfStock,
        productsInAlert,
    }

    // ——— Mouvements par type ———
    const movementsByType: StockMovementByStat[] = movementsGrouped.map((m) => ({
        type: m.type,
        count: m._count.id,
        totalQty: Math.abs(m._sum.quantity ?? 0),
    }))

    // ——— Rotation : agréger in/out par productId ———
    // rotationRaw est [{ productId, type, _sum.quantity }]
    const rotationMap = new Map<
        string,
        { outQty: number; inQty: number }
    >()

    for (const row of rotationRaw) {
        const entry = rotationMap.get(row.productId) ?? { outQty: 0, inQty: 0 }
        const qty = Math.abs(row._sum.quantity ?? 0)
        if (row.type === 'order_out' || row.type === 'sale_manual') {
            entry.outQty += qty
        } else {
            entry.inQty += qty
        }
        rotationMap.set(row.productId, entry)
    }

    // Résoudre les noms de produits en une seule requête
    const productIds = Array.from(rotationMap.keys())
    const products =
        productIds.length > 0
            ? await prisma.product.findMany({
                  where: { id: { in: productIds }, restaurantId },
                  select: {
                      id: true,
                      name: true,
                      category: { select: { name: true } },
                  },
              })
            : []

    // Récupérer les stocks actuels pour les mêmes produits
    const stocksMap = new Map(
        stocks.map((s) => [s.product.id, s.quantity]),
    )
    // stocks ne contient que les id via product.id — on a besoin d'un accès par productId
    // Refaire la map depuis la jointure déjà disponible
    const productStockMap = new Map<string, number>()
    for (const s of stocks) {
        productStockMap.set(s.product.id, s.quantity)
    }

    const productNameMap = new Map(products.map((p) => [p.id, p]))

    const topRotation: StockRotationItem[] = Array.from(rotationMap.entries())
        .map(([productId, { outQty, inQty }]) => {
            const p = productNameMap.get(productId)
            return {
                productId,
                productName: p?.name ?? 'Produit supprimé',
                categoryName: p?.category?.name ?? null,
                outQty,
                inQty,
                currentQty: productStockMap.get(productId) ?? 0,
            }
        })
        .sort((a, b) => b.outQty - a.outQty)
        .slice(0, 10)

    // ——— Alertes ———
    const alerts: StockAlert[] = alertsRaw.map((s) => ({
        productId: s.product.id,
        productName: s.product.name,
        currentQuantity: s.quantity,
        alertThreshold: s.alertThreshold,
        categoryName: s.product.category?.name ?? null,
    }))

    return {
        valuation,
        movementsByType,
        topRotation,
        alerts,
        previousMovementsCount,
    }
}
