// app/api/cron/clean-system-logs/route.ts

import {NextRequest, NextResponse} from 'next/server'
import prisma from '@/lib/prisma'
import {logSystemAction} from '@/lib/actions/logs'

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * CRON JOB : Nettoyage des anciens logs système
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Fréquence : Tous les jours à 2h du matin (configurer dans vercel.json)
 *
 * Logique :
 *   Les logs système s'accumulent rapidement. Ce CRON fait le ménage
 *   selon deux règles de rétention différentes :
 *     - info / warning : conservés 30 jours (logs courants, peu critiques)
 *     - error          : conservés 90 jours (plus utiles pour le debug)
 *
 * Pourquoi des durées différentes selon le niveau ?
 *   Les erreurs sont rares et précieuses pour diagnostiquer des bugs.
 *   Les logs info/warning sont volumineux et perdent leur pertinence vite.
 *   Cette asymétrie réduit le volume de la table tout en gardant l'historique
 *   qui compte vraiment.
 *
 * Pourquoi compter AVANT de supprimer ?
 *   On fait d'abord un COUNT() pour décider si on continue.
 *   Si totalToDelete === 0, on évite deux requêtes DELETE inutiles.
 *   Le COUNT est très rapide grâce à l'index idx_system_logs_level_created.
 *
 * Pourquoi deleteMany en parallèle (Promise.all) ?
 *   Les deux DELETE portent sur des ensembles disjoints (level différents)
 *   → aucun risque de conflit. Les lancer en parallèle divise le temps
 *   d'attente par 2 environ.
 *
 * Note sur le log final :
 *   On trace le nettoyage dans system_logs lui-même. C'est intentionnel :
 *   ce log de niveau "info" sera lui-même supprimé après 30 jours,
 *   ce qui est cohérent avec la politique de rétention.
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

        console.log('🔄 Démarrage du nettoyage des logs système...')

        // ── Calcul des dates seuil ──────────────────────────────────────────
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const ninetyDaysAgo = new Date()
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

        console.log(`📅 Nettoyage info/warning avant : ${thirtyDaysAgo.toISOString()}`)
        console.log(`📅 Nettoyage errors avant : ${ninetyDaysAgo.toISOString()}`)

        // ── 1. Comptage (décision rapide avant d'aller plus loin) ───────────
        // Les deux COUNT sont lancés en parallèle — aucune dépendance entre eux
        const [infoWarningCount, errorCount] = await Promise.all([
            prisma.systemLog.count({
                where: {
                    level: {in: ['info', 'warning']},
                    createdAt: {lt: thirtyDaysAgo},
                },
            }),
            prisma.systemLog.count({
                where: {
                    level: 'error',
                    createdAt: {lt: ninetyDaysAgo},
                },
            }),
        ])

        const totalToDelete = infoWarningCount + errorCount

        // Rien à supprimer → sortie rapide sans exécuter les DELETE
        if (totalToDelete === 0) {
            console.log('✅ Aucun log à nettoyer')
            return NextResponse.json({
                success: true,
                message: 'Aucun log nécessite de nettoyage',
                deleted: 0,
            })
        }

        console.log(`🗑️ ${totalToDelete} log(s) à supprimer`)
        console.log(`   • info/warning : ${infoWarningCount}`)
        console.log(`   • error : ${errorCount}`)

        // ── 2. Suppression en parallèle ─────────────────────────────────────
        // Les deux deleteMany portent sur des sous-ensembles disjoints
        // (levels différents) → pas de conflit, on peut les paralléliser
        const [deletedInfoWarning, deletedErrors] = await Promise.all([
            prisma.systemLog.deleteMany({
                where: {
                    level: {in: ['info', 'warning']},
                    createdAt: {lt: thirtyDaysAgo},
                },
            }),
            prisma.systemLog.deleteMany({
                where: {
                    level: 'error',
                    createdAt: {lt: ninetyDaysAgo},
                },
            }),
        ])

        const totalDeleted = deletedInfoWarning.count + deletedErrors.count

        console.log(`   ✓ Supprimés : info/warning = ${deletedInfoWarning.count}`)
        console.log(`   ✓ Supprimés : error = ${deletedErrors.count}`)

        // ── 3. Statistiques post-nettoyage ──────────────────────────────────
        // On fait un groupBy pour savoir combien de logs restent par niveau
        // Utile pour monitorer la croissance de la table sur le long terme
        const remainingLogs = await prisma.systemLog.groupBy({
            by: ['level'],
            _count: {id: true},
        })

        const remainingStats = remainingLogs.reduce(
            (acc, log) => {
                acc[log.level] = log._count.id
                return acc
            },
            {} as Record<string, number>
        )

        // ── 4. Log du nettoyage ─────────────────────────────────────────────
        // Ce log sera lui-même supprimé dans 30 jours — cohérent avec la politique
        await logSystemAction(
            'system_logs_cleaned',
            {
                totalDeleted,
                deletedInfoWarning: deletedInfoWarning.count,
                deletedErrors: deletedErrors.count,
                thirtyDaysThreshold: thirtyDaysAgo.toISOString(),
                ninetyDaysThreshold: ninetyDaysAgo.toISOString(),
                remainingLogs: remainingStats,
            },
            'info'
        )

        console.log('✅ Nettoyage des logs terminé')
        return NextResponse.json({
            success: true,
            message: `${totalDeleted} log(s) supprimé(s)`,
            deleted: totalDeleted,
            details: {
                infoWarning: {
                    deleted: deletedInfoWarning.count,
                    threshold: thirtyDaysAgo.toISOString(),
                },
                errors: {
                    deleted: deletedErrors.count,
                    threshold: ninetyDaysAgo.toISOString(),
                },
            },
            remainingLogs: remainingStats,
            executedAt: new Date().toISOString(),
        })
    } catch (error) {
        console.error('❌ Erreur nettoyage logs:', error)

        // Double try/catch : si logSystemAction échoue aussi (ex: BDD indisponible),
        // on ne fait pas crasher le handler — on log juste dans la console Vercel
        try {
            await logSystemAction(
                'cron_error',
                {
                    task: 'clean-system-logs',
                    error: error instanceof Error ? error.message : 'Erreur inconnue',
                },
                'error'
            )
        } catch (logError) {
            console.error("❌ Impossible de logger l'erreur:", logError)
        }

        return NextResponse.json(
            {
                error: 'Erreur lors du nettoyage',
                details: error instanceof Error ? error.message : 'Erreur inconnue',
            },
            {status: 500}
        )
    }
}