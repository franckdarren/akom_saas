
import {
    Body,
    Button,
    Container,
    Head,
    Heading,
    Html,
    Img,
    Link,
    Preview,
    Section,
    Text,
    Hr,
} from '@react-email/components'
import * as React from 'react'

interface InvitationEmailProps {
    invitedUserEmail: string
    restaurantName: string
    roleName: string
    inviterName: string
    invitationLink: string
    expiresAt: string
}

export function InvitationEmail({
    invitedUserEmail,
    restaurantName,
    roleName,
    inviterName,
    invitationLink,
    expiresAt,
}: InvitationEmailProps) {
    const previewText = `${inviterName} vous invite à rejoindre ${restaurantName} sur Akôm`

    // Formater la date en français lisible
    const formattedExpiresAt = new Date(expiresAt).toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    })

    return (
        <Html>
            <Head />
            <Preview>{previewText}</Preview>
            <Body style={main}>
                <Container style={container}>
                    {/* Logo ou en-tête */}
                    <Section style={header}>
                        <Heading style={heading}>Akôm</Heading>
                    </Section>
                    {/* <Section style={header}>
                        <Img
                            src="https://votredomaine.com/logo-white.png"
                            alt="Akôm"
                            width="120"
                            height="40"
                            style={{ margin: '0 auto' }}
                        />
                    </Section> */}

                    {/* Contenu principal */}
                    <Section style={content}>
                        <Heading style={h1}>
                            Vous avez été invité à rejoindre {restaurantName}
                        </Heading>

                        <Text style={text}>
                            Bonjour,
                        </Text>

                        <Text style={text}>
                            <strong>{inviterName}</strong> vous invite à rejoindre{' '}
                            <strong>{restaurantName}</strong> sur Akôm en tant que{' '}
                            <strong>{roleName}</strong>.
                        </Text>

                        <Text style={text}>
                            Akôm est une plateforme qui permet de digitaliser la gestion
                            de votre restaurant : commandes, menu, stocks et bien plus
                            encore, le tout depuis une seule application.
                        </Text>

                        {/* Bouton principal */}
                        <Section style={buttonContainer}>
                            <Button style={button} href={invitationLink}>
                                Accepter l'invitation
                            </Button>
                        </Section>

                        <Hr style={hr} />

                        {/* Instructions alternatives */}
                        <Text style={smallText}>
                            Si le bouton ne fonctionne pas, vous pouvez copier-coller ce
                            lien dans votre navigateur :
                        </Text>
                        <Link href={invitationLink} style={link}>
                            {invitationLink}
                        </Link>

                        <Hr style={hr} />

                        {/* Informations importantes */}
                        <Text style={smallText}>
                            ⏰ Cette invitation expire le <strong>{formattedExpiresAt}</strong>.
                        </Text>

                        <Text style={smallText}>
                            📧 Cette invitation a été envoyée à{' '}
                            <strong>{invitedUserEmail}</strong>. Vous devrez utiliser
                            cette adresse email pour accepter l'invitation.
                        </Text>
                    </Section>

                    {/* <Section style={content}>
                        <Heading style={h2}>Besoin d'aide ?</Heading>
                        <Text style={text}>
                            Si vous avez des questions, n'hésitez pas à nous contacter :
                        </Text>
                        <Text style={text}>
                            📧 Email : support@akom.app
                            <br />
                            📱 WhatsApp : +241 XX XX XX XX
                        </Text>
                    </Section> */}

                    {/* Pied de page */}
                    <Section style={footer}>
                        <Text style={footerText}>
                            © {new Date().getFullYear()} Akôm. Tous droits réservés.
                        </Text>
                        <Text style={footerText}>
                            Si vous n'avez pas demandé cette invitation, vous pouvez
                            ignorer cet email en toute sécurité.
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    )
}

// Styles inline (requis pour la compatibilité email)
const main = {
    backgroundColor: '#f6f9fc',
    fontFamily:
        '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
    backgroundColor: '#ffffff',
    margin: '0 auto',
    padding: '20px 0 48px',
    marginBottom: '64px',
    maxWidth: '600px',
}

const header = {
    padding: '32px 24px',
    backgroundColor: '#0f172a',
    textAlign: 'center' as const,
}

const heading = {
    fontSize: '24px',
    fontWeight: '700',
    color: '#ffffff',
    margin: '0',
}

const content = {
    padding: '0 24px',
}

const h1 = {
    color: '#1f2937',
    fontSize: '24px',
    fontWeight: '700',
    margin: '32px 0',
    padding: '0',
    lineHeight: '1.3',
}

const text = {
    color: '#4b5563',
    fontSize: '16px',
    lineHeight: '26px',
    margin: '16px 0',
}

const buttonContainer = {
    textAlign: 'center' as const,
    margin: '32px 0',
}

const button = {
    backgroundColor: '#0f172a',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: '600',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'inline-block',
    padding: '12px 32px',
}

const hr = {
    borderColor: '#e5e7eb',
    margin: '32px 0',
}

const link = {
    color: '#3b82f6',
    fontSize: '14px',
    textDecoration: 'underline',
    wordBreak: 'break-all' as const,
}

const smallText = {
    color: '#6b7280',
    fontSize: '14px',
    lineHeight: '22px',
    margin: '8px 0',
}

const footer = {
    padding: '24px',
    textAlign: 'center' as const,
}

const footerText = {
    color: '#9ca3af',
    fontSize: '12px',
    lineHeight: '18px',
    margin: '4px 0',
}

export default InvitationEmail