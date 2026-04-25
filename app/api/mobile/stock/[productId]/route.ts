import { NextRequest, NextResponse } from 'next/server'
import { validateMobileRequest } from '@/lib/mobile-auth'
import prisma from '@/lib/prisma'

// ============================================================
// PATCH — Ajustement de stock depuis l'inventaire mobile
// Body : { quantity: number, note?: string }
// quantity = valeur absolue comptée physiquement (type adjustment)
// ============================================================
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ productId: string }> }
) {
    const { ctx, error } = await validateMobileRequest(req)
    if (error) return error

    const { productId } = await params

    try {
        const body = await req.json()
        const { quantity, note } = body

        if (quantity === undefined || typeof quantity !== 'number' || quantity < 0) {
            return NextResponse.json({ error: 'quantity est obligatoire et doit être un entier positif' }, { status: 400 })
        }

        const newQty = Math.floor(quantity)

        const currentStock = await prisma.stock.findUnique({
            where: { restaurantId_productId: { restaurantId: ctx.restaurantId, productId } },
            select: { quantity: true, product: { select: { name: true } } },
        })

        if (!currentStock) {
            return NextResponse.json({ error: 'Stock introuvable pour ce produit' }, { status: 404 })
        }

        const previousQty = currentStock.quantity

        await prisma.$transaction(async (tx) => {
            await tx.stock.update({
                where: { restaurantId_productId: { restaurantId: ctx.restaurantId, productId } },
                data: { quantity: newQty },
            })

            await tx.stockMovement.create({
                data: {
                    restaurantId: ctx.restaurantId,
                    productId,
                    userId: ctx.userId,
                    type: 'adjustment',
                    quantity: newQty - previousQty,
                    previousQty,
                    newQty,
                    reason: note ?? 'Inventaire mobile',
                },
            })

            await tx.product.update({
                where: { id: productId },
                data: { isAvailable: newQty > 0 },
            })
        })

        return NextResponse.json({ productId, previousQty, newQty, gap: newQty - previousQty })
    } catch (err) {
        console.error('PATCH /api/mobile/stock/[productId]:', err)
        return NextResponse.json({ error: 'Erreur lors de la mise à jour du stock' }, { status: 500 })
    }
}
