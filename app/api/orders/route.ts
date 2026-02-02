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
    price: number
    stock: { quantity: number } | null
}

// ============================================================
// GET - Récupérer toutes les commandes d'un restaurant
// ============================================================

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl
        const restaurantId = searchParams.get('restaurantId')

        if (!restaurantId) {
            return NextResponse.json(
                { error: 'restaurantId manquant' },
                { status: 400 }
            )
        }

        // On récupère toutes les commandes pour le restaurant
        const orders = await prisma.order.findMany({
            where: { restaurantId },
            include: {
                orderItems: {
                    include: { product: true },
                },
                table: true,
            },
            orderBy: { createdAt: 'desc' },
        })

        return NextResponse.json({ orders })
    } catch (error) {
        console.error('💥 [API] Erreur récupération commandes:', error)
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

        console.log('============================================')
        console.log('🔍 [API] POST /api/orders')
        console.log('📝 Restaurant:', body.restaurantId)
        console.log('📝 Table:', body.tableId)
        console.log('📝 Nombre d’items:', body.items?.length)
        console.log('============================================')

        // Validation basique des données
        if (!body.restaurantId || !body.tableId || !body.items || body.items.length === 0) {
            console.log('❌ [API] Données manquantes')
            return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
        }

        // Vérifier que le restaurant existe et est actif
        const restaurant = await prisma.restaurant.findUnique({
            where: { id: body.restaurantId, isActive: true },
            select: { id: true, name: true, slug: true },
        })

        if (!restaurant) {
            console.log('❌ [API] Restaurant non trouvé ou inactif')
            return NextResponse.json({ error: 'Restaurant non trouvé ou inactif' }, { status: 404 })
        }

        // Vérifier que la table existe et appartient bien au restaurant
        const table = await prisma.table.findFirst({
            where: { id: body.tableId, restaurantId: body.restaurantId, isActive: true },
            select: { id: true, number: true },
        })

        if (!table) {
            console.log('❌ [API] Table non trouvée ou inactive')
            return NextResponse.json({ error: 'Table non trouvée ou inactive' }, { status: 404 })
        }

        // Récupérer tous les produits commandés
        const productIds: string[] = body.items.map((item) => item.productId)
        const products: ProductWithStock[] = await prisma.product.findMany({
            where: { id: { in: productIds }, restaurantId: body.restaurantId, isAvailable: true },
            include: { stock: true },
        })

        // Vérifier que tous les produits existent
        if (products.length !== body.items.length) {
            console.log('❌ [API] Certains produits introuvables ou indisponibles')
            return NextResponse.json(
                { error: 'Certains produits sont introuvables ou indisponibles' },
                { status: 400 }
            )
        }

        // Vérifier le stock pour chaque produit
        for (const item of body.items) {
            const product = products.find((p: ProductWithStock) => p.id === item.productId)
            if (!product) continue

            if (product.stock && product.stock.quantity < item.quantity) {
                console.log('❌ [API] Stock insuffisant pour:', product.name)
                return NextResponse.json(
                    { error: `Stock insuffisant pour ${product.name}` },
                    { status: 400 }
                )
            }
        }

        // Calcul du montant total en utilisant les prix de la base
        const totalAmount = body.items.reduce((sum: number, item) => {
            const product = products.find((p: ProductWithStock) => p.id === item.productId)!
            return sum + product.price * item.quantity
        }, 0)

        console.log('💰 Montant total calculé:', totalAmount)

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

        console.log('🔢 Numéro de commande généré:', orderNumber)

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
                    create: body.items.map((item) => {
                        const product = products.find((p: ProductWithStock) => p.id === item.productId)!
                        return {
                            productId: item.productId,
                            productName: product.name,
                            quantity: item.quantity,
                            unitPrice: product.price,
                        }
                    }),
                },
            },
            include: { orderItems: true },
        })

        console.log('✅ Commande créée:', order.id, order.orderNumber)

        // Construire l'URL de tracking
        const trackingUrl = `/r/${restaurant.slug}/t/${table.number}/orders/${order.id}`
        console.log('🔗 URL de tracking:', trackingUrl)

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
