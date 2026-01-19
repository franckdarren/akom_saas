// app/api/orders/[orderId]/status/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'

type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled'

interface RouteParams {
    params: Promise<{
        orderId: string  // ✅ CORRECTION : Changé de "id" à "orderId"
    }>
}

// ============================================================
// PATCH - Changer le statut d'une commande
// ============================================================

export async function PATCH(
    request: NextRequest,
    { params }: RouteParams  // ✅ Typage correct avec Promise
) {
    try {
        const { orderId } = await params  // ✅ CORRECTION : Utiliser orderId
        const body = await request.json()
        const { status: newStatus } = body as { status: OrderStatus }

        console.log('============================================')
        console.log('🔍 [API] PATCH /api/orders/[orderId]/status')
        console.log('📦 [API] Order ID:', orderId)
        console.log('🔄 [API] Nouveau statut:', newStatus)
        console.log('============================================')

        if (!newStatus) {
            console.log('❌ [API] Statut manquant')
            return NextResponse.json(
                { error: 'Statut manquant' },
                { status: 400 }
            )
        }

        // Validation de l'UUID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        if (!orderId || !uuidRegex.test(orderId)) {
            console.log('❌ [API] UUID invalide')
            return NextResponse.json(
                { error: 'ID de commande invalide' },
                { status: 400 }
            )
        }

        // Vérifier l'authentification
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            console.log('❌ [API] Non authentifié')
            return NextResponse.json(
                { error: 'Non authentifié' },
                { status: 401 }
            )
        }

        // Récupérer la commande avec vérification des permissions
        // L'utilisateur doit être membre du restaurant de cette commande
        const order = await prisma.order.findFirst({
            where: { 
                id: orderId,  // ✅ Utiliser orderId
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
            console.log('❌ [API] Commande introuvable ou accès refusé')
            return NextResponse.json(
                { error: 'Commande introuvable ou accès refusé' },
                { status: 404 }
            )
        }

        // Validation des transitions de statut autorisées
        // Certaines transitions ne sont pas logiques (ex: delivered → pending)
        const transitions: Record<OrderStatus, OrderStatus[]> = {
            pending: ['preparing', 'cancelled'],
            preparing: ['ready', 'cancelled'],
            ready: ['delivered', 'cancelled'],
            delivered: [],  // Une commande délivrée ne peut plus changer
            cancelled: [],  // Une commande annulée ne peut plus changer
        }

        const currentStatus = order.status as OrderStatus

        if (!transitions[currentStatus].includes(newStatus)) {
            console.log('❌ [API] Transition invalide:', currentStatus, '→', newStatus)
            return NextResponse.json(
                { 
                    error: 'Transition invalide',
                    message: `Impossible de passer de "${currentStatus}" à "${newStatus}"`
                },
                { status: 400 }
            )
        }

        console.log('🔄 [API] Transition valide:', currentStatus, '→', newStatus)

        // Mettre à jour le statut de la commande
        await prisma.order.update({
            where: { id: orderId },  // ✅ Utiliser orderId
            data: { 
                status: newStatus,
                updatedAt: new Date()
            },
        })

        // Trigger une notification PostgreSQL pour le temps réel
        // Cela permet aux clients connectés de recevoir la mise à jour
        await prisma.$executeRaw`
            SELECT pg_notify(
                'order_update',
                json_build_object(
                    'id', ${orderId}::text,
                    'status', ${newStatus}::text,
                    'restaurant_id', ${order.restaurantId}::text
                )::text
            )
        `

        console.log('✅ [API] Statut mis à jour avec succès')

        return NextResponse.json({ 
            success: true,
            message: 'Statut mis à jour',
            order: {
                id: orderId,
                status: newStatus
            }
        })

    } catch (error) {
        console.error('💥 [API] Erreur changement statut:', error)
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        )
    }
}