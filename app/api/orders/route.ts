// app/api/orders/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { logOrderFailed } from '@/lib/actions/logs'
import prisma from '@/lib/prisma'

// ============================================================
// TYPES
// ============================================================

// Chaque item envoyé par le client
interface OrderItem {
    productId: string
    quantity: number
}

// Corps de la requête POST pour créer une commande
interface CreateOrderRequest {
    restaurantId: string
    tableId: string
    items: OrderItem[]
    customerName?: string
    notes?: string
}

// Typage pour les produits récupérés depuis Prisma, avec le stock inclus
type ProductWithStock = {
    id: string
    name: string
    price: number | null
    stock: { quantity: number } | null
}

// ============================================================
// POST - Créer une nouvelle commande
// ============================================================

export async function POST(request: NextRequest) {
    try {
        const body: CreateOrderRequest = await request.json()

        // Validation basique des données
        if (!body.restaurantId || !body.tableId || !body.items || body.items.length === 0) {
            return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
        }

        // Vérifier que le restaurant existe et est actif
        const restaurant = await prisma.restaurant.findUnique({
            where: { id: body.restaurantId },
            select: { id: true, name: true, slug: true },
        })

        if (!restaurant) {
            return NextResponse.json({ error: 'Restaurant non trouvé ou inactif' }, { status: 404 })
        }

        // Vérifier que la table existe et appartient bien au restaurant
        const table = await prisma.table.findFirst({
            where: { id: body.tableId, restaurantId: body.restaurantId, isActive: true },
            select: { id: true, number: true },
        })

        if (!table) {
            return NextResponse.json({ error: 'Table non trouvée ou inactive' }, { status: 404 })
        }

        // Récupérer tous les produits commandés
        const productIds: string[] = body.items.map((item) => item.productId)
        const productsRaw = await prisma.product.findMany({
            where: { 
                id: { in: productIds },
                restaurantId: body.restaurantId,
                isAvailable: true,
                NOT: { price: null } // Exclure produits sans prix
            },
            include: { stock: true },
        })

        // Caster pour TS
        const products: ProductWithStock[] = productsRaw.map(p => ({
            id: p.id,
            name: p.name,
            price: p.price!, // "!" car on a filtré les null
            stock: p.stock,
        }))

        // Vérifier que tous les produits existent
        if (products.length !== body.items.length) {
            return NextResponse.json(
                { error: 'Certains produits sont introuvables, indisponibles ou sans prix' },
                { status: 400 }
            )
        }

        // Vérifier le stock pour chaque produit
        for (const item of body.items) {
            const product = products.find(p => p.id === item.productId)
            if (!product) continue

            if (product.stock && product.stock.quantity < item.quantity) {
                return NextResponse.json(
                    { error: `Stock insuffisant pour ${product.name}` },
                    { status: 400 }
                )
            }
        }

        // Calcul du montant total
        const totalAmount = body.items.reduce((sum: number, item) => {
            const product = products.find(p => p.id === item.productId)!
            return sum + (product.price ?? 0) * item.quantity
        }, 0)

        // Générer le numéro de commande lisible
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

        // Créer la commande avec tous les items
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
                    create: body.items.map(item => {
                        const product = products.find(p => p.id === item.productId)!
                        return {
                            productId: item.productId,
                            productName: product.name,
                            quantity: item.quantity,
                            unitPrice: product.price!, // sûr car on a filtré les null
                        }
                    }),
                },
            },
            include: { orderItems: true },
        })

        // Construire l'URL de tracking
        const trackingUrl = `/r/${restaurant.slug}/t/${table.number}/orders/${order.id}`

        // Retourner toutes les infos au client
        return NextResponse.json({
            success: true,
            order: {
                id: order.id,
                orderNumber: order.orderNumber,
                tableNumber: table.number,
                totalAmount: order.totalAmount,
                status: order.status,
            },
            restaurant: {
                slug: restaurant.slug,
                name: restaurant.name,
            },
            table: { number: table.number },
            trackingUrl,
        })
    } catch (error) {
        console.error('💥 Erreur création commande:', error)
        await logOrderFailed(error instanceof Error ? error.message : 'Erreur inconnue')
        return NextResponse.json(
            { error: 'Erreur lors de la création de la commande' },
            { status: 500 }
        )
    }
}
