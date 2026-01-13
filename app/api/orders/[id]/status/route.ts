// app/api/orders/[id]/status/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'

type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled'

// ============================================================
// PATCH - Changer le statut d'une commande
// ============================================================
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params // ✅ AWAIT ici
        const body = await request.json()
        const { status: newStatus } = body as { status: OrderStatus }

        if (!newStatus) {
            return NextResponse.json(
                { error: 'Statut manquant' },
                { status: 400 }
            )
        }

        // Vérifier l'authentification
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json(
                { error: 'Non authentifié' },
                { status: 401 }
            )
        }

        // ✅ Utiliser Prisma pour les lectures (pas de RLS bloquant)
        const order = await prisma.order.findFirst({
            where: { 
                id,
                restaurant: {
                    users: {
                        some: {
                            userId: user.id
                        }
                    }
                }
            },
            select: { 
                status: true, 
                restaurantId: true 
            },
        })

        if (!order) {
            return NextResponse.json(
                { error: 'Commande introuvable ou accès refusé' },
                { status: 404 }
            )
        }

        // Validation des transitions
        const transitions: Record<OrderStatus, OrderStatus[]> = {
            pending: ['preparing', 'cancelled'],
            preparing: ['ready', 'cancelled'],
            ready: ['delivered', 'cancelled'],
            delivered: [],
            cancelled: [],
        }

        const currentStatus = order.status as OrderStatus

        if (!transitions[currentStatus].includes(newStatus)) {
            return NextResponse.json(
                { error: 'Transition invalide' },
                { status: 400 }
            )
        }

        // ✅ UPDATE via Supabase RAW SQL (bypass RLS proprement)
        const { error: updateError } = await supabase.rpc('update_order_status', {
            p_order_id: id,
            p_new_status: newStatus
        })

        if (updateError) {
            console.error('Erreur update:', updateError)
            return NextResponse.json(
                { error: 'Erreur lors de la mise à jour' },
                { status: 500 }
            )
        }

        return NextResponse.json({ 
            success: true,
            message: 'Statut mis à jour'
        })

    } catch (error) {
        console.error('Erreur changement statut:', error)
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        )
    }
}