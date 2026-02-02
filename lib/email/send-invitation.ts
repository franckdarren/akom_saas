// lib/email/send-invitation.ts
export const runtime = 'nodejs'


import { Resend } from 'resend'
import { InvitationEmail } from '@/emails/invitation-email'

// Initialiser le client Resend
const resend = new Resend(process.env.RESEND_API_KEY)

interface SendInvitationEmailParams {
    to: string
    restaurantName: string
    roleName: string
    inviterName: string
    invitationLink: string
    expiresAt: Date
}

export async function sendInvitationEmail({
    to,
    restaurantName,
    roleName,
    inviterName,
    invitationLink,
    expiresAt,
}: SendInvitationEmailParams) {
    try {
        // Formater la date d'expiration en français
        const formattedExpiresAt = new Date(expiresAt).toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        })

        // Envoyer l'email
        const { data, error } = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
            to: to,
            subject: `Invitation à rejoindre ${restaurantName} sur Akôm`,
            react: InvitationEmail({
                invitedUserEmail: to,
                restaurantName,
                roleName,
                inviterName,
                invitationLink,
                expiresAt: formattedExpiresAt,
            }),
        })

        if (error) {
            console.error('Erreur Resend:', error)
            return { success: false, error }
        }

        console.log('📧 Email envoyé avec succès:', data?.id)
        return { success: true, emailId: data?.id }
    } catch (error) {
        console.error('Erreur lors de l\'envoi de l\'email:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Erreur inconnue',
        }
    }
}