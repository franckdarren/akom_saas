// app/api/cron/send-subscription-reminders/route.ts

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { sendSubscriptionReminderEmail, getEmailTypeForDaysRemaining } from '@/lib/email/send'

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('authorization')

        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const now = new Date()

        const activeSubscriptions = await prisma.subscription.findMany({
            where: {
                status: {
                    in: ['trial', 'active']
                }
            },
            include: {
                restaurant: {
                    select: {
                        id: true,
                        name: true,
                        users: {
                            where: {
                                role: 'admin'
                            },
                            take: 1,
                            select: {
                                userId: true
                            }
                        }
                    }
                }
            }
        })

        const emailsSent: Array<{ restaurant: string; emailType: string }> = []
        const emailsSkipped: Array<{ restaurant: string; reason: string }> = []

        for (const subscription of activeSubscriptions) {
            try {
                // 🔧 FIX : Type guard pour garantir que status est bien 'trial' ou 'active'
                // À ce stade, on SAIT que c'est le cas grâce au filtre dans la requête Prisma,
                // mais TypeScript ne le sait pas. On lui dit explicitement.
                const subscriptionType = subscription.status as 'trial' | 'active'

                const expirationDate = subscriptionType === 'trial'
                    ? subscription.trialEndsAt
                    : subscription.currentPeriodEnd

                if (!expirationDate) {
                    emailsSkipped.push({
                        restaurant: subscription.restaurant.name,
                        reason: 'No expiration date'
                    })
                    continue
                }

                const diffTime = expirationDate.getTime() - now.getTime()
                const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

                if (daysRemaining < 0) {
                    emailsSkipped.push({
                        restaurant: subscription.restaurant.name,
                        reason: 'Already expired'
                    })
                    continue
                }

                const emailType = getEmailTypeForDaysRemaining(
                    daysRemaining,
                    subscriptionType // 🔧 Maintenant TypeScript est content
                )

                if (!emailType) {
                    continue
                }

                const adminUserId = subscription.restaurant.users[0]?.userId

                if (!adminUserId) {
                    emailsSkipped.push({
                        restaurant: subscription.restaurant.name,
                        reason: 'No admin user found'
                    })
                    continue
                }

                const { createClient } = await import('@supabase/supabase-js')
                const supabase = createClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL!,
                    process.env.SUPABASE_SERVICE_ROLE_KEY!
                )

                const { data: user } = await supabase.auth.admin.getUserById(adminUserId)

                if (!user?.user?.email) {
                    emailsSkipped.push({
                        restaurant: subscription.restaurant.name,
                        reason: 'No email found for admin'
                    })
                    continue
                }

                const sent = await sendSubscriptionReminderEmail(
                    {
                        subscriptionId: subscription.id,
                        restaurantId: subscription.restaurantId,
                        restaurantName: subscription.restaurant.name,
                        recipientEmail: user.user.email,
                        daysRemaining,
                        expirationDate,
                        subscriptionType // 🔧 Et ici aussi
                    },
                    emailType
                )

                if (sent) {
                    emailsSent.push({
                        restaurant: subscription.restaurant.name,
                        emailType
                    })
                }

            } catch (error) {
                console.error(
                    `Erreur traitement abonnement ${subscription.id}:`,
                    error
                )
                emailsSkipped.push({
                    restaurant: subscription.restaurant.name,
                    reason: error instanceof Error ? error.message : 'Unknown error'
                })
            }
        }

        const report = {
            timestamp: now.toISOString(),
            totalSubscriptionsChecked: activeSubscriptions.length,
            emailsSent: emailsSent.length,
            emailsSkipped: emailsSkipped.length,
            details: {
                sent: emailsSent,
                skipped: emailsSkipped
            }
        }

        console.log('✅ Cron send-subscription-reminders terminé:', report)

        return NextResponse.json({
            success: true,
            ...report
        })

    } catch (error) {
        console.error('❌ Erreur dans send-subscription-reminders:', error)

        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}