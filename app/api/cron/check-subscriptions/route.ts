// app/api/cron/check-subscriptions/route.ts

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * CRON JOB : Vérification des abonnements expirés
 * 
 * Cette route est appelée automatiquement par Vercel toutes les heures.
 * Elle parcourt tous les abonnements actifs et vérifie si leur date
 * de fin est dépassée. Si c'est le cas, elle les passe en statut "expired".
 * 
 * POURQUOI TOUTES LES HEURES ?
 * On pourrait se dire "une fois par jour à minuit suffit", mais en pratique,
 * exécuter toutes les heures offre plusieurs avantages :
 * - Si un utilisateur paie à 14h, son abonnement est activé rapidement
 * - Si un bug empêche l'exécution à une heure donnée, on a 23 autres chances
 * - La charge sur la base est répartie au lieu d'être concentrée à minuit
 * 
 * SÉCURITÉ :
 * Pour éviter que n'importe qui puisse déclencher ce cron (ce qui pourrait
 * causer des problèmes de performance), on va vérifier un token secret dans
 * les headers de la requête. Seul Vercel connaît ce token.
 */

export async function GET(request: Request) {
    try {
        // Vérification du token de sécurité
        // Vercel envoie automatiquement ce header lors des appels cron
        const authHeader = request.headers.get('authorization')

        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const now = new Date()

        // Étape 1 : Trouver tous les abonnements qui sont en période d'essai
        // mais dont la date de fin d'essai est dépassée
        const expiredTrials = await prisma.subscription.findMany({
            where: {
                status: 'trial',
                trialEndsAt: {
                    lt: now // "less than" — date de fin < maintenant
                }
            },
            select: {
                id: true,
                restaurantId: true,
                restaurant: {
                    select: { name: true }
                }
            }
        })

        // Étape 2 : Trouver tous les abonnements payés actifs dont la période
        // de facturation est terminée
        const expiredActive = await prisma.subscription.findMany({
            where: {
                status: 'active',
                currentPeriodEnd: {
                    lt: now
                }
            },
            select: {
                id: true,
                restaurantId: true,
                restaurant: {
                    select: { name: true }
                }
            }
        })

        // Combiner les deux listes
        const allExpired = [...expiredTrials, ...expiredActive]

        // Étape 3 : Passer tous ces abonnements en statut "expired"
        // On utilise une transaction pour garantir que soit tout passe,
        // soit rien ne passe (atomicité)
        if (allExpired.length > 0) {
            await prisma.$transaction(
                allExpired.map((sub) =>
                    prisma.subscription.update({
                        where: { id: sub.id },
                        data: { status: 'expired' }
                    })
                )
            )
        }

        // Préparer un rapport détaillé pour les logs
        const report = {
            timestamp: now.toISOString(),
            totalChecked: expiredTrials.length + expiredActive.length,
            expiredTrials: expiredTrials.length,
            expiredActive: expiredActive.length,
            restaurants: allExpired.map((sub) => ({
                restaurantId: sub.restaurantId,
                name: sub.restaurant.name
            }))
        }

        console.log('✅ Cron check-subscriptions terminé:', report)

        return NextResponse.json({
            success: true,
            ...report
        })

    } catch (error) {
        console.error('❌ Erreur dans check-subscriptions:', error)

        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}