import { NextRequest, NextResponse } from 'next/server'
import { validateMobileRequest } from '@/lib/mobile-auth'
import prisma from '@/lib/prisma'

// ============================================================
// GET — Lookup produit par code-barres
// Retourne { product: null } si introuvable (jamais 404)
// ============================================================
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ code: string }> }
) {
    const { ctx, error } = await validateMobileRequest(req)
    if (error) return error

    const { code } = await params

    try {
        const product = await prisma.product.findFirst({
            where: { restaurantId: ctx.restaurantId, barcode: code },
            select: {
                id: true,
                name: true,
                description: true,
                price: true,
                barcode: true,
                imageUrl: true,
                isAvailable: true,
                hasStock: true,
                categoryId: true,
                stock: { select: { quantity: true } },
            },
        })

        return NextResponse.json({ product })
    } catch (err) {
        console.error('GET /api/mobile/products/barcode/[code]:', err)
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }
}
