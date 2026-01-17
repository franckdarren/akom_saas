import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const startTime = Date.now()
    
    try {
        const { id: orderId } = await context.params
        
        // On utilise Prisma pour éviter les erreurs de permissions "schema public" de Supabase
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                table: {
                    select: { number: true }
                },
                restaurant: {
                    select: {
                        name: true,
                        logoUrl: true,
                        phone: true
                    }
                },
                orderItems: {
                    include: {
                        product: {
                            select: { imageUrl: true }
                        }
                    }
                }
            }
        })

        if (!order) {
            console.warn('⚠️ [API] Commande introuvable:', orderId)
            return NextResponse.json(
                { error: 'Commande introuvable' },
                { status: 404 }
            )
        }

        // Formatage de la réponse (pour correspondre à ton frontend)
        const response = {
            id: order.id,
            orderNumber: order.orderNumber,
            status: order.status,
            totalAmount: order.totalAmount,
            createdAt: order.createdAt,
            tableNumber: order.table?.number,
            restaurant: {
                name: order.restaurant?.name,
                logoUrl: order.restaurant?.logoUrl,
                phone: order.restaurant?.phone
            },
            items: order.orderItems.map((item) => ({
                name: item.productName,
                quantity: item.quantity,
                price: item.unitPrice,
                imageUrl: item.product?.imageUrl || null,
            })),
        }

        const duration = Date.now() - startTime

        return NextResponse.json(response)
        
    } catch (error) {
        console.error('💥 [API] Erreur:', error)
        return NextResponse.json(
            { 
                error: 'Erreur serveur', 
                details: error instanceof Error ? error.message : 'Erreur inconnue'
            },
            { status: 500 }
        )
    }
}