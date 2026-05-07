import prisma from '@/lib/prisma'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { SUPERADMIN_EMAILS } from '@/lib/utils/permissions'
import type { NotificationType, NotificationPriority } from '@prisma/client'
import { renderNotification } from './templates'
import { resolveChannels } from './preferences'
import { deliverInApp } from './channels/in-app'
import { deliverEmail, resolveUserEmail } from './channels/email'

export interface NotifyParams {
    /** Destinataire — l'`auth.users.id` Supabase (= `restaurant_users.user_id`). */
    userId: string
    /** Structure liée à la notification (optionnel pour les notifs superadmin). */
    restaurantId?: string
    /** Type d'évènement métier (mappé vers un template). */
    type: NotificationType
    /** Données dynamiques injectées dans le template. */
    data?: Record<string, string | number | undefined | null>
    /** Force la priorité (sinon utilise celle du template). */
    priority?: NotificationPriority
    /** Override du nom de l'établissement (sinon résolu via restaurantId). */
    restaurantName?: string
}

/**
 * Point d'entrée unique pour créer une notification.
 *
 * Workflow :
 * 1. Résout les préférences user × type → canaux actifs
 * 2. Render le template (titre, body, actionUrl, sujet email)
 * 3. Crée la `Notification` (la diffusion in-app se fait via Supabase Realtime)
 * 4. Crée les `NotificationDelivery` par canal et envoie l'email si demandé
 *
 * Best-effort : un échec d'envoi email n'empêche jamais la création de la notif in-app.
 * Ne JAMAIS faire échouer la transaction métier appelante à cause d'une notif.
 */
export async function notify(params: NotifyParams): Promise<void> {
    try {
        const { userId, restaurantId, type, data = {}, priority, restaurantName } = params

        const channels = await resolveChannels(userId, type)
        if (channels.length === 0) return

        // Résoudre le nom de la structure si besoin (utilisé dans les emails)
        let resolvedRestaurantName = restaurantName
        if (!resolvedRestaurantName && restaurantId) {
            const r = await prisma.restaurant.findUnique({
                where: { id: restaurantId },
                select: { name: true },
            })
            resolvedRestaurantName = r?.name
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

        const rendered = renderNotification(type, data, {
            restaurantName: resolvedRestaurantName,
            appUrl,
        })

        // 1) Créer la notification (déclenche le Realtime côté client)
        const notification = await prisma.notification.create({
            data: {
                userId,
                restaurantId: restaurantId ?? null,
                type,
                priority: priority ?? rendered.priority,
                title: rendered.title,
                body: rendered.body,
                actionUrl: rendered.actionUrl ?? null,
                metadata: data as object,
            },
        })

        // 2) Livrer sur chaque canal en parallèle
        const tasks: Promise<unknown>[] = []

        if (channels.includes('in_app')) {
            tasks.push(deliverInApp(notification, userId))
        }

        if (channels.includes('email')) {
            tasks.push(
                (async () => {
                    const email = await resolveUserEmail(userId)
                    if (!email) {
                        await prisma.notificationDelivery.create({
                            data: {
                                notificationId: notification.id,
                                channel: 'email',
                                status: 'failed',
                                recipient: userId,
                                errorMessage: 'Email introuvable pour ce userId',
                            },
                        })
                        return
                    }
                    await deliverEmail(notification, rendered, email, appUrl, resolvedRestaurantName)
                })()
            )
        }

        await Promise.allSettled(tasks)
    } catch (err) {
        // On log mais on n'échoue jamais l'appelant
        console.error('[notifications/dispatch] notify failed:', err)
    }
}

/**
 * Résout les userIds des superadmins à partir de la liste d'emails whitelist.
 * Utilise le client Supabase admin pour lookup par email.
 */
async function resolveSuperAdminUserIds(): Promise<string[]> {
    const emails = SUPERADMIN_EMAILS.map((e) => e.trim().toLowerCase())
    const ids: string[] = []
    for (const email of emails) {
        try {
            const { data } = await supabaseAdmin.auth.admin.listUsers()
            const user = data?.users?.find((u) => u.email?.toLowerCase() === email)
            if (user?.id) ids.push(user.id)
        } catch (err) {
            console.error('[notifications] resolveSuperAdminUserIds failed for', email, err)
        }
    }
    return ids
}

/**
 * Notifie tous les superadmins.
 */
export async function notifySuperAdmins(
    type: NotificationType,
    data?: Record<string, string | number | undefined | null>
): Promise<void> {
    try {
        const userIds = await resolveSuperAdminUserIds()
        await Promise.allSettled(
            userIds.map((userId) => notify({ userId, type, data }))
        )
    } catch (err) {
        console.error('[notifications/dispatch] notifySuperAdmins failed:', err)
    }
}

/**
 * Variante utilitaire : notifie tous les admins d'une structure.
 * Pratique pour les évènements métier qui doivent toucher l'équipe d'admin.
 */
export async function notifyRestaurantAdmins(
    restaurantId: string,
    type: NotificationType,
    data?: Record<string, string | number | undefined | null>
): Promise<void> {
    const admins = await prisma.restaurantUser.findMany({
        where: {
            restaurantId,
            customRole: { slug: 'admin' },
        },
        select: { userId: true },
    })

    await Promise.allSettled(
        admins.map((a) => notify({ userId: a.userId, restaurantId, type, data }))
    )
}
