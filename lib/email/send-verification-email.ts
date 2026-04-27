export const runtime = 'nodejs'

import { Resend } from 'resend'
import { VerificationApprovedEmail } from '@/emails/verification-approved-email'
import prisma from '@/lib/prisma'
import { supabaseAdmin } from '@/lib/supabase/admin'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendVerificationApprovedEmail(restaurantId: string) {
    try {
        // Récupérer le restaurant et son admin
        const restaurant = await prisma.restaurant.findUnique({
            where: { id: restaurantId },
            select: {
                name: true,
                users: {
                    where: { customRole: { slug: 'admin' } },
                    take: 1,
                    select: { userId: true },
                },
            },
        })

        if (!restaurant) {
            console.error('sendVerificationApprovedEmail: restaurant introuvable', restaurantId)
            return
        }

        const adminUserId = restaurant.users[0]?.userId
        if (!adminUserId) {
            console.error('sendVerificationApprovedEmail: aucun admin trouvé pour', restaurantId)
            return
        }

        // Récupérer l'email via Supabase Admin (seul moyen d'accéder aux emails auth)
        const { data: userData, error } = await supabaseAdmin.auth.admin.getUserById(adminUserId)
        if (error || !userData?.user?.email) {
            console.error('sendVerificationApprovedEmail: email admin introuvable', error)
            return
        }

        const adminEmail = userData.user.email
        const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.akom.com'}/dashboard`

        const { data, error: sendError } = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
            to: adminEmail,
            subject: `Votre établissement ${restaurant.name} est approuvé sur Akôm !`,
            react: VerificationApprovedEmail({
                restaurantName: restaurant.name,
                dashboardUrl,
            }),
        })

        if (sendError) {
            console.error('sendVerificationApprovedEmail: erreur Resend', sendError)
            return
        }

        console.log('📧 Email approbation envoyé:', data?.id, '→', adminEmail)
    } catch (error) {
        // Ne pas faire échouer l'approbation si l'email plante
        console.error('sendVerificationApprovedEmail: erreur inattendue', error)
    }
}
