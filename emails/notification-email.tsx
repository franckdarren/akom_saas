import {
    Body,
    Button,
    Container,
    Head,
    Heading,
    Html,
    Preview,
    Section,
    Text,
    Hr,
} from '@react-email/components'
import * as React from 'react'
import { emailColors } from '@/lib/email/colors'

export interface NotificationEmailProps {
    title: string
    intro: string
    body: string
    ctaLabel?: string
    ctaUrl?: string
    restaurantName?: string
}

export function NotificationEmail({
    title,
    intro,
    body,
    ctaLabel,
    ctaUrl,
    restaurantName,
}: NotificationEmailProps) {
    return (
        <Html>
            <Head />
            <Preview>{intro}</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Section style={header}>
                        <Heading style={heading}>Akôm</Heading>
                    </Section>

                    <Section style={content}>
                        <Heading style={h1}>{title}</Heading>

                        <Text style={text}>
                            {restaurantName ? `Bonjour, concernant ${restaurantName} :` : 'Bonjour,'}
                        </Text>

                        <Text style={text}>{body}</Text>

                        {ctaUrl && ctaLabel && (
                            <Section style={buttonContainer}>
                                <Button style={button} href={ctaUrl}>
                                    {ctaLabel}
                                </Button>
                            </Section>
                        )}

                        <Hr style={hr} />

                        <Text style={smallText}>
                            Vous recevez cet email car vous êtes administrateur d’un établissement Akôm.
                            Vous pouvez gérer vos préférences de notification depuis votre tableau de bord.
                        </Text>
                    </Section>

                    <Section style={footer}>
                        <Text style={footerText}>
                            © {new Date().getFullYear()} Akôm. Tous droits réservés.
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    )
}

const main = {
    backgroundColor: '#f6f9fc',
    fontFamily:
        '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
    backgroundColor: emailColors.background,
    margin: '0 auto',
    padding: '20px 0 48px',
    marginBottom: '64px',
    maxWidth: '600px',
}

const header = {
    padding: '32px 24px',
    backgroundColor: emailColors.foreground,
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
    color: emailColors.foreground,
    fontSize: '22px',
    fontWeight: '700',
    margin: '32px 0 16px',
    lineHeight: '1.3',
}

const text = {
    color: '#374151',
    fontSize: '16px',
    lineHeight: '26px',
    margin: '16px 0',
}

const buttonContainer = {
    textAlign: 'center' as const,
    margin: '32px 0',
}

const button = {
    backgroundColor: emailColors.primary,
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
    borderColor: emailColors.border,
    margin: '32px 0',
}

const smallText = {
    color: emailColors.mutedForeground,
    fontSize: '13px',
    lineHeight: '20px',
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

export default NotificationEmail
