// app/api/cron/check-subscriptions/route.ts

import {NextResponse} from 'next/server'
import prisma from '@/lib/prisma'

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * CRON JOB : Vérification et expiration des abonnements
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Fréquence : Toutes les heures (configurer dans vercel.json)
 *
 * Logique :
 *   Ce CRON compare les dates d'expiration des abonnements avec "maintenant".
 *   Si un abonnement a dépassé sa date de fin, il passe en statut "expired".
 *   Le CRON suspend-expired-restaurants se charge ensuite de désactiver
 *   les restaurants concernés (séparation des responsabilités).
 *
 * Deux cas gérés :
 *   1. Trials expirés : status = "trial" ET trialEndsAt < now
 *   2. Abonnements payés expirés : status = "active" ET currentPeriodEnd < now
 *
 * Pourquoi toutes les heures et pas une fois par jour ?
 *   - Réactivité : un abonnement payé à 14h est actif dans l'heure
 *   - Redondance : si une exécution échoue, la suivante prend le relais
 *   - Faible coût : la requête est légère (filtre sur index, peu de lignes)
 *
 * Pipeline CRON complet pour les abonnements :
 *   check-subscriptions (1x/h)     → passe les abonnements en "expired"
 *   suspend-expired-restaurants (1x/h) → désactive les restaurants "expired"
 *   send-subscription-reminders (1x/h) → envoie les rappels J-7, J-3, J-1
 *
 * Correction apportée vs version originale :
 *   ✅ $transaction(N updates) → updateMany : 1 requête SQL au lieu de N
 *      L'ancienne transaction garantissait l'atomicité mais au prix de
 *      N requêtes individuelles. updateMany est atomique ET plus efficace.
 */
export async function GET(request: Request) {
    try {
        // ── Vérification du token ───────────────────────────────────────────
        // Vercel injecte automatiquement ce header lors des appels cron planifiés
        const authHeader = request.headers.get('authorization')
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({error: 'Unauthorized'}, {status: 401})
        }

        const now = new Date()

        // ── 1. Trials expirés ───────────────────────────────────────────────
        // Un trial est expiré quand sa date de fin est passée
        // (même si l'utilisateur n'a jamais ouvert le dashboard)
        const expiredTrials = await prisma.subscription.findMany({
            where: {
                status: 'trial',
                trialEndsAt: {lt: now}, // "less than" = date de fin dépassée
            },
            select: {
                id: true,
                restaurantId: true,
                restaurant: {select: {name: true}},
            },
        })

        // ── 2. Abonnements payés expirés ────────────────────────────────────
        // currentPeriodEnd est null pour les trials → on filtre uniquement "active"
        // pour éviter de retourner des lignes non pertinentes
        const expiredActive = await prisma.subscription.findMany({
            where: {
                status: 'active',
                currentPeriodEnd: {lt: now}, // Période de facturation terminée
            },
            select: {
                id: true,
                restaurantId: true,
                restaurant: {select: {name: true}},
            },
        })

        const allExpired = [...expiredTrials, ...expiredActive]

        // ── 3. Mise à jour en une seule requête ─────────────────────────────
        // ✅ updateMany : 1 requête SQL pour tous les abonnements expirés
        // Atomique par nature (une seule opération) et plus efficace
        // que $transaction(allExpired.map(sub => update(sub.id)))
        if (allExpired.length > 0) {
            await prisma.subscription.updateMany({
                where: {id: {in: allExpired.map((sub) => sub.id)}},
                data: {status: 'expired'},
            })
        }

        // ── Rapport pour les logs Vercel ────────────────────────────────────
        const report = {
            timestamp: now.toISOString(),
            totalExpired: allExpired.length,
            expiredTrials: expiredTrials.length,
            expiredActive: expiredActive.length,
            // Liste des restaurants impactés — utile pour le debug
            restaurants: allExpired.map((sub) => ({
                restaurantId: sub.restaurantId,
                name: sub.restaurant.name,
            })),
        }

        console.log('✅ Cron check-subscriptions terminé:', report)

        return NextResponse.json({success: true, ...report})
    } catch (error) {
        console.error('❌ Erreur dans check-subscriptions:', error)

        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            },
            {status: 500}
        )
    }
}