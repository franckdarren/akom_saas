import { NextRequest, NextResponse } from 'next/server'
import { validateMobileRequest } from '@/lib/mobile-auth'
import prisma from '@/lib/prisma'

// ============================================================
// GET — Stock complet du restaurant
// Retourne uniquement les produits avec hasStock: true
// ============================================================
export async function GET(req: NextRequest) {
    const { ctx, error } = await validateMobileRequest(req)
    if (error) return error

    try {
        const stocks = await prisma.stock.findMany({
            where: {
                restaurantId: ctx.restaurantId,
                product: { hasStock: true },
            },
            select: {
                productId: true,
                quantity: true,
                alertThreshold: true,
                product: { select: { name: true, barcode: true, imageUrl: true, categoryId: true } },
            },
            orderBy: { product: { name: 'asc' } },
        })

        const items = stocks.map((s) => ({
            productId: s.productId,
            productName: s.product.name,
            barcode: s.product.barcode,
            imageUrl: s.product.imageUrl,
            categoryId: s.product.categoryId,
            quantity: s.quantity,
            alertThreshold: s.alertThreshold,
        }))

        return NextResponse.json({ items })
    } catch (err) {
        console.error('GET /api/mobile/stock:', err)
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }
}
