import { NextRequest, NextResponse } from 'next/server'
import { validateMobileRequest } from '@/lib/mobile-auth'
import prisma from '@/lib/prisma'

// ============================================================
// PATCH — Modifier un produit existant
// Body : { name?, price?, categoryId?, barcode?, imageUrl?, description? }
// ============================================================
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { ctx, error } = await validateMobileRequest(req)
    if (error) return error

    const { id } = await params

    try {
        const existing = await prisma.product.findFirst({
            where: { id, restaurantId: ctx.restaurantId },
            select: { id: true },
        })

        if (!existing) {
            return NextResponse.json({ error: 'Produit introuvable' }, { status: 404 })
        }

        const body = await req.json()
        const { name, price, categoryId, barcode, imageUrl, description } = body

        const data: Record<string, unknown> = {}
        if (name !== undefined) data.name = name.trim()
        if (price !== undefined) data.price = Math.floor(price)
        if (categoryId !== undefined) data.categoryId = categoryId ?? null
        if (barcode !== undefined) data.barcode = barcode ?? null
        if (imageUrl !== undefined) data.imageUrl = imageUrl ?? null
        if (description !== undefined) data.description = description?.trim() ?? null

        const product = await prisma.product.update({
            where: { id },
            data,
        })

        return NextResponse.json({ product })
    } catch (err) {
        console.error('PATCH /api/mobile/products/[id]:', err)
        return NextResponse.json({ error: 'Erreur lors de la mise à jour du produit' }, { status: 500 })
    }
}
