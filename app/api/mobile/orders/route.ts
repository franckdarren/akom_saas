import { NextRequest, NextResponse } from 'next/server'
import { validateMobileRequest } from '@/lib/mobile-auth'
import prisma from '@/lib/prisma'

interface CartItem {
    productId: string
    quantity: number
    unitPrice: number
}

interface CreateMobileOrderBody {
    items: CartItem[]
    totalAmount: number
    paymentMethod: 'cash' | 'airtel_money' | 'moov_money'
    customerName?: string
}

// ============================================================
// POST — Créer une commande depuis la caisse mobile
// Déduction de stock immédiate (vente au comptoir, source: mobile_pos)
// ============================================================
export async function POST(req: NextRequest) {
    const { ctx, error } = await validateMobileRequest(req)
    if (error) return error

    try {
        const body: CreateMobileOrderBody = await req.json()
        const { items, totalAmount, paymentMethod, customerName } = body

        if (!items || items.length === 0) {
            return NextResponse.json({ error: 'Le panier est vide' }, { status: 400 })
        }
        if (typeof totalAmount !== 'number' || totalAmount <= 0) {
            return NextResponse.json({ error: 'totalAmount invalide' }, { status: 400 })
        }
        if (!paymentMethod) {
            return NextResponse.json({ error: 'paymentMethod est obligatoire' }, { status: 400 })
        }

        // Vérifier que tous les produits existent et appartiennent au restaurant
        const productIds = items.map((i) => i.productId)
        const products = await prisma.product.findMany({
            where: { id: { in: productIds }, restaurantId: ctx.restaurantId },
            include: { stock: { select: { quantity: true } } },
        })

        if (products.length !== productIds.length) {
            return NextResponse.json({ error: 'Certains produits sont introuvables' }, { status: 400 })
        }

        // Vérifier le stock disponible
        for (const item of items) {
            const product = products.find((p) => p.id === item.productId)!
            if (product.hasStock && product.stock && product.stock.quantity < item.quantity) {
                return NextResponse.json(
                    { error: `Stock insuffisant pour "${product.name}"` },
                    { status: 400 }
                )
            }
        }

        // Générer le numéro de commande
        const lastOrder = await prisma.order.findFirst({
            where: { restaurantId: ctx.restaurantId, orderNumber: { startsWith: '#' } },
            orderBy: { orderNumber: 'desc' },
            select: { orderNumber: true },
        })
        const lastNum = lastOrder?.orderNumber ? parseInt(lastOrder.orderNumber.replace('#', ''), 10) : 0
        const orderNumber = `#${String((isNaN(lastNum) ? 0 : lastNum) + 1).padStart(3, '0')}`

        // Créer la commande, les items et déduire le stock en une transaction
        const order = await prisma.$transaction(async (tx) => {
            const newOrder = await tx.order.create({
                data: {
                    restaurantId: ctx.restaurantId,
                    orderNumber,
                    customerName: customerName ?? null,
                    status: 'delivered', // vente comptoir = immédiatement livrée
                    source: 'mobile_pos',
                    totalAmount: Math.floor(totalAmount),
                    stockDeducted: true,
                    notes: `Paiement : ${paymentMethod}`,
                    orderItems: {
                        create: items.map((item) => {
                            const product = products.find((p) => p.id === item.productId)!
                            return {
                                productId: item.productId,
                                productName: product.name,
                                quantity: item.quantity,
                                unitPrice: Math.floor(item.unitPrice),
                            }
                        }),
                    },
                },
                select: { id: true, orderNumber: true, totalAmount: true, status: true },
            })

            // Déduire le stock pour chaque produit géré en stock
            for (const item of items) {
                const product = products.find((p) => p.id === item.productId)!
                if (!product.hasStock || !product.stock) continue

                const previousQty = product.stock.quantity
                const newQty = previousQty - item.quantity

                await tx.stock.update({
                    where: { restaurantId_productId: { restaurantId: ctx.restaurantId, productId: item.productId } },
                    data: { quantity: newQty },
                })

                await tx.stockMovement.create({
                    data: {
                        restaurantId: ctx.restaurantId,
                        productId: item.productId,
                        userId: ctx.userId,
                        orderId: newOrder.id,
                        type: 'sale_manual',
                        quantity: -item.quantity,
                        previousQty,
                        newQty,
                        reason: `Vente mobile #${newOrder.orderNumber}`,
                    },
                })

                await tx.product.update({
                    where: { id: item.productId },
                    data: { isAvailable: newQty > 0 },
                })
            }

            return newOrder
        })

        return NextResponse.json({ orderId: order.id, orderNumber: order.orderNumber, totalAmount: order.totalAmount }, { status: 201 })
    } catch (err) {
        console.error('POST /api/mobile/orders:', err)
        return NextResponse.json({ error: 'Erreur lors de la création de la commande' }, { status: 500 })
    }
}
