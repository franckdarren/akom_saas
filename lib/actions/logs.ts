'use server'

import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { isSuperAdminEmail } from '@/lib/utils/permissions'

// ============================================================
// TYPES
// ============================================================

type LogLevel = 'info' | 'warning' | 'error' | 'critical'

// ============================================================
// CRÉER UN LOG
// ============================================================

export async function createLog(
    level: LogLevel,
    action: string,
    message: string,
    metadata?: Record<string, any>
) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        await prisma.systemLog.create({
            data: {
                level,
                action,
                message,
                userId: user?.id || null,
                metadata: metadata ? (metadata as any) : undefined,
            },
        })
    } catch (error) {
        // Ne pas bloquer l'app si le log échoue
        console.error('Erreur création log:', error)
    }
}

// ============================================================
// RÉCUPÉRER LES LOGS (SuperAdmin)
// ============================================================

export async function getLogs(
    level?: LogLevel,
    limit: number = 100
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user || !isSuperAdminEmail(user.email || '')) {
        throw new Error('Accès refusé : SuperAdmin uniquement')
    }
    
    const logs = await prisma.systemLog.findMany({
        where: level ? { level } : undefined,
        orderBy: { createdAt: 'desc' },
        take: limit,
    })
    
    return logs
}

// ============================================================
// STATS LOGS
// ============================================================

export async function getLogsStats() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user || !isSuperAdminEmail(user.email || '')) {
        throw new Error('Accès refusé : SuperAdmin uniquement')
    }
    
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000)
    
    const [total, errors, warnings, criticals, last24hCount] = await Promise.all([
        prisma.systemLog.count(),
        
        prisma.systemLog.count({
            where: { level: 'error' },
        }),
        
        prisma.systemLog.count({
            where: { level: 'warning' },
        }),
        
        prisma.systemLog.count({
            where: { level: 'critical' },
        }),
        
        prisma.systemLog.count({
            where: { createdAt: { gte: last24h } },
        }),
    ])
    
    return {
        total,
        errors,
        warnings,
        criticals,
        last24hCount,
    }
}

// ============================================================
// HELPERS : Logger des actions spécifiques
// ============================================================

export async function logRestaurantCreated(restaurantId: string, name: string) {
    await createLog(
        'info',
        'restaurant_created',
        `Nouveau restaurant créé : ${name}`,
        { restaurantId, name }
    )
}

export async function logRestaurantDeactivated(restaurantId: string, name: string) {
    await createLog(
        'warning',
        'restaurant_deactivated',
        `Restaurant désactivé : ${name}`,
        { restaurantId, name }
    )
}

export async function logOrderFailed(orderId: string, error: string) {
    await createLog(
        'error',
        'order_failed',
        `Erreur lors de la création de commande`,
        { orderId, error }
    )
}

export async function logPaymentFailed(orderId: string, error: string) {
    await createLog(
        'critical',
        'payment_failed',
        `Échec de paiement`,
        { orderId, error }
    )
}