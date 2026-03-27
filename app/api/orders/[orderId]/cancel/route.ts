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

        // Validation de l'UUID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        if (!orderId || !uuidRegex.test(orderId)) {
            return NextResponse.json(
                { error: 'ID de commande invalide' },
                { status: 400 }
            )
        }

        // Récupérer la commande avec le restaurant pour vérifier qu'il est actif
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: {
                id: true,
                status: true,
                createdAt: true,
                restaurant: {
                    select: { isActive: true },
                },
            },
        })

        if (!order) {
            return NextResponse.json(
                { error: 'Commande non trouvée' },
                { status: 404 }
            )
        }

        // Vérifier que la structure est active
        if (!order.restaurant.isActive) {
            return NextResponse.json(
                { error: 'Cette structure n\'accepte plus de commandes' },
                { status: 403 }
            )
        }

        // Vérifier que la commande est en statut "pending"
        if (order.status !== 'pending') {
            return NextResponse.json(
                {
                    error: 'Cette commande ne peut plus être annulée',
                    message: 'La commande est déjà en cours de préparation',
                },
                { status: 400 }
            )
        }

        // Vérifier que moins de 2 minutes se sont écoulées
        const minutesSinceCreation = (Date.now() - order.createdAt.getTime()) / 1000 / 60
        if (minutesSinceCreation > 2) {
            return NextResponse.json(
                {
                    error: 'Délai d\'annulation dépassé',
                    message: 'Les commandes ne peuvent être annulées que dans les 2 minutes suivant leur création',
                },
                { status: 400 }
            )
        }

        // Annuler la commande
        const cancelledOrder = await prisma.order.update({
            where: { id: orderId },
            data: { status: 'cancelled' },
        })

        return NextResponse.json({
            success: true,
            order: {
                id: cancelledOrder.id,
                status: cancelledOrder.status,
            },
        })

    } catch (error) {
        console.error('Erreur annulation commande:', error)
        return NextResponse.json(
            { error: 'Erreur lors de l\'annulation de la commande' },
            { status: 500 }
        )
    }
}
