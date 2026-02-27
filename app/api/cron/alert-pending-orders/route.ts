// app/api/cron/alert-pending-orders/route.ts

import {NextResponse} from 'next/server'
import prisma from '@/lib/prisma'
import {supabaseAdmin} from '@/lib/supabase/admin'
import {sendPendingOrderAlertEmail} from '@/lib/email/cron-emails'

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * CRON JOB : Alerte commandes en attente trop longtemps
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Fréquence : Toutes les 15 minutes (configurer dans vercel.json)
 *
 * Corrections v2 :
 *   ✅ Admins trouvés via role enum OU roleId pointant vers un rôle admin
 *   ✅ Commandes POS pay_later (source=counter, stock_deducted=false) exclues
 *      → ce sont des commandes en attente de service normal, pas des anomalies
 *   ✅ productName utilise le snapshot (item.productName) et non product.name
 *      → évite les null si le produit a été supprimé depuis la commande
 */

export const dynamic = 'force-dynamic'

const THRESHOLD_MINUTES = 15

interface PendingOrderAlert {
    orderNumber: string
    totalAmount: number
    items: { productName: string; quantity: number; unitPrice: number }[]
    minutesOld: number
    createdAt: string
}

export async function GET(req: Request) {
    try {
        // ── Auth ────────────────────────────────────────────────────
        const authHeader = req.headers.get('authorization')
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return new NextResponse('Unauthorized', {status: 401})
        }

        const thresholdDate = new Date(Date.now() - THRESHOLD_MINUTES * 60 * 1000)

        // ── 1. Commandes en attente trop longtemps ───────────────────
        // On EXCLUT :
        //   - source = 'counter' ET stock_deducted = false
        //     → commandes POS pay_later, normalement en attente de service
        //   - source = 'counter' ET stock_deducted = true
        //     → commandes POS pay_now déjà encaissées, juste pas encore servies
        //
        // On GARDE :
        //   - toutes les commandes QR, public_link, dashboard en pending
        //     depuis plus de THRESHOLD_MINUTES
        const pendingOrders = await prisma.order.findMany({
            where: {
                status: 'pending',
                createdAt: {lte: thresholdDate},
                // Exclure les commandes comptoir POS (elles ont leur propre flux)
                NOT: {source: 'counter'},
            },
            include: {
                restaurant: {select: {id: true, name: true}},
                orderItems: {
                    select: {
                        productName: true, // ← snapshot au moment de la commande
                        quantity: true,
                        unitPrice: true,
                    },
                },
            },
        })

        if (pendingOrders.length === 0) {
            return NextResponse.json({success: true, sent: 0, processedOrders: 0})
        }

        let totalEmailsSent = 0

        for (const order of pendingOrders) {
            const minutesOld = Math.floor(
                (Date.now() - order.createdAt.getTime()) / 60000
            )

            const orderDetails: PendingOrderAlert = {
                orderNumber: order.orderNumber ?? `CMD-${order.id.slice(0, 6).toUpperCase()}`,
                totalAmount: Number(order.totalAmount ?? 0),
                minutesOld,
                createdAt: order.createdAt.toISOString(),
                items: order.orderItems.map(item => ({
                    productName: item.productName, // snapshot — jamais null
                    quantity: item.quantity,
                    unitPrice: Number(item.unitPrice),
                })),
            }

            // ── 2. Trouver les admins du restaurant ──────────────────
            //
            // AVANT (cassé) : where: { role: 'admin' }
            //   → ne trouve pas les admins qui ont un rôle custom (roleId != null)
            //     car leur champ `role` (UserRole enum) est NULL dans ce cas.
            //
            // APRÈS (correct) : OR entre les deux cas :
            //   a) role = 'admin' (enum, utilisateurs sans rôle custom)
            //   b) customRole.name = 'admin' (rôle custom nommé "admin")
            //      → isSystem = true garantit que c'est bien le rôle système admin
            const admins = await prisma.restaurantUser.findMany({
                where: {
                    restaurantId: order.restaurant.id,
                    OR: [
                        // Cas a : rôle enum natif
                        {role: 'admin'},
                        // Cas b : rôle personnalisé système nommé "admin"
                        {customRole: {name: 'admin', isSystem: true}},
                    ],
                },
                select: {userId: true},
            })

            if (admins.length === 0) continue

            // ── 3. Récupérer les emails en parallèle ─────────────────
            const emailResults = await Promise.all(
                admins.map(admin => supabaseAdmin.auth.admin.getUserById(admin.userId))
            )

            const emails = emailResults
                .filter(r => !r.error && r.data?.user?.email)
                .map(r => r.data.user!.email!)

            if (emails.length === 0) continue

            // ── 4. Envoyer les emails en parallèle ───────────────────
            await Promise.all(
                emails.map(async email => {
                    await sendPendingOrderAlertEmail({
                        to: email,
                        restaurantName: order.restaurant.name,
                        order: orderDetails,
                    })
                    totalEmailsSent++
                })
            )
        }

        return NextResponse.json({
            success: true,
            processedOrders: pendingOrders.length,
            emailsSent: totalEmailsSent,
        })

    } catch (error) {
        console.error('CRON ERROR [alert-pending-orders]:', error)
        return new NextResponse('Internal Server Error', {status: 500})
    }
}