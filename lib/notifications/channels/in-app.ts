import prisma from '@/lib/prisma'
import type { Notification, NotificationDelivery } from '@prisma/client'

/**
 * Le canal in-app n'a rien à envoyer : la `Notification` créée en base
 * est diffusée automatiquement aux clients via Supabase Realtime
 * (publication `supabase_realtime` activée sur la table notifications).
 *
 * Cette fonction se contente de logger la livraison comme « sent ».
 */
export async function deliverInApp(
    notification: Notification,
    recipient: string
): Promise<NotificationDelivery> {
    return prisma.notificationDelivery.create({
        data: {
            notificationId: notification.id,
            channel: 'in_app',
            status: 'sent',
            recipient,
            sentAt: new Date(),
        },
    })
}
