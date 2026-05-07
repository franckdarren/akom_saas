import prisma from '@/lib/prisma'
import type { NotificationType, NotificationChannel } from '@prisma/client'

/**
 * Résout les canaux actifs pour un user × type donné.
 * Si aucune préférence n'existe, retourne la valeur par défaut (in_app + email).
 */
export async function resolveChannels(
    userId: string,
    type: NotificationType
): Promise<NotificationChannel[]> {
    const pref = await prisma.notificationPreference.findUnique({
        where: { userId_type: { userId, type } },
    })

    const channels: NotificationChannel[] = []

    // Par défaut : in-app activé, email activé
    if (pref ? pref.inApp : true) channels.push('in_app')
    if (pref ? pref.email : true) channels.push('email')

    return channels
}
