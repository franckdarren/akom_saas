// app/api/orders/[orderId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

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

        console.log('============================================')
        console.log('🔍 [API] GET /api/orders/[orderId]')
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

        // Récupérer la commande complète avec ses items
        const { data: order, error } = await supabaseAdmin
            .from('orders')
            .select(`
                id,
                order_number,
                status,
                total_amount,
                customer_name,
                created_at,
                updated_at,
                notes,
                order_items (
                    id,
                    product_name,
                    quantity,
                    unit_price
                )
            `)
            .eq('id', orderId)
            .single()

        if (error || !order) {
            console.log('❌ [API] Commande non trouvée:', error?.message)
            return NextResponse.json(
                { error: 'Commande non trouvée' },
                { status: 404 }
            )
        }

        console.log('✅ [API] Commande trouvée:', order.order_number, order.status)

        return NextResponse.json({ order })

    } catch (error) {
        console.error('💥 [API] Erreur récupération commande:', error)
        return NextResponse.json(
            { error: 'Erreur serveur interne' },
            { status: 500 }
        )
    }
}