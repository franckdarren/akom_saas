// app/api/cron/suspend-expired-restaurants/route.ts

import {NextRequest, NextResponse} from 'next/server'
import prisma from '@/lib/prisma'
import {logSystemAction} from '@/lib/actions/logs'
import {notifyRestaurantAdmins} from '@/lib/notifications'

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * CRON JOB : Suspension des restaurants avec abonnement expiré
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Fréquence : Toutes les heures (configurer dans vercel.json)
 *
 * Pipeline d'expiration (3 CRONs qui s'enchaînent) :
 *   1. check-subscriptions      → passe les abonnements en status "expired"
 *   2. suspend-expired-restaurants → désactive les restaurants "expired" (ce CRON)
 *   3. send-subscription-reminders → envoie les rappels avant expiration
 *
 * Logique :
 *   On cherche les abonnements en status "expired" dont le restaurant
 *   est encore actif (isActive = true), et on les désactive.
 *   On ne touche pas aux restaurants déjà désactivés pour éviter
 *   des mises à jour inutiles et des logs parasites.
 *
 * Pourquoi séparer check-subscriptions et suspend-expired-restaurants ?
 *   Séparation des responsabilités :
 *   - check-subscriptions s'occupe uniquement du statut d'abonnement
 *   - ce CRON s'occupe uniquement de l'état du restaurant
 *   Si demain on veut envoyer un email de suspension, on l'ajoute ici
 *   sans toucher à la logique de vérification des abonnements.
 *
 * Performance :
 *   ✅ updateMany : 1 requête SQL au lieu de N updates en transaction
 *   ✅ Logs en parallèle (Promise.all)
 */
export async function GET(request: NextRequest) {
    try {
        // ── Vérification du token ───────────────────────────────────────────
        const authHeader = request.headers.get('authorization')
        const token = authHeader?.replace('Bearer ', '')

        if (!token || token !== process.env.CRON_SECRET) {
            console.error("❌ Tentative d'accès non autorisée au CRON")
            return NextResponse.json({error: 'Non autorisé'}, {status: 401})
        }

        console.log('🔄 Démarrage de la suspension des restaurants expirés...')

        // ── 1. Abonnements expirés avec leur restaurant ──────────────────────
        // On charge le restaurant pour vérifier son isActive actuel
        // et pour avoir le nom dans les logs
        const expiredSubscriptions = await prisma.subscription.findMany({
            where: {status: 'expired'},
            include: {
                restaurant: {
                    select: {id: true, name: true, isActive: true},
                },
            },
        })

        // ── 2. Filtrage : uniquement ceux dont le restaurant est encore actif ─
        // Évite d'écrire des updateMany et des logs inutiles sur des
        // restaurants déjà suspendus lors d'une exécution précédente
        const restaurantsToSuspend = expiredSubscriptions.filter(
            (sub) => sub.restaurant.isActive === true
        )

        if (restaurantsToSuspend.length === 0) {
            console.log('✅ Aucun restaurant à suspendre')
            return NextResponse.json({
                success: true,
                message: 'Aucun restaurant à suspendre',
                suspended: 0,
            })
        }

        console.log(`⚠️ ${restaurantsToSuspend.length} restaurant(s) à suspendre`)

        // ── 3. Suspension en une seule requête ──────────────────────────────
        // updateMany : 1 requête SQL pour tous les restaurants concernés.
        // L'ancienne version utilisait $transaction(N updates) ce qui
        // générait N requêtes individuelles dans une transaction — inutilement coûteux
        await prisma.restaurant.updateMany({
            where: {id: {in: restaurantsToSuspend.map((sub) => sub.restaurantId)}},
            data: {isActive: false},
        })

        // ── 4. Logs en parallèle ─────────────────────────────────────────────
        // On log chaque suspension avec les détails du restaurant concerné.
        // Promise.all : tous les logs sont écrits simultanément
        await Promise.all(
            restaurantsToSuspend.map((sub) => {
                console.log(`🔒 Restaurant suspendu : ${sub.restaurant.name}`)

                // Notifier les admins de la suspension — best-effort
                void notifyRestaurantAdmins(sub.restaurantId, 'subscription_suspended')

                return logSystemAction(
                    'restaurant_suspended_auto',
                    {
                        restaurantId: sub.restaurantId,
                        restaurantName: sub.restaurant.name,
                        reason: 'Abonnement expiré',
                        suspendedAt: new Date().toISOString(),
                    },
                    'warning'
                )
            })
        )

        console.log('✅ Suspension terminée avec succès')
        return NextResponse.json({
            success: true,
            message: `${restaurantsToSuspend.length} restaurant(s) suspendu(s)`,
            suspended: restaurantsToSuspend.length,
            restaurants: restaurantsToSuspend.map((sub) => ({
                id: sub.restaurantId,
                name: sub.restaurant.name,
            })),
            executedAt: new Date().toISOString(),
        })
    } catch (error) {
        console.error('❌ Erreur suspension restaurants:', error)

        await logSystemAction(
            'cron_error',
            {
                task: 'suspend-expired-restaurants',
                error: error instanceof Error ? error.message : 'Erreur inconnue',
            },
            'error'
        )

        return NextResponse.json(
            {
                error: 'Erreur lors de la suspension',
                details: error instanceof Error ? error.message : 'Erreur inconnue',
            },
            {status: 500}
        )
    }
}