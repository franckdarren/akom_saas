// app/api/cron/send-daily-reports/route.ts
import {NextResponse} from 'next/server'
import prisma from '@/lib/prisma'
import {sendDailyReportEmail} from '@/lib/email/cron-emails'

export async function GET(request: Request) {
    try {
        // Vérification du secret pour sécuriser le cron
        const authHeader = request.headers.get('authorization')
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({error: 'Unauthorized'}, {status: 401})
        }

        const now = new Date()

        // On récupère tous les restaurants avec abonnement actif ou trial
        const activeRestaurants = await prisma.restaurant.findMany({
            where: {
                subscription: {
                    status: {in: ['trial', 'active']},
                },
            },
            select: {
                id: true,
                name: true,
                users: {
                    where: {role: 'admin'},
                    take: 1,
                    select: {userId: true}
                }
            }
        })

        const emailsSent: Array<{ restaurant: string }> = []
        const emailsSkipped: Array<{ restaurant: string; reason: string }> = []

        for (const restaurant of activeRestaurants) {
            try {
                const adminUserId = restaurant.users[0]?.userId
                if (!adminUserId) {
                    emailsSkipped.push({
                        restaurant: restaurant.name,
                        reason: 'No admin user found'
                    })
                    continue
                }

                // On récupère l'email via Supabase
                const {createClient} = await import('@supabase/supabase-js')
                const supabase = createClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL!,
                    process.env.SUPABASE_SERVICE_ROLE_KEY!
                )
                const {data: user} = await supabase.auth.admin.getUserById(adminUserId)

                if (!user?.user?.email) {
                    emailsSkipped.push({
                        restaurant: restaurant.name,
                        reason: 'No email found for admin'
                    })
                    continue
                }

                // Ici tu peux construire tes données de rapport quotidien
                // Exemple fictif, à adapter selon ta logique métier
                const reportData = {
                    restaurantName: restaurant.name,
                    date: now.toLocaleDateString('fr-FR'),
                    ordersCount: 0,
                    revenue: 0,
                    avgBasket: 0,
                    topProducts: [],
                    statusBreakdown: {},
                    comparison: {previousDay: 0, evolution: 0}
                }

                await sendDailyReportEmail({
                    to: user.user.email,
                    data: reportData
                })

                emailsSent.push({restaurant: restaurant.name})

            } catch (error) {
                emailsSkipped.push({
                    restaurant: restaurant.name,
                    reason: error instanceof Error ? error.message : 'Unknown error'
                })
            }
        }

        const report = {
            timestamp: now.toISOString(),
            totalRestaurantsChecked: activeRestaurants.length,
            emailsSent: emailsSent.length,
            emailsSkipped: emailsSkipped.length,
            details: {sent: emailsSent, skipped: emailsSkipped}
        }

        console.log('✅ Cron send-daily-reports terminé:', report)
        return NextResponse.json({success: true, ...report})

    } catch (error) {
        console.error('❌ Erreur dans send-daily-reports:', error)
        return NextResponse.json(
            {success: false, error: error instanceof Error ? error.message : 'Unknown error'},
            {status: 500}
        )
    }
}
