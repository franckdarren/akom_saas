// app/api/orders/[orderId]/cancel/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

interface RouteParams {
    params: Promise<{
        orderId: string
    }>
}

export async function POST(
    request: NextRequest,
    { params }: RouteParams
) {
    try {
        const { orderId } = await params

        console.log('============================================')
        console.log('🔍 [API] POST /api/orders/[orderId]/cancel')
        console.log('📦 [API] Order ID:', orderId)
        console.log('============================================')

        // Validation de l'UUID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        if (!orderId || !uuidRegex.test(orderId)) {
            console.log('❌ [API] UUID invalide')
            return NextResponse.json(
                { error: 'ID de commande invalide' },
                { status: 400 }
            )
        }

        // Récupérer la commande
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: {
                id: true,
                status: true,
                createdAt: true,
            },
        })

        if (!order) {
            console.log('❌ [API] Commande non trouvée')
            return NextResponse.json(
                { error: 'Commande non trouvée' },
                { status: 404 }
            )
        }

        // Vérifier que la commande est en statut "pending"
        if (order.status !== 'pending') {
            console.log('❌ [API] Commande déjà en cours de traitement:', order.status)
            return NextResponse.json(
                { 
                    error: 'Cette commande ne peut plus être annulée',
                    message: 'La commande est déjà en cours de préparation'
                },
                { status: 400 }
            )
        }

        // Vérifier que moins de 2 minutes se sont écoulées
        const createdAt = new Date(order.createdAt)
        const minutesSinceCreation = (Date.now() - createdAt.getTime()) / 1000 / 60

        if (minutesSinceCreation > 2) {
            console.log('❌ [API] Délai d\'annulation dépassé:', minutesSinceCreation, 'minutes')
            return NextResponse.json(
                { 
                    error: 'Délai d\'annulation dépassé',
                    message: 'Les commandes ne peuvent être annulées que dans les 2 minutes suivant leur création'
                },
                { status: 400 }
            )
        }

        // Annuler la commande
        const cancelledOrder = await prisma.order.update({
            where: { id: orderId },
            data: {
                status: 'cancelled',
                updatedAt: new Date(),
            },
        })

        console.log('✅ [API] Commande annulée:', cancelledOrder.id)

        return NextResponse.json({
            success: true,
            order: {
                id: cancelledOrder.id,
                status: cancelledOrder.status,
            },
        })

    } catch (error) {
        console.error('💥 [API] Erreur annulation commande:', error)
        return NextResponse.json(
            { error: 'Erreur lors de l\'annulation de la commande' },
            { status: 500 }
        )
    }
}