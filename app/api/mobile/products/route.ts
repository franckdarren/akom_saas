import { NextRequest, NextResponse } from 'next/server'
import { validateMobileRequest } from '@/lib/mobile-auth'
import prisma from '@/lib/prisma'

const PAGE_SIZE = 50

// ============================================================
// GET — Liste paginée des produits avec stock courant
// Query params : cursor? (product id), categoryId?
// ============================================================
export async function GET(req: NextRequest) {
    const { ctx, error } = await validateMobileRequest(req)
    if (error) return error

    const { searchParams } = req.nextUrl
    const cursor = searchParams.get('cursor') ?? undefined
    const categoryId = searchParams.get('categoryId') ?? undefined

    try {
        const products = await prisma.product.findMany({
            where: {
                restaurantId: ctx.restaurantId,
                ...(categoryId ? { categoryId } : {}),
            },
            select: {
                id: true,
                name: true,
                description: true,
                price: true,
                barcode: true,
                imageUrl: true,
                isAvailable: true,
                hasStock: true,
                productType: true,
                categoryId: true,
                stock: { select: { quantity: true, alertThreshold: true } },
            },
            orderBy: { name: 'asc' },
            take: PAGE_SIZE + 1,
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        })

        const hasMore = products.length > PAGE_SIZE
        const items = hasMore ? products.slice(0, PAGE_SIZE) : products
        const nextCursor = hasMore ? items[items.length - 1].id : undefined

        return NextResponse.json({ items, nextCursor })
    } catch (err) {
        console.error('GET /api/mobile/products:', err)
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }
}

// ============================================================
// POST — Créer un produit (+ entrée Stock)
// Body : { name, price, categoryId?, barcode?, imageUrl?, description?, productType? }
// ============================================================
export async function POST(req: NextRequest) {
    const { ctx, error } = await validateMobileRequest(req)
    if (error) return error

    try {
        const body = await req.json()
        const { name, price, categoryId, barcode, imageUrl, description, productType = 'good' } = body

        if (!name || typeof name !== 'string' || name.trim() === '') {
            return NextResponse.json({ error: 'Le nom est obligatoire' }, { status: 400 })
        }
        if (price === undefined || price === null || typeof price !== 'number' || price < 0) {
            return NextResponse.json({ error: 'Le prix est obligatoire et doit être positif' }, { status: 400 })
        }

        const hasStock = productType === 'good'

        const product = await prisma.$transaction(async (tx) => {
            const newProduct = await tx.product.create({
                data: {
                    restaurantId: ctx.restaurantId,
                    name: name.trim(),
                    description: description?.trim() ?? null,
                    price: Math.floor(price),
                    categoryId: categoryId ?? null,
                    barcode: barcode ?? null,
                    imageUrl: imageUrl ?? null,
                    productType,
                    hasStock,
                    includePrice: true,
                    isAvailable: false, // passe à true dès qu'on ajoute du stock
                },
            })

            if (hasStock) {
                await tx.stock.create({
                    data: {
                        restaurantId: ctx.restaurantId,
                        productId: newProduct.id,
                        quantity: 0,
                        alertThreshold: 5,
                    },
                })
            }

            return newProduct
        })

        return NextResponse.json({ product }, { status: 201 })
    } catch (err) {
        console.error('POST /api/mobile/products:', err)
        return NextResponse.json({ error: 'Erreur lors de la création du produit' }, { status: 500 })
    }
}
