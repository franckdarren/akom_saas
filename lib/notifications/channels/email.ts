import { Resend } from 'resend'
import prisma from '@/lib/prisma'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NotificationEmail } from '@/emails/notification-email'
import type { Notification, NotificationDelivery } from '@prisma/client'
import type { RenderedNotification } from '../templates'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Akôm <onboarding@resend.dev>'

/**
 * Résout l'email d'un userId via Supabase Auth.
 * Retourne null si l'utilisateur n'existe pas ou n'a pas d'email.
 */
export async function resolveUserEmail(userId: string): Promise<string | null> {
    try {
        const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId)
        if (error || !data?.user?.email) return null
        return data.user.email
    } catch (err) {
        console.error('[notifications/email] resolveUserEmail failed:', err)
        return null
    }
}

/**
 * Envoie l'email de notification et logge la livraison.
 * Best-effort : un échec n'empêche pas la notification d'être livrée in-app.
 */
export async function deliverEmail(
    notification: Notification,
    rendered: RenderedNotification,
    recipientEmail: string,
    appUrl: string,
    restaurantName?: string
): Promise<NotificationDelivery> {
    const ctaUrl = notification.actionUrl
        ? notification.actionUrl.startsWith('http')
            ? notification.actionUrl
            : `${appUrl}${notification.actionUrl}`
        : undefined

    try {
        const { data, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: recipientEmail,
            subject: rendered.emailSubject,
            react: NotificationEmail({
                title: rendered.title,
                intro: rendered.emailIntro,
                body: notification.body,
                ctaLabel: rendered.emailCtaLabel,
                ctaUrl,
                restaurantName,
            }),
        })

        if (error) {
            return prisma.notificationDelivery.create({
                data: {
                    notificationId: notification.id,
                    channel: 'email',
                    status: 'failed',
                    recipient: recipientEmail,
                    errorMessage: error.message ?? 'Resend error',
                },
            })
        }

        console.log('[notifications/email] sent:', data?.id, '→', recipientEmail)

        return prisma.notificationDelivery.create({
            data: {
                notificationId: notification.id,
                channel: 'email',
                status: 'sent',
                recipient: recipientEmail,
                sentAt: new Date(),
            },
        })
    } catch (err) {
        return prisma.notificationDelivery.create({
            data: {
                notificationId: notification.id,
                channel: 'email',
                status: 'failed',
                recipient: recipientEmail,
                errorMessage: err instanceof Error ? err.message : 'Unknown error',
            },
        })
    }
}
