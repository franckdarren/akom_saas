// app/api/orders/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// ============================================================
// GET - Récupérer une commande par ID
// ============================================================

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> } // ✅ Promise
) {
    try {
        const { id } = await params // ✅ AWAIT
        const { searchParams } = request.nextUrl
        const restaurantId = searchParams.get('restaurantId')

        if (!restaurantId) {
            return NextResponse.json(
                { error: 'restaurantId manquant' },
                { status: 400 }
            )
        }

        // Récupérer la commande avec toutes ses relations
        const order = await prisma.order.findUnique({
            where: {
                id,
                restaurantId, // Sécurité : vérifier que la commande appartient au restaurant
            },
            include: {
                orderItems: {
                    include: {
                        product: true,
                    },
                },
                table: true,
            },
        })

        if (!order) {
            return NextResponse.json(
                { error: 'Commande non trouvée' },
                { status: 404 }
            )
        }

        return NextResponse.json({ order })
    } catch (error) {
        console.error('Erreur récupération commande:', error)
        return NextResponse.json(
            { error: 'Erreur lors de la récupération de la commande' },
            { status: 500 }
        )
    }
}