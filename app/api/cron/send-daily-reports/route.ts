// app/api/cron/send-daily-reports/route.ts

import {NextResponse} from 'next/server'
import prisma from '@/lib/prisma'
import {supabaseAdmin} from '@/lib/supabase/admin'
import {sendDailyReportEmail} from '@/lib/email/cron-emails'

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * CRON JOB : Envoi des rapports d'activité quotidiens
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Fréquence : Tous les jours à 7h du matin (configurer dans vercel.json)
 *
 * Logique :
 *   Pour chaque restaurant actif avec abonnement trial ou active,
 *   on calcule les stats du jour (commandes, CA, top produits) et
 *   on envoie un email récapitulatif à l'admin.
 *
 * Données calculées :
 *   - Nombre de commandes du jour
 *   - Chiffre d'affaires du jour
 *   - Panier moyen
 *   - Top 5 produits (par CA)
 *   - Répartition par statut de commande
 *   - Comparaison avec la veille (évolution en %)
 *
 * Performance :
 *   ✅ supabaseAdmin singleton (pas de reconnexion par restaurant)
 *   ✅ Emails admin récupérés en 1 batch avant la boucle (Promise.all)
 *   ✅ Map pour lookup O(1) des emails
 *   ✅ Pour chaque restaurant : orders + yesterdayStats en parallèle
 */
export async function GET(request: Request) {
    try {
        // ── Vérification du token ───────────────────────────────────────────
        const authHeader = request.headers.get('authorization')
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({error: 'Unauthorized'}, {status: 401})
        }

        const now = new Date()

        // ── Calcul des bornes temporelles ────────────────────────────────────
        // On utilise des bornes précises (minuit → minuit) pour éviter
        // les effets de bord liés aux timezones ou aux heures d'exécution
        const today = new Date(now)
        today.setHours(0, 0, 0, 0) // Début du jour courant

        const yesterday = new Date(today)
        yesterday.setDate(today.getDate() - 1) // Début d'hier

        const tomorrow = new Date(today)
        tomorrow.setDate(today.getDate() + 1) // Début de demain (= fin du jour courant)

        // ── 1. Restaurants éligibles ─────────────────────────────────────────
        // On envoie le rapport uniquement aux restaurants actifs
        // avec un abonnement en cours (trial ou active)
        const activeRestaurants = await prisma.restaurant.findMany({
            where: {
                isActive: true,
                subscription: {status: {in: ['trial', 'active']}},
            },
            select: {
                id: true,
                name: true,
                users: {
                    where: {role: 'admin'},
                    take: 1,                    // On prend 1 seul admin par restaurant
                    select: {userId: true},
                },
            },
        })

        if (activeRestaurants.length === 0) {
            return NextResponse.json({success: true, emailsSent: 0})
        }

        // ── 2. Emails admin en 1 batch ───────────────────────────────────────
        // On extrait les userIds valides (restaurants sans admin sont exclus)
        const adminUserIds = activeRestaurants
            .map((r) => r.users[0]?.userId)
            .filter(Boolean) as string[]

        // Tous les appels Supabase Auth en parallèle — pas de boucle séquentielle
        const emailResults = await Promise.all(
            adminUserIds.map((uid) => supabaseAdmin.auth.admin.getUserById(uid))
        )

        // Map userId → email pour lookup O(1) dans la boucle restaurant
        const emailByUserId = new Map<string, string>()
        adminUserIds.forEach((uid, i) => {
            const email = emailResults[i]?.data?.user?.email
            if (email) emailByUserId.set(uid, email)
        })

        const emailsSent: Array<{ restaurant: string }> = []
        const emailsSkipped: Array<{ restaurant: string; reason: string }> = []

        // ── 3. Traitement de chaque restaurant ──────────────────────────────
        // La boucle reste séquentielle pour éviter de surcharger la BDD
        // en cas de nombreux restaurants (chaque itération fait déjà 2 requêtes)
        for (const restaurant of activeRestaurants) {
            try {
                const adminUserId = restaurant.users[0]?.userId
                if (!adminUserId) {
                    emailsSkipped.push({restaurant: restaurant.name, reason: 'Aucun admin trouvé'})
                    continue
                }

                const email = emailByUserId.get(adminUserId)
                if (!email) {
                    emailsSkipped.push({restaurant: restaurant.name, reason: 'Email admin introuvable'})
                    continue
                }

                // ── Données du rapport en parallèle ──────────────────────────
                // Les commandes du jour et les stats de la veille sont
                // indépendantes → on les récupère simultanément
                const [orders, yesterdayStats] = await Promise.all([
                    // Toutes les commandes du jour (pour le détail produits)
                    prisma.order.findMany({
                        where: {
                            restaurantId: restaurant.id,
                            createdAt: {gte: today, lt: tomorrow},
                        },
                        include: {orderItems: true},
                    }),
                    // Agrégat d'hier : seulement le total pour la comparaison
                    prisma.order.aggregate({
                        where: {
                            restaurantId: restaurant.id,
                            createdAt: {gte: yesterday, lt: today},
                        },
                        _sum: {totalAmount: true},
                    }),
                ])

                // ── Calcul des métriques ──────────────────────────────────────

                const ordersCount = orders.length
                const revenue = orders.reduce((sum, o) => sum + o.totalAmount, 0)
                // Panier moyen : 0 si aucune commande pour éviter la division par zéro
                const avgBasket = ordersCount > 0 ? Math.round(revenue / ordersCount) : 0

                // Répartition des commandes par statut
                // { pending: 2, delivered: 5, cancelled: 1, ... }
                const statusBreakdown: Record<string, number> = {}
                orders.forEach((o) => {
                    statusBreakdown[o.status] = (statusBreakdown[o.status] || 0) + 1
                })

                // Top 5 produits triés par CA décroissant
                // On agrège en mémoire plutôt qu'en SQL pour réutiliser
                // les orderItems déjà chargés
                const topProductsMap: Record<
                    string,
                    { name: string; quantity: number; revenue: number }
                > = {}
                orders.forEach((o) => {
                    o.orderItems.forEach((item) => {
                        if (!topProductsMap[item.productName]) {
                            topProductsMap[item.productName] = {
                                name: item.productName,
                                quantity: 0,
                                revenue: 0,
                            }
                        }
                        topProductsMap[item.productName].quantity += item.quantity
                        topProductsMap[item.productName].revenue += item.quantity * item.unitPrice
                    })
                })
                const topProducts = Object.values(topProductsMap)
                    .sort((a, b) => b.revenue - a.revenue)
                    .slice(0, 5)

                // Évolution par rapport à la veille en %
                // Si la veille = 0 et aujourd'hui > 0 → +100% (premier CA)
                // Si la veille = 0 et aujourd'hui = 0 → 0% (rien non plus)
                const previousDayRevenue = yesterdayStats._sum.totalAmount || 0
                const evolution =
                    previousDayRevenue > 0
                        ? Math.round(((revenue - previousDayRevenue) / previousDayRevenue) * 100)
                        : revenue > 0
                            ? 100
                            : 0

                // ── Envoi de l'email ──────────────────────────────────────────
                await sendDailyReportEmail({
                    to: email,
                    data: {
                        restaurantName: restaurant.name,
                        date: today.toLocaleDateString('fr-FR'),
                        ordersCount,
                        revenue,
                        avgBasket,
                        topProducts,
                        statusBreakdown,
                        comparison: {previousDay: previousDayRevenue, evolution},
                    },
                })

                emailsSent.push({restaurant: restaurant.name})
            } catch (err) {
                // On ne fait pas échouer tout le CRON si un restaurant plante
                emailsSkipped.push({
                    restaurant: restaurant.name,
                    reason: err instanceof Error ? err.message : 'Erreur inconnue',
                })
            }
        }

        // ── Rapport final ────────────────────────────────────────────────────
        const report = {
            timestamp: now.toISOString(),
            totalRestaurantsChecked: activeRestaurants.length,
            emailsSent: emailsSent.length,
            emailsSkipped: emailsSkipped.length,
            details: {sent: emailsSent, skipped: emailsSkipped},
        }

        console.log('✅ Cron send-daily-reports terminé:', report)
        return NextResponse.json({success: true, ...report})
    } catch (error) {
        console.error('❌ Erreur dans send-daily-reports:', error)
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            },
            {status: 500}
        )
    }
}