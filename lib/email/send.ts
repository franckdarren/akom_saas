// lib/email/send.ts

import { Resend } from 'resend'
import prisma from '@/lib/prisma'
import { getTrialExpiringEmail, getActiveExpiringEmail } from './templates'

/**
 * Instance Resend configurée avec notre clé API.
 * On l'initialise une seule fois au niveau du module pour éviter
 * de recréer un client à chaque appel de fonction.
 */
const resend = new Resend(process.env.RESEND_API_KEY)

/**
 * Types d'emails possibles.
 * On utilise un type strict plutôt qu'une simple string pour avoir
 * de l'autocomplétion et éviter les typos.
 */
export type EmailType =
    | 'trial_7_days'
    | 'trial_3_days'
    | 'trial_1_day'
    | 'active_7_days'
    | 'active_3_days'
    | 'active_1_day'

/**
 * Données nécessaires pour composer un email de rappel d'abonnement.
 * Cette interface documente clairement ce dont on a besoin.
 */
interface SubscriptionEmailData {
    subscriptionId: string
    restaurantId: string
    restaurantName: string
    recipientEmail: string
    daysRemaining: number
    expirationDate: Date
    subscriptionType: 'trial' | 'active'
}

/**
 * Fonction centrale d'envoi d'email avec logging automatique.
 * 
 * POURQUOI UNE FONCTION SÉPARÉE ?
 * - Centralise toute la logique d'envoi (un seul endroit à débugger)
 * - Gère automatiquement le logging dans la base de données
 * - Gère les erreurs de manière uniforme
 * - Facilite les tests (on peut mocker cette fonction)
 * 
 * WORKFLOW :
 * 1. Vérifier si l'email a déjà été envoyé (dédoublonnage)
 * 2. Composer le bon template HTML selon le type
 * 3. Envoyer via Resend
 * 4. Logger le résultat (succès ou échec)
 * 
 * @returns true si l'email a été envoyé, false sinon
 */
export async function sendSubscriptionReminderEmail(
    data: SubscriptionEmailData,
    emailType: EmailType
): Promise<boolean> {
    try {
        // Étape 1 : Vérifier si on a déjà envoyé cet email
        const alreadySent = await prisma.subscriptionEmailLog.findFirst({
            where: {
                subscriptionId: data.subscriptionId,
                emailType: emailType,
                status: 'sent'
            }
        })

        if (alreadySent) {
            console.log(`⏭️  Email ${emailType} déjà envoyé pour ${data.restaurantName}`)
            return false
        }

        // Étape 2 : Composer l'email avec le bon template
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        const renewUrl = `${baseUrl}/dashboard/subscription/choose-plan`

        const emailData = {
            restaurantName: data.restaurantName,
            daysRemaining: data.daysRemaining,
            expirationDate: data.expirationDate.toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            }),
            renewUrl
        }

        // Choisir le template approprié
        const htmlContent = data.subscriptionType === 'trial'
            ? getTrialExpiringEmail(emailData)
            : getActiveExpiringEmail(emailData)

        // Composer le sujet en fonction du type et des jours restants
        const subject = data.daysRemaining === 1
            ? `⚠️ Dernier jour - Votre ${data.subscriptionType === 'trial' ? 'essai' : 'abonnement'} expire demain`
            : `🔔 Rappel - Votre ${data.subscriptionType === 'trial' ? 'essai' : 'abonnement'} expire dans ${data.daysRemaining} jours`

        // Étape 3 : Envoyer l'email via Resend
        const result = await resend.emails.send({
            from: 'Akôm <noreply@resend.dev>', // Remplace par ton domaine vérifié en prod
            to: data.recipientEmail,
            subject: subject,
            html: htmlContent,
            // On ajoute aussi une version texte brut pour les clients email
            // qui n'affichent pas le HTML (rare mais ça existe)
            text: `Votre ${data.subscriptionType === 'trial' ? 'période d\'essai' : 'abonnement'} ${data.restaurantName} expire dans ${data.daysRemaining} jour(s). Rendez-vous sur ${renewUrl} pour renouveler.`
        })

        // Étape 4 : Logger le succès
        await prisma.subscriptionEmailLog.create({
            data: {
                subscriptionId: data.subscriptionId,
                restaurantId: data.restaurantId,
                emailType: emailType,
                recipientEmail: data.recipientEmail,
                status: 'sent',
                sentAt: new Date()
            }
        })

        console.log(`✅ Email ${emailType} envoyé à ${data.recipientEmail} (ID: ${result.data?.id})`)
        return true

    } catch (error) {
        // Logger l'échec pour le débogage
        console.error(`❌ Erreur envoi email ${emailType}:`, error)

        try {
            // Tenter de logger l'erreur dans la base de données
            // On wrap ça dans un try/catch séparé car si la BDD est down,
            // on ne veut pas masquer l'erreur originale
            await prisma.subscriptionEmailLog.create({
                data: {
                    subscriptionId: data.subscriptionId,
                    restaurantId: data.restaurantId,
                    emailType: emailType,
                    recipientEmail: data.recipientEmail,
                    status: 'failed',
                    errorMessage: error instanceof Error ? error.message : 'Unknown error',
                    sentAt: new Date()
                }
            })
        } catch (logError) {
            console.error('Impossible de logger l\'erreur d\'email:', logError)
        }

        return false
    }
}

/**
 * Helper pour déterminer quel type d'email envoyer selon le nombre
 * de jours restants et le type d'abonnement.
 * 
 * POURQUOI CETTE FONCTION ?
 * Elle encapsule la logique "si il reste X jours, quel email envoyer ?"
 * dans un seul endroit. Ça évite d'avoir cette logique dupliquée
 * partout dans le code.
 */
export function getEmailTypeForDaysRemaining(
    daysRemaining: number,
    subscriptionType: 'trial' | 'active'
): EmailType | null {
    const prefix = subscriptionType === 'trial' ? 'trial' : 'active'

    // On utilise des plages plutôt que des valeurs exactes pour plus de robustesse
    if (daysRemaining >= 6 && daysRemaining <= 8) {
        return `${prefix}_7_days` as EmailType
    } else if (daysRemaining >= 2 && daysRemaining <= 4) {
        return `${prefix}_3_days` as EmailType
    } else if (daysRemaining >= 0 && daysRemaining <= 1) {
        return `${prefix}_1_day` as EmailType
    }

    // Si on n'est dans aucune de ces plages, on n'envoie rien
    return null
}