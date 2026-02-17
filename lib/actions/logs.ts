// lib/actions/logs.ts

'use server'

import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import type { LogLevel } from '@prisma/client'
import { isSuperAdminEmail } from '@/lib/utils/permissions'

// ============================================================
// TYPES
// ============================================================

export interface LogsStats {
    total: number
    errors: number
    warnings: number
    criticals: number
    last24hCount: number
}

// ============================================================
// CRÉER UN LOG (pour les actions utilisateur)
// ============================================================

export async function createLog(
    level: LogLevel,
    action: string,
    message: string,
    metadata?: Record<string, unknown>
): Promise<void> {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()

        await prisma.systemLog.create({
            data: {
                level,
                action,
                message,
                userId: user?.id ?? null,
                metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null,
            },
        })
    } catch (error) {
        console.error('Erreur création log:', error)
    }
}

// ============================================================
// CRÉER UN LOG SYSTÈME (pour les actions CRON)
// ============================================================

/**
 * Cette fonction est spécifiquement conçue pour les tâches CRON
 * et autres actions système automatiques qui s'exécutent sans
 * utilisateur connecté.
 * 
 * Différences avec createLog() :
 * - Ne tente pas de récupérer l'utilisateur connecté
 * - userId est toujours null (action système)
 * - Accepte directement metadata au lieu de message
 * - Plus simple et plus rapide pour les CRON
 * 
 * @param action - Nom de l'action système (ex: 'restaurant_suspended_auto')
 * @param metadata - Données structurées sur l'action
 * @param level - Niveau de log (info, warning, error, critical)
 */
export async function logSystemAction(
    action: string,
    metadata: Record<string, unknown>,
    level: LogLevel = 'info'
): Promise<void> {
    try {
        await prisma.systemLog.create({
            data: {
                level,
                action,
                message: `Action système : ${action}`,
                userId: null, // Actions système n'ont pas de userId
                metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null,
            },
        })
    } catch (error) {
        // On log dans la console mais on ne throw pas d'erreur
        // pour éviter de bloquer l'exécution d'une tâche CRON
        // juste parce que le logging a échoué
        console.error('❌ Erreur lors du logging système:', error)
    }
}

// ============================================================
// RÉCUPÉRER LES LOGS (SuperAdmin)
// ============================================================

export async function getLogs(level?: LogLevel, limit = 100) {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user || !isSuperAdminEmail(user.email ?? '')) {
        throw new Error('Accès refusé : SuperAdmin uniquement')
    }

    return prisma.systemLog.findMany({
        where: level ? { level } : undefined,
        orderBy: { createdAt: 'desc' },
        take: limit,
    })
}

// ============================================================
// STATISTIQUES DES LOGS
// ============================================================

export async function getLogsStats(): Promise<LogsStats> {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user || !isSuperAdminEmail(user.email ?? '')) {
        throw new Error('Accès refusé : SuperAdmin uniquement')
    }

    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const [total, errors, warnings, criticals, last24hCount] =
        await Promise.all([
            prisma.systemLog.count(),
            prisma.systemLog.count({ where: { level: 'error' } }),
            prisma.systemLog.count({ where: { level: 'warning' } }),
            prisma.systemLog.count({ where: { level: 'critical' } }),
            prisma.systemLog.count({ where: { createdAt: { gte: last24h } } }),
        ])

    return { total, errors, warnings, criticals, last24hCount }
}

// ============================================================
// HELPERS SPÉCIFIQUES (actions utilisateur)
// ============================================================

export async function logRestaurantCreated(restaurantId: string, name: string) {
    return createLog('info', 'restaurant_created', `Nouveau restaurant créé : ${name}`, {
        restaurantId,
        name,
    })
}

export async function logRestaurantDeactivated(restaurantId: string, name: string) {
    return createLog('warning', 'restaurant_deactivated', `Restaurant désactivé : ${name}`, {
        restaurantId,
        name,
    })
}

export async function logRestaurantActivated(restaurantId: string, name: string) {
    return createLog('warning', 'restaurant_activated', `Restaurant activé : ${name}`, {
        restaurantId,
        name,
    })
}

export async function logOrderFailed(error: string) {
    return createLog('error', 'order_failed', 'Erreur lors de la création de commande', {
        error,
    })
}

export async function logPaymentFailed(orderId: string, error: string) {
    return createLog('critical', 'payment_failed', 'Échec de paiement', {
        orderId,
        error,
    })
}