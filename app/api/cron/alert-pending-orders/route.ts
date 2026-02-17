import {NextResponse} from 'next/server'
import prisma from '@/lib/prisma'
import {sendPendingOrderAlertEmail} from '@/lib/email/cron-emails'
import {createClient} from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// Supabase admin client (SERVICE ROLE KEY obligatoire en prod)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface PendingOrderAlert {
    orderNumber: string
    totalAmount: number
    items: {
        productName: string
        quantity: number
        unitPrice: number
    }[]
    minutesOld: number
    createdAt: string
}

export async function GET(req: Request) {
    try {
        // Sécurité simple (optionnel)
        const authHeader = req.headers.get('authorization')
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return new NextResponse('Unauthorized', {status: 401})
        }

        const THRESHOLD_MINUTES = 15
        const thresholdDate = new Date(
            Date.now() - THRESHOLD_MINUTES * 60 * 1000
        )

        // 1️⃣ Récupérer commandes en attente
        const pendingOrders = await prisma.order.findMany({
            where: {
                status: 'pending',
                createdAt: {
                    lte: thresholdDate,
                },
            },
            include: {
                restaurant: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                orderItems: {
                    include: {
                        product: {
                            select: {name: true},
                        },
                    },
                },
            },
        })

        if (pendingOrders.length === 0) {
            return NextResponse.json({success: true, sent: 0})
        }

        let totalEmailsSent = 0

        // 2️⃣ Boucle sur commandes
        for (const order of pendingOrders) {
            const minutesOld = Math.floor(
                (Date.now() - order.createdAt.getTime()) / 60000
            )

            // 3️⃣ Construire objet sécurisé
            const orderDetails: PendingOrderAlert = {
                orderNumber:
                    order.orderNumber ?? `CMD-${order.id.slice(0, 6)}`,
                totalAmount: Number(order.totalAmount ?? 0),
                minutesOld,
                createdAt: order.createdAt.toISOString(),
                items: order.orderItems.map((item) => ({
                    productName: item.product?.name ?? 'Produit inconnu',
                    quantity: item.quantity ?? 0,
                    unitPrice: Number(item.unitPrice ?? 0),
                })),
            }

            // 4️⃣ Récupérer admins du restaurant
            const admins = await prisma.restaurantUser.findMany({
                where: {
                    restaurantId: order.restaurant.id,
                    role: 'admin',
                },
                select: {
                    userId: true,
                },
            })

            if (admins.length === 0) continue

            // 5️⃣ Récupérer emails via Supabase Admin
            const emails: string[] = []

            for (const admin of admins) {
                const {data, error} =
                    await supabaseAdmin.auth.admin.getUserById(admin.userId)

                if (!error && data?.user?.email) {
                    emails.push(data.user.email)
                }
            }

            if (emails.length === 0) continue

            // 6️⃣ Envoyer emails
            for (const email of emails) {
                await sendPendingOrderAlertEmail({
                    to: email,
                    restaurantName: order.restaurant.name,
                    order: orderDetails,
                })

                totalEmailsSent++
            }
        }

        return NextResponse.json({
            success: true,
            processedOrders: pendingOrders.length,
            emailsSent: totalEmailsSent,
        })
    } catch (error) {
        console.error('CRON ERROR:', error)
        return new NextResponse('Internal Server Error', {status: 500})
    }
}
