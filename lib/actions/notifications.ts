'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import type { Notification } from '@prisma/client'

async function requireUser() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Non authentifié')
    return user
}

export interface NotificationListItem {
    id: string
    type: string
    priority: string
    title: string
    body: string
    actionUrl: string | null
    metadata: unknown
    readAt: string | null
    createdAt: string
}

function serialize(n: Notification): NotificationListItem {
    return {
        id: n.id,
        type: n.type,
        priority: n.priority,
        title: n.title,
        body: n.body,
        actionUrl: n.actionUrl,
        metadata: n.metadata,
        readAt: n.readAt ? n.readAt.toISOString() : null,
        createdAt: n.createdAt.toISOString(),
    }
}

/**
 * Liste paginée des notifications de l'utilisateur courant.
 * @param onlyUnread filtre sur les non-lues
 * @param limit nombre maximum à retourner (par défaut 20)
 */
export async function listMyNotifications(opts?: {
    onlyUnread?: boolean
    limit?: number
}): Promise<{ items: NotificationListItem[]; unreadCount: number }> {
    const user = await requireUser()
    const limit = Math.min(opts?.limit ?? 20, 100)

    const [items, unreadCount] = await Promise.all([
        prisma.notification.findMany({
            where: {
                userId: user.id,
                ...(opts?.onlyUnread ? { readAt: null } : {}),
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
        }),
        prisma.notification.count({
            where: { userId: user.id, readAt: null },
        }),
    ])

    return { items: items.map(serialize), unreadCount }
}

/**
 * Compte rapide des non-lues — utilisé par la cloche du header.
 */
export async function getUnreadNotificationCount(): Promise<number> {
    try {
        const user = await requireUser()
        return prisma.notification.count({
            where: { userId: user.id, readAt: null },
        })
    } catch {
        return 0
    }
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
    const user = await requireUser()
    await prisma.notification.updateMany({
        where: { id: notificationId, userId: user.id, readAt: null },
        data: { readAt: new Date() },
    })
    revalidatePath('/dashboard/notifications')
}

export async function markAllNotificationsAsRead(): Promise<void> {
    const user = await requireUser()
    await prisma.notification.updateMany({
        where: { userId: user.id, readAt: null },
        data: { readAt: new Date() },
    })
    revalidatePath('/dashboard/notifications')
}

// ============================================================
// PRÉFÉRENCES
// ============================================================

export interface NotificationPreferenceItem {
    type: string
    inApp: boolean
    email: boolean
}

export async function getMyNotificationPreferences(): Promise<NotificationPreferenceItem[]> {
    const user = await requireUser()
    const prefs = await prisma.notificationPreference.findMany({
        where: { userId: user.id },
        select: { type: true, inApp: true, email: true },
    })
    return prefs.map((p) => ({ type: p.type, inApp: p.inApp, email: p.email }))
}

export async function upsertNotificationPreference(
    type: string,
    inApp: boolean,
    emailEnabled: boolean
): Promise<void> {
    const user = await requireUser()

    // Valider que le type est un NotificationType valide
    const validTypes = [
        'support_reply', 'support_ticket_resolved',
        'verification_approved', 'verification_rejected', 'circuit_sheet_deadline',
        'payment_received', 'payment_failed', 'subscription_paid',
        'subscription_expiring', 'subscription_suspended',
        'low_stock_alert', 'slow_order_alert', 'new_invitation_accepted',
        'new_support_ticket', 'new_verification_submitted', 'new_subscription_payment',
    ]
    if (!validTypes.includes(type)) throw new Error('Type de notification invalide')

    await prisma.notificationPreference.upsert({
        where: { userId_type: { userId: user.id, type: type as never } },
        create: { userId: user.id, type: type as never, inApp, email: emailEnabled },
        update: { inApp, email: emailEnabled, updatedAt: new Date() },
    })
    revalidatePath('/dashboard/settings/notifications')
}
