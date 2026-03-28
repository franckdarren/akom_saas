// app/api/cron/send-subscription-reminders/route.ts

import {NextResponse} from 'next/server'
import prisma from '@/lib/prisma'
import {supabaseAdmin} from '@/lib/supabase/admin'
import {
    sendSubscriptionReminderEmail,
    getEmailTypeForDaysRemaining,
} from '@/lib/email/send'

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * CRON JOB : Rappels d'expiration d'abonnement
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Fréquence : Toutes les heures (configurer dans vercel.json)
 *
 * Logique :
 *   Pour chaque abonnement en cours (trial ou active), on calcule
 *   le nombre de jours restants avant expiration. Si ce nombre
 *   correspond à un palier (J-7, J-3, J-1), on envoie un email.
 *
 * Anti-doublon via SubscriptionEmailLog :
 *   Même si le CRON tourne toutes les heures, un emailType donné
 *   (ex: "trial_7_days") n'est envoyé qu'une seule fois par jour
 *   et par abonnement. On vérifie en base avant chaque envoi.
 *
 * Pipeline abonnements :
 *   check-subscriptions          → passe en "expired"
 *   suspend-expired-restaurants  → désactive le restaurant
 *   send-subscription-reminders  → envoie les rappels (ce CRON)
 *
 * Performance :
 *   ✅ trialSubs et activeSubs chargés en parallèle
 *   ✅ Tous les admins chargés en 1 seul findMany (distinct: restaurantId)
 *   ✅ Tous les emails Supabase Auth récupérés en 1 batch (Promise.all)
 *   ✅ Tous les abonnements traités en parallèle (Promise.all final)
 */
export async function GET(request: Request) {
    try {
        // ── Vérification du token ───────────────────────────────────────────
        const authHeader = request.headers.get('authorization')
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({error: 'Unauthorized'}, {status: 401})
        }

        const now = new Date()
        console.log('🔔 Démarrage send-subscription-reminders...')

        // ── 1. Chargement des abonnements en cours ──────────────────────────
        // On filtre sur gt: now pour ne charger que les abonnements
        // qui n'ont pas encore expiré. Les expirés sont gérés par
        // check-subscriptions + suspend-expired-restaurants.
        const [trialSubs, activeSubs] = await Promise.all([
            prisma.subscription.findMany({
                where: {
                    status: 'trial',
                    trialEndsAt: {gt: now}, // Pas encore expiré
                },
                include: {
                    restaurant: {select: {id: true, name: true}},
                    // On charge tous les logs pour faire le contrôle anti-doublon
                    // en mémoire plutôt qu'avec une requête par abonnement
                    emailLogs: {orderBy: {sentAt: 'desc'}},
                },
            }),
            prisma.subscription.findMany({
                where: {
                    status: 'active',
                    currentPeriodEnd: {gt: now}, // Pas encore expiré
                },
                include: {
                    restaurant: {select: {id: true, name: true}},
                    emailLogs: {orderBy: {sentAt: 'desc'}},
                },
            }),
        ])

        console.log(
            `📋 ${trialSubs.length} trial(s), ${activeSubs.length} abonnement(s) actif(s)`
        )

        // ── 2. Chargement des admins en 1 requête ───────────────────────────
        // distinct: ['restaurantId'] garantit 1 admin max par restaurant,
        // évitant d'envoyer plusieurs emails au même endroit
        const allRestaurantIds = [
            ...trialSubs.map((s) => s.restaurantId),
            ...activeSubs.map((s) => s.restaurantId),
        ]

        const adminUsers = await prisma.restaurantUser.findMany({
            where: {
                restaurantId: {in: allRestaurantIds},
                customRole: {slug: 'admin'},
            },
            select: {restaurantId: true, userId: true},
            distinct: ['restaurantId'],
        })

        // Map restaurantId → userId pour lookup O(1) dans la boucle
        const adminByRestaurant = new Map(
            adminUsers.map((u) => [u.restaurantId, u.userId])
        )

        // ── 3. Récupération des emails en 1 batch Supabase ──────────────────
        // On déduplique les userIds (un admin peut gérer plusieurs restaurants)
        // puis on fait 1 seul Promise.all au lieu de N appels séquentiels
        const uniqueUserIds = [...new Set(adminUsers.map((u) => u.userId))]

        const emailResults = await Promise.all(
            uniqueUserIds.map((uid) => supabaseAdmin.auth.admin.getUserById(uid))
        )

        // Map userId → email pour lookup O(1) dans la boucle
        const emailByUserId = new Map<string, string>()
        uniqueUserIds.forEach((uid, i) => {
            const email = emailResults[i]?.data?.user?.email
            if (email) emailByUserId.set(uid, email)
        })

        // ── 4. Traitement de chaque abonnement ──────────────────────────────

        const sent: string[] = []
        const skipped: string[] = []
        const failed: string[] = []

        type SubWithLogs = (typeof trialSubs)[0] | (typeof activeSubs)[0]

        async function processSubscription(
            sub: SubWithLogs,
            subscriptionType: 'trial' | 'active'
        ) {
            // Date d'expiration selon le type d'abonnement
            const expirationDate =
                subscriptionType === 'trial' ? sub.trialEndsAt : sub.currentPeriodEnd

            // currentPeriodEnd peut être null si l'abonnement n'a jamais été payé
            if (!expirationDate) {
                skipped.push(`${sub.restaurant.name} — pas de date d'expiration`)
                return
            }

            // Nombre de jours restants (arrondi au jour supérieur)
            // Math.ceil pour que "23h restantes" = J-1 et pas J-0
            const msRemaining = expirationDate.getTime() - now.getTime()
            const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24))

            // getEmailTypeForDaysRemaining retourne le type d'email à envoyer
            // selon le palier atteint (J-7, J-3, J-1), ou null si hors palier
            const emailType = getEmailTypeForDaysRemaining(daysRemaining, subscriptionType)

            if (!emailType) {
                // Pas de palier atteint ce jour → rien à envoyer, pas de log
                return
            }

            // ── Anti-doublon ─────────────────────────────────────────────────
            // On vérifie si cet emailType a déjà été envoyé aujourd'hui
            // en filtrant les logs chargés en mémoire (pas de requête BDD)
            const startOfDay = new Date(now)
            startOfDay.setHours(0, 0, 0, 0)

            const alreadySent = sub.emailLogs.some(
                (log) =>
                    log.emailType === emailType &&
                    log.status === 'sent' &&
                    new Date(log.sentAt) >= startOfDay
            )

            if (alreadySent) {
                skipped.push(`${sub.restaurant.name} — ${emailType} déjà envoyé aujourd'hui`)
                return
            }

            // ── Résolution de l'email destinataire ───────────────────────────
            const adminUserId = adminByRestaurant.get(sub.restaurantId)
            if (!adminUserId) {
                skipped.push(`${sub.restaurant.name} — aucun admin trouvé`)
                await logEmail(sub, emailType, '', 'failed', 'Aucun admin trouvé')
                return
            }

            const recipientEmail = emailByUserId.get(adminUserId)
            if (!recipientEmail) {
                skipped.push(`${sub.restaurant.name} — email admin introuvable`)
                await logEmail(sub, emailType, '', 'failed', 'Email introuvable dans Supabase Auth')
                return
            }

            // ── Envoi ────────────────────────────────────────────────────────
            try {
                const success = await sendSubscriptionReminderEmail(
                    {
                        subscriptionId: sub.id,
                        restaurantId: sub.restaurantId,
                        restaurantName: sub.restaurant.name,
                        recipientEmail,
                        daysRemaining,
                        expirationDate,
                        subscriptionType,
                    },
                    emailType
                )

                if (success) {
                    await logEmail(sub, emailType, recipientEmail, 'sent')
                    sent.push(`${sub.restaurant.name} — ${emailType}`)
                    console.log(`✅ Rappel envoyé : ${sub.restaurant.name} (${emailType}, J-${daysRemaining})`)
                } else {
                    await logEmail(sub, emailType, recipientEmail, 'failed', 'sendSubscriptionReminderEmail a retourné false')
                    failed.push(`${sub.restaurant.name} — ${emailType}`)
                }
            } catch (err) {
                const errMsg = err instanceof Error ? err.message : 'Erreur inconnue'
                await logEmail(sub, emailType, recipientEmail, 'failed', errMsg)
                failed.push(`${sub.restaurant.name} — ${emailType} : ${errMsg}`)
                console.error(`❌ Échec envoi ${sub.restaurant.name}:`, err)
            }
        }

        // ── 5. Traitement de tous les abonnements en parallèle ──────────────
        // On spread les deux tableaux dans un seul Promise.all pour
        // traiter trials et actifs simultanément
        await Promise.all([
            ...trialSubs.map((sub) => processSubscription(sub, 'trial')),
            ...activeSubs.map((sub) => processSubscription(sub, 'active')),
        ])

        const result = {
            success: true,
            timestamp: now.toISOString(),
            totalChecked: trialSubs.length + activeSubs.length,
            emailsSent: sent.length,
            emailsSkipped: skipped.length,
            emailsFailed: failed.length,
            details: {sent, skipped, failed},
        }

        console.log('✅ send-subscription-reminders terminé :', result)
        return NextResponse.json(result)
    } catch (error) {
        console.error('❌ Erreur send-subscription-reminders:', error)
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Erreur inconnue',
            },
            {status: 500}
        )
    }
}

// ─── Helper : écriture dans SubscriptionEmailLog ────────────────────────────
// Séparé en fonction pour éviter la duplication et garder processSubscription lisible.
// Le try/catch interne garantit qu'un log raté ne fait jamais échouer le CRON.

async function logEmail(
    sub: { id: string; restaurantId: string },
    emailType: string,
    recipientEmail: string,
    status: 'sent' | 'failed' | 'bounced',
    errorMessage?: string
) {
    try {
        await prisma.subscriptionEmailLog.create({
            data: {
                subscriptionId: sub.id,
                restaurantId: sub.restaurantId,
                emailType,
                recipientEmail,
                status,
                errorMessage: errorMessage ?? null,
            },
        })
    } catch (logErr) {
        // On ne propage pas l'erreur — un log raté ne doit pas
        // faire échouer le CRON ni empêcher les autres envois
        console.error('⚠️ Impossible de logger email:', logErr)
    }
}