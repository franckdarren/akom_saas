// lib/email/templates.ts

/**
 * Templates d'emails pour les notifications d'abonnement
 * 
 * Ces templates sont écrits en HTML pur avec du CSS inline.
 * POURQUOI DU CSS INLINE ?
 * Les clients email (Gmail, Outlook, etc.) ont un support très limité
 * du CSS moderne. Les <style> dans le <head> sont souvent ignorés,
 * les classes CSS ne fonctionnent pas toujours. Le CSS inline est
 * la seule méthode qui fonctionne de manière fiable partout.
 * 
 * DESIGN PHILOSOPHY :
 * - Mobile-first (60%+ des emails sont ouverts sur mobile)
 * - Contraste élevé pour la lisibilité
 * - Un seul CTA (Call To Action) clair par email
 * - Texte concis et scannable
 */

interface EmailData {
    restaurantName: string
    daysRemaining: number
    expirationDate: string
    renewUrl: string
}

export function getTrialExpiringEmail(data: EmailData): string {
    const { restaurantName, daysRemaining, expirationDate, renewUrl } = data

    return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Votre période d'essai se termine bientôt</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <table role="presentation" style="width: 600px; max-width: 90%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                
                <!-- Header -->
                <tr>
                  <td style="padding: 40px 40px 20px 40px; text-align: center; background-color: #3b82f6; border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                      ⏰ Votre période d'essai se termine bientôt
                    </h1>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">
                    <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                      Bonjour,
                    </p>
                    
                    <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                      Votre période d'essai gratuite de <strong>${restaurantName}</strong> sur Akôm se termine dans <strong style="color: #dc2626;">${daysRemaining} jour${daysRemaining > 1 ? 's' : ''}</strong> (le ${expirationDate}).
                    </p>

                    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0; border-radius: 4px;">
                      <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;">
                        <strong>Important :</strong> Pour continuer à utiliser Akôm sans interruption, pensez à renouveler votre abonnement dès maintenant.
                      </p>
                    </div>

                    <p style="margin: 0 0 24px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                      Avec Akôm, vous bénéficiez de :
                    </p>

                    <ul style="margin: 0 0 24px 0; padding-left: 20px; color: #374151; font-size: 16px; line-height: 1.8;">
                      <li>Menu digital accessible par QR code</li>
                      <li>Gestion des commandes en temps réel</li>
                      <li>Interface cuisine optimisée</li>
                      <li>Statistiques de vente détaillées</li>
                    </ul>

                    <!-- CTA Button -->
                    <table role="presentation" style="width: 100%; margin: 32px 0;">
                      <tr>
                        <td align="center">
                          <a href="${renewUrl}" style="display: inline-block; background-color: #3b82f6; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                            Renouveler mon abonnement
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="margin: 24px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                      Besoin d'aide ? Répondez simplement à cet email, notre équipe vous répondra rapidement.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 24px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
                    <p style="margin: 0; color: #6b7280; font-size: 12px; line-height: 1.5; text-align: center;">
                      Vous recevez cet email car votre période d'essai Akôm arrive à expiration.<br>
                      © ${new Date().getFullYear()} Akôm - Tous droits réservés
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `
}

export function getActiveExpiringEmail(data: EmailData): string {
    const { restaurantName, daysRemaining, expirationDate, renewUrl } = data

    return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Votre abonnement arrive à expiration</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <table role="presentation" style="width: 600px; max-width: 90%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                
                <!-- Header -->
                <tr>
                  <td style="padding: 40px 40px 20px 40px; text-align: center; background-color: #f59e0b; border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                      🔔 Renouvellement d'abonnement
                    </h1>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">
                    <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                      Bonjour,
                    </p>
                    
                    <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                      Votre abonnement Akôm pour <strong>${restaurantName}</strong> arrive à expiration dans <strong style="color: #dc2626;">${daysRemaining} jour${daysRemaining > 1 ? 's' : ''}</strong> (le ${expirationDate}).
                    </p>

                    ${daysRemaining <= 1 ? `
                      <div style="background-color: #fee2e2; border-left: 4px solid #dc2626; padding: 16px; margin: 24px 0; border-radius: 4px;">
                        <p style="margin: 0; color: #7f1d1d; font-size: 14px; line-height: 1.5;">
                          <strong>Action requise :</strong> Pour éviter toute interruption de service, renouvelez dès maintenant.
                        </p>
                      </div>
                    ` : `
                      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0; border-radius: 4px;">
                        <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;">
                          <strong>Rappel :</strong> Pensez à renouveler votre abonnement pour continuer à profiter d'Akôm.
                        </p>
                      </div>
                    `}

                    <!-- CTA Button -->
                    <table role="presentation" style="width: 100%; margin: 32px 0;">
                      <tr>
                        <td align="center">
                          <a href="${renewUrl}" style="display: inline-block; background-color: #f59e0b; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                            Renouveler maintenant
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="margin: 24px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                      Des questions ? Notre équipe est là pour vous aider.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 24px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
                    <p style="margin: 0; color: #6b7280; font-size: 12px; line-height: 1.5; text-align: center;">
                      © ${new Date().getFullYear()} Akôm - Tous droits réservés
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `
}