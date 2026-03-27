// app/api/orders/[orderId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

interface RouteParams {
    params: Promise<{
        orderId: string
    }>
}

export async function GET(
    request: NextRequest,
    { params }: RouteParams
) {
    try {
        const { orderId } = await params

        // Validation de l'UUID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        if (!orderId || !uuidRegex.test(orderId)) {
            return NextResponse.json(
                { error: 'ID de commande invalide' },
                { status: 400 }
            )
        }

        // Récupérer la commande avec ses items — champs minimaux pour le tracking public
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: {
                id: true,
                orderNumber: true,
                status: true,
                totalAmount: true,
                customerName: true,
                createdAt: true,
                updatedAt: true,
                notes: true,
                orderItems: {
                    select: {
                        id: true,
                        productName: true,
                        quantity: true,
                        unitPrice: true,
                    },
                },
            },
        })

        if (!order) {
            return NextResponse.json(
                { error: 'Commande non trouvée' },
                { status: 404 }
            )
        }

        // Mapper vers le format attendu par OrderTracker
        return NextResponse.json({
            order: {
                id: order.id,
                order_number: order.orderNumber,
                status: order.status,
                total_amount: order.totalAmount,
                customer_name: order.customerName,
                created_at: order.createdAt,
                updated_at: order.updatedAt,
                notes: order.notes,
                order_items: order.orderItems.map(item => ({
                    id: item.id,
                    product_name: item.productName,
                    quantity: item.quantity,
                    unit_price: item.unitPrice,
                })),
            },
        })

    } catch (error) {
        console.error('Erreur récupération commande:', error)
        return NextResponse.json(
            { error: 'Erreur serveur interne' },
            { status: 500 }
        )
    }
}
