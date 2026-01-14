// app/api/orders/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

interface OrderItem {
    productId: string
    quantity: number
}

interface CreateOrderRequest {
    restaurantId: string
    tableId: string
    items: OrderItem[]
    customerName?: string
    notes?: string
}

// ============================================================
// GET - Récupérer toutes les commandes d'un restaurant
// ============================================================

export async function GET(request: NextRequest) {
    try {
        // PAS de params ici, juste searchParams
        const { searchParams } = request.nextUrl
        const restaurantId = searchParams.get('restaurantId')

        if (!restaurantId) {
            return NextResponse.json(
                { error: 'restaurantId manquant' },
                { status: 400 }
            )
        }

        // Récupérer toutes les commandes avec leurs relations
        const orders = await prisma.order.findMany({
            where: {
                restaurantId,
            },
            include: {
                orderItems: {
                    include: {
                        product: true,
                    },
                },
                table: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        })

        return NextResponse.json({ orders })
    } catch (error) {
        console.error('Erreur récupération commandes:', error)
        return NextResponse.json(
            { error: 'Erreur lors de la récupération des commandes' },
            { status: 500 }
        )
    }
}

// ============================================================
// POST - Créer une nouvelle commande
// ============================================================

export async function POST(request: NextRequest) {
    try {
        const body: CreateOrderRequest = await request.json()

        // Validation basique
        if (!body.restaurantId || !body.tableId || !body.items || body.items.length === 0) {
            return NextResponse.json(
                { error: 'Données manquantes' },
                { status: 400 }
            )
        }

        // Vérifier que la table existe et appartient au restaurant
        const table = await prisma.table.findUnique({
            where: {
                id: body.tableId,
                restaurantId: body.restaurantId,
                isActive: true,
            },
        })

        if (!table) {
            return NextResponse.json(
                { error: 'Table non trouvée ou inactive' },
                { status: 404 }
            )
        }

        // Récupérer les informations des produits
        const productIds = body.items.map((item) => item.productId)
        const products = await prisma.product.findMany({
            where: {
                id: { in: productIds },
                restaurantId: body.restaurantId,
                isAvailable: true,
            },
            include: {
                stock: true,
            },
        })

        if (products.length !== body.items.length) {
            return NextResponse.json(
                { error: 'Certains produits sont introuvables ou indisponibles' },
                { status: 400 }
            )
        }

        // Vérifier le stock
        for (const item of body.items) {
            const product = products.find((p) => p.id === item.productId)
            if (!product) continue

            if (product.stock && product.stock.quantity < item.quantity) {
                return NextResponse.json(
                    { error: `Stock insuffisant pour ${product.name}` },
                    { status: 400 }
                )
            }
        }

        // Calculer le montant total
        const totalAmount = body.items.reduce((sum, item) => {
            const product = products.find((p) => p.id === item.productId)!
            return sum + product.price * item.quantity
        }, 0)

        // Générer un orderNumber unique (format #001, #002, etc.)
        const lastOrder = await prisma.order.findFirst({
            where: { restaurantId: body.restaurantId },
            orderBy: { createdAt: 'desc' },
            select: { orderNumber: true },
        })

        let orderNumber = '#001'
        if (lastOrder?.orderNumber) {
            const lastNumber = parseInt(lastOrder.orderNumber.replace('#', ''))
            orderNumber = `#${String(lastNumber + 1).padStart(3, '0')}`
        }

        // Créer la commande avec ses items
        const order = await prisma.order.create({
            data: {
                restaurantId: body.restaurantId,
                tableId: body.tableId,
                orderNumber,
                customerName: body.customerName || null,
                notes: body.notes || null,
                status: 'pending',
                totalAmount,
                orderItems: {
                    create: body.items.map((item) => {
                        const product = products.find((p) => p.id === item.productId)!
                        return {
                            productId: item.productId,
                            productName: product.name,
                            quantity: item.quantity,
                            unitPrice: product.price,
                        }
                    }),
                },
            },
            include: {
                orderItems: true,
                table: {
                    select: {
                        number: true,
                    },
                },
            },
        })

        return NextResponse.json({
            success: true,
            order: {
                id: order.id,
                orderNumber: order.orderNumber,
                tableNumber: order.table?.number,
                totalAmount: order.totalAmount,
                status: order.status,
            },
        })
    } catch (error) {
        console.error('Erreur création commande:', error)
        return NextResponse.json(
            { error: 'Erreur lors de la création de la commande' },
            { status: 500 }
        )
    }
}