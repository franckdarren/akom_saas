// app/api/catalog/orders/route.ts

import prisma from '@/lib/prisma'
import {z} from 'zod'

const PublicOrderSchema = z.object({
    restaurantId: z.string().uuid(),
    fulfillmentType: z.enum(['table', 'takeway', 'delivery', 'reservation']),
    customerName: z.string().min(2),
    customerPhone: z.string().min(8),
    items: z.array(z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().min(1),
    })).optional(), // Vide pour les réservations pures
    pickupTime: z.string().optional(),
    reservationDate: z.string().optional(),
    partySize: z.number().int().min(1).optional(),
    notes: z.string().optional(),
})

export async function POST(req: Request) {
    const body = await req.json()
    const parsed = PublicOrderSchema.safeParse(body)

    if (!parsed.success) {
        return Response.json({error: 'Données invalides'}, {status: 400})
    }

    const data = parsed.data

    // Vérifier que le restaurant existe et est actif
    const restaurant = await prisma.restaurant.findUnique({
        where: {id: data.restaurantId, isActive: true}
    })
    if (!restaurant) {
        return Response.json({error: 'Restaurant introuvable'}, {status: 404})
    }

    // Récupérer les produits pour avoir les vrais prix et noms
    const productIds = data.items?.map(item => item.productId) ?? []
    const products = productIds.length > 0
        ? await prisma.product.findMany({
            where: {
                id: {in: productIds},
                restaurantId: data.restaurantId,
                isAvailable: true,
            },
            select: {id: true, name: true, price: true},
        })
        : []

    // Vérifier que tous les produits existent et ont un prix
    if (data.items && data.items.length > 0) {
        if (products.length !== data.items.length) {
            return Response.json({error: 'Certains produits sont introuvables ou indisponibles'}, {status: 400})
        }
        const missingPrice = products.find(p => p.price === null)
        if (missingPrice) {
            return Response.json({error: `Le produit "${missingPrice.name}" n'a pas de prix`}, {status: 400})
        }
    }

    // Calcul du montant total
    const totalAmount = data.items?.reduce((sum, item) => {
        const product = products.find(p => p.id === item.productId)!
        return sum + (Number(product.price) * item.quantity)
    }, 0) ?? 0

    // Générer le numéro de commande (basé sur le plus grand au format #XXX)
    const lastOrder = await prisma.order.findFirst({
        where: {restaurantId: data.restaurantId, orderNumber: {startsWith: '#'}},
        orderBy: {orderNumber: 'desc'},
        select: {orderNumber: true},
    })
    let orderNumber = '#001'
    if (lastOrder?.orderNumber) {
        const lastNumber = parseInt(lastOrder.orderNumber.replace('#', ''), 10)
        if (!isNaN(lastNumber)) {
            orderNumber = `#${String(lastNumber + 1).padStart(3, '0')}`
        }
    }

    try {
        // Créer la commande avec source = PUBLIC_LINK
        const order = await prisma.order.create({
            data: {
                restaurantId: data.restaurantId,
                tableId: null,
                source: 'public_link',
                fulfillmentType: data.fulfillmentType,
                customerName: data.customerName,
                customerPhone: data.customerPhone,
                status: 'pending',
                orderNumber,
                totalAmount,
                pickupTime: data.pickupTime ? new Date(data.pickupTime) : null,
                reservationDate: data.reservationDate ? new Date(data.reservationDate) : null,
                partySize: data.partySize ?? null,
                notes: data.notes ?? null,
                orderItems: {
                    create: data.items?.map(item => {
                        const product = products.find(p => p.id === item.productId)!
                        return {
                            productId: item.productId,
                            quantity: item.quantity,
                            unitPrice: Number(product.price),
                            productName: product.name,
                        }
                    }) ?? []
                }
            }
        })

        return Response.json({orderId: order.id, orderNumber: order.orderNumber})
    } catch (error) {
        console.error('Erreur création commande catalogue:', error)
        return Response.json({error: 'Erreur lors de la création de la commande'}, {status: 500})
    }
}