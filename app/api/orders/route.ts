// app/api/orders/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { logOrderFailed } from '@/lib/actions/logs'
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
        const { searchParams } = request.nextUrl
        const restaurantId = searchParams.get('restaurantId')

        if (!restaurantId) {
            return NextResponse.json(
                { error: 'restaurantId manquant' },
                { status: 400 }
            )
        }

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

        console.log('============================================')
        console.log('🔍 [API] POST /api/orders')
        console.log('📝 [API] Restaurant:', body.restaurantId)
        console.log('📝 [API] Table:', body.tableId)
        console.log('📝 [API] Items:', body.items?.length)
        console.log('============================================')

        // Validation basique des données reçues
        if (!body.restaurantId || !body.tableId || !body.items || body.items.length === 0) {
            console.log('❌ [API] Données manquantes')
            return NextResponse.json(
                { error: 'Données manquantes' },
                { status: 400 }
            )
        }

        // ✨ AJOUT CRUCIAL : Récupérer le restaurant avec son slug
        // Nous avons besoin du slug pour construire l'URL contextuelle
        const restaurant = await prisma.restaurant.findUnique({
            where: {
                id: body.restaurantId,
                isActive: true,
            },
            select: {
                id: true,
                name: true,
                slug: true, // ← Le slug est essentiel pour l'URL
            },
        })

        if (!restaurant) {
            console.log('❌ [API] Restaurant non trouvé ou inactif')
            return NextResponse.json(
                { error: 'Restaurant non trouvé ou inactif' },
                { status: 404 }
            )
        }

        // Vérifier que la table existe et appartient bien à ce restaurant
        // La vérification du restaurantId garantit qu'on ne peut pas créer
        // une commande pour une table d'un autre restaurant
        const table = await prisma.table.findFirst({
            where: {
                id: body.tableId,
                restaurantId: body.restaurantId,
                isActive: true,
            },
            select: {
                id: true,
                number: true, // ← Le numéro est nécessaire pour l'URL
            },
        })

        if (!table) {
            console.log('❌ [API] Table non trouvée ou inactive')
            return NextResponse.json(
                { error: 'Table non trouvée ou inactive' },
                { status: 404 }
            )
        }

        // Récupérer les informations des produits commandés
        // Nous utilisons un "in" pour récupérer tous les produits en une seule requête
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

        // Vérifier que tous les produits commandés existent et sont disponibles
        if (products.length !== body.items.length) {
            console.log('❌ [API] Certains produits introuvables')
            return NextResponse.json(
                { error: 'Certains produits sont introuvables ou indisponibles' },
                { status: 400 }
            )
        }

        // Vérifier le stock pour chaque produit
        // Cette vérification empêche de commander plus que ce qui est en stock
        for (const item of body.items) {
            const product = products.find((p) => p.id === item.productId)
            if (!product) continue

            if (product.stock && product.stock.quantity < item.quantity) {
                console.log('❌ [API] Stock insuffisant pour:', product.name)
                return NextResponse.json(
                    { error: `Stock insuffisant pour ${product.name}` },
                    { status: 400 }
                )
            }
        }

        // Calculer le montant total de la commande
        // Nous utilisons les prix stockés en base de données, pas ceux envoyés par le client
        // Cela empêche toute manipulation malveillante des prix
        const totalAmount = body.items.reduce((sum, item) => {
            const product = products.find((p) => p.id === item.productId)!
            return sum + product.price * item.quantity
        }, 0)

        console.log('💰 [API] Montant total calculé:', totalAmount)

        // Générer un numéro de commande unique
        // Format : #001, #002, #003, etc.
        // Ce numéro est lisible et facile à communiquer entre le client et le personnel
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

        console.log('🔢 [API] Numéro de commande généré:', orderNumber)

        // Créer la commande avec tous ses items dans une seule transaction
        // L'utilisation de "include" nous permet de récupérer immédiatement
        // les données créées sans faire de requête supplémentaire
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
            },
        })

        console.log('✅ [API] Commande créée:', order.id, order.orderNumber)

        // ✨ AJOUT CRUCIAL : Construire l'URL contextuelle de tracking
        // Cette URL encode toutes les informations nécessaires : restaurant, table, commande
        // Le client pourra revenir au menu facilement grâce à cette structure
        const trackingUrl = `/r/${restaurant.slug}/t/${table.number}/orders/${order.id}`
        
        console.log('🔗 [API] URL de tracking générée:', trackingUrl)

        // Retourner toutes les informations nécessaires au client
        // L'URL de tracking est le plus important car c'est là que le client sera redirigé
        return NextResponse.json({
            success: true,
            order: {
                id: order.id,
                orderNumber: order.orderNumber,
                tableNumber: table.number,
                totalAmount: order.totalAmount,
                status: order.status,
            },
            // ✨ NOUVEAU : Contexte complet pour la navigation
            restaurant: {
                slug: restaurant.slug,
                name: restaurant.name,
            },
            table: {
                number: table.number,
            },
            // ✨ NOUVEAU : URL de redirection contextuelle
            trackingUrl: trackingUrl,
        })

    } catch (error) {
        console.error('💥 [API] Erreur création commande:', error)
        
        // Logger l'échec pour le monitoring (si vous avez un système de logs)
        await logOrderFailed(error instanceof Error ? error.message : 'Erreur inconnue')
        
        return NextResponse.json(
            { error: 'Erreur lors de la création de la commande' },
            { status: 500 }
        )
    }
}