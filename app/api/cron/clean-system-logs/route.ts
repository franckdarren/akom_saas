// app/api/cron/clean-system-logs/route.ts

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { logSystemAction } from '@/lib/actions/logs'

/**
 * CRON JOB : Nettoyage des anciens logs système
 * Fréquence : Tous les jours à 2h du matin
 * Logique : Supprime les logs info/warning > 30j, error > 90j
 */
export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization')
        const token = authHeader?.replace('Bearer ', '')

        if (!token || token !== process.env.CRON_SECRET) {
            console.error('❌ Tentative d\'accès non autorisée au CRON')
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
        }

        console.log('🔄 Démarrage du nettoyage des logs système...')

        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const ninetyDaysAgo = new Date()
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

        console.log(`📅 Nettoyage info/warning avant : ${thirtyDaysAgo.toISOString()}`)
        console.log(`📅 Nettoyage errors avant : ${ninetyDaysAgo.toISOString()}`)

        const [infoWarningCount, errorCount] = await Promise.all([
            prisma.systemLog.count({
                where: {
                    level: { in: ['info', 'warning'] },
                    createdAt: { lt: thirtyDaysAgo },
                },
            }),
            
            prisma.systemLog.count({
                where: {
                    level: 'error',
                    createdAt: { lt: ninetyDaysAgo },
                },
            }),
        ])

        const totalToDelete = infoWarningCount + errorCount

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

        const [deletedInfoWarning, deletedErrors] = await Promise.all([
            prisma.systemLog.deleteMany({
                where: {
                    level: { in: ['info', 'warning'] },
                    createdAt: { lt: thirtyDaysAgo },
                },
            }),
            
            prisma.systemLog.deleteMany({
                where: {
                    level: 'error',
                    createdAt: { lt: ninetyDaysAgo },
                },
            }),
        ])

        const totalDeleted = deletedInfoWarning.count + deletedErrors.count

        console.log(`   ✓ Supprimés : info/warning = ${deletedInfoWarning.count}`)
        console.log(`   ✓ Supprimés : error = ${deletedErrors.count}`)

        const remainingLogs = await prisma.systemLog.groupBy({
            by: ['level'],
            _count: { id: true },
        })

        const remainingStats = remainingLogs.reduce((acc, log) => {
            acc[log.level] = log._count.id
            return acc
        }, {} as Record<string, number>)

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

        const result = {
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
        }

        console.log('✅ Nettoyage des logs terminé')
        return NextResponse.json(result)

    } catch (error) {
        console.error('❌ Erreur nettoyage logs:', error)
        
        try {
            await logSystemAction(
                'cron_error',
                { task: 'clean-system-logs', error: error instanceof Error ? error.message : 'Erreur inconnue' },
                'error'
            )
        } catch (logError) {
            console.error('❌ Impossible de logger l\'erreur:', logError)
        }

        return NextResponse.json(
            { error: 'Erreur lors du nettoyage', details: error instanceof Error ? error.message : 'Erreur inconnue' },
            { status: 500 }
        )
    }
}
