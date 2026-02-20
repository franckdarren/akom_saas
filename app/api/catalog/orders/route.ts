// app/api/catalog/orders/route.ts

import {supabaseAdmin} from '@/lib/supabase/admin'
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
    pickupTime: z.string().datetime().optional(),
    reservationDate: z.string().datetime().optional(),
    partySize: z.number().int().min(1).optional(),
    notes: z.string().optional(),
    paymentMethod: z.enum(['CASH', 'AIRTEL_MONEY', 'MOOV_MONEY']),
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

    // Créer la commande avec source = PUBLIC_LINK
    const order = await prisma.order.create({
        data: {
            restaurantId: data.restaurantId,
            tableId: null,          // ← Pas de table pour une commande publique
            source: 'public_link',  // ← Le marqueur statistique clé
            fulfillmentType: data.fulfillmentType,
            customerName: data.customerName,
            customerPhone: data.customerPhone,
            status: 'pending',
            pickupTime: data.pickupTime ? new Date(data.pickupTime) : null,
            reservationDate: data.reservationDate ? new Date(data.reservationDate) : null,
            partySize: data.partySize ?? null,
            notes: data.notes ?? null,
            orderItems: {
                create: data.items?.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    // unitPrice récupéré depuis la DB pour éviter la manipulation
                    unitPrice: 0, // À remplir via une query produit avant
                    productName: '', // Pareil
                })) ?? []
            }
        }
    })

    return Response.json({orderId: order.id, orderNumber: order.orderNumber})
}