// app/api/cron/alert-pending-orders/route.ts

import {NextRequest, NextResponse} from 'next/server'
import prisma from '@/lib/prisma'
import {logSystemAction} from '@/lib/actions/logs'
import {sendPendingOrderAlertEmail} from '@/lib/email/cron-emails'
import {createClient} from '@supabase/supabase-js'

/**
 * CRON JOB : Alertes pour commandes non traitées
 * Fréquence : Toutes les 15 minutes
 * Logique : Envoie une alerte si une commande reste en "pending" > 15 minutes
 */

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // ⚠️ DOIT être configuré en prod
)

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization')
        const token = authHeader?.replace('Bearer ', '')

        if (!token || token !== process.env.CRON_SECRET) {
            console.error('❌ Tentative d\'accès non autorisée au CRON')
            return NextResponse.json({error: 'Non autorisé'}, {status: 401})
        }

        console.log('🔄 Démarrage des alertes commandes non traitées...')

        const fifteenMinutesAgo = new Date()
        fifteenMinutesAgo.setMinutes(fifteenMinutesAgo.getMinutes() - 15)

        const pendingOrders = await prisma.order.findMany({
            where: {
                status: 'pending',
                createdAt: {lt: fifteenMinutesAgo},
                restaurant: {
                    isActive: true,
                    subscription: {status: {in: ['trial', 'active']}},
                },
            },
            include: {
                restaurant: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                table: {select: {number: true}},
                orderItems: {
                    include: {
                        product: {select: {name: true}},
                    },
                },
            },
        })

        if (pendingOrders.length === 0) {
            console.log('✅ Aucune commande non traitée à signaler')
            return NextResponse.json({
                success: true,
                message: 'Toutes les commandes sont prises en charge',
                alertsSent: 0,
            })
        }

        console.log(`⚠️ ${pendingOrders.length} commande(s) non traitée(s)`)

        const alertsSent = []

        for (const order of pendingOrders) {
            // 🔎 Vérifie si alerte déjà envoyée
            const existingAlert = await prisma.systemLog.findFirst({
                where: {
                    action: 'pending_order_alert_sent',
                    metadata: {
                        path: ['orderId'],
                        equals: order.id,
                    },
                },
            })

            if (existingAlert) {
                console.log(`⏭️ Commande ${order.orderNumber} déjà notifiée`)
                continue
            }

            try {
                // 1️⃣ Récupérer tous les admins du restaurant
                const admins = await prisma.restaurantUser.findMany({
                    where: {
                        restaurantId: order.restaurantId,
                        role: 'admin', // basé sur ton enum UserRole
                    },
                    select: {
                        userId: true,
                    },
                })

                if (admins.length === 0) {
                    console.log(`⚠️ Aucun admin trouvé pour ${order.restaurant.name}`)
                    continue
                }

                // 2️⃣ Récupérer leurs emails via Supabase Admin
                const emailsSet = new Set<string>()

                for (const admin of admins) {
                    const {data, error} =
                        await supabaseAdmin.auth.admin.getUserById(admin.userId)

                    if (!error && data?.user?.email) {
                        emailsSet.add(data.user.email)
                    }
                }

                const emails = Array.from(emailsSet)

                if (emails.length === 0) {
                    console.log(`⚠️ Aucun email valide pour ${order.restaurant.name}`)
                    continue
                }

                const minutesOld = Math.floor(
                    (Date.now() - order.createdAt.getTime()) / (1000 * 60)
                )

                const orderDetails = {
                    orderNumber: order.orderNumber,
                    tableNumber: order.table?.number || 'N/A',
                    totalAmount: order.totalAmount,
                    items: order.orderItems.map((item) => ({
                        productName: item.product.name,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                    })),
                    minutesOld,
                    createdAt: order.createdAt.toISOString(),
                }

                // 3️⃣ Envoi email à tous les admins
                for (const email of emails) {
                    await sendPendingOrderAlertEmail({
                        to: email,
                        restaurantName: order.restaurant.name,
                        order: orderDetails,
                    })
                }

                alertsSent.push({
                    orderId: order.id,
                    orderNumber: order.orderNumber,
                    restaurantName: order.restaurant.name,
                    minutesOld,
                    emailsCount: emails.length,
                    emailSent: true,
                })

                await logSystemAction(
                    'pending_order_alert_sent',
                    {
                        orderId: order.id,
                        orderNumber: order.orderNumber,
                        restaurantId: order.restaurantId,
                        minutesOld,
                        emailsSent: emails,
                    },
                    'warning'
                )

                console.log(
                    `✅ Alerte envoyée : ${order.orderNumber} (${minutesOld}min) → ${emails.length} admin(s)`
                )
            } catch (emailError) {
                console.error(
                    `❌ Erreur email commande ${order.orderNumber}:`,
                    emailError
                )

                alertsSent.push({
                    orderId: order.id,
                    orderNumber: order.orderNumber,
                    restaurantName: order.restaurant.name,
                    emailSent: false,
                    error:
                        emailError instanceof Error
                            ? emailError.message
                            : 'Erreur inconnue',
                })

                await logSystemAction(
                    'pending_order_alert_failed',
                    {
                        orderId: order.id,
                        orderNumber: order.orderNumber,
                        error:
                            emailError instanceof Error
                                ? emailError.message
                                : 'Erreur inconnue',
                    },
                    'error'
                )
            }
        }

        const successCount = alertsSent.filter((a) => a.emailSent).length

        console.log('✅ Envoi des alertes commandes terminé')

        return NextResponse.json({
            success: true,
            message: `${successCount} alerte(s) envoyée(s)`,
            alertsSent: successCount,
            totalPendingOrders: pendingOrders.length,
            details: alertsSent,
            executedAt: new Date().toISOString(),
        })
    } catch (error) {
        console.error('❌ Erreur alertes commandes:', error)

        await logSystemAction(
            'cron_error',
            {
                task: 'alert-pending-orders',
                error:
                    error instanceof Error ? error.message : 'Erreur inconnue',
            },
            'error'
        )

        return NextResponse.json(
            {
                error: "Erreur lors de l'envoi des alertes",
                details:
                    error instanceof Error ? error.message : 'Erreur inconnue',
            },
            {status: 500}
        )
    }
}
