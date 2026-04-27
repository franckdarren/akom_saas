
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

interface VerificationApprovedEmailProps {
    restaurantName: string
    dashboardUrl: string
}

export function VerificationApprovedEmail({
    restaurantName,
    dashboardUrl,
}: VerificationApprovedEmailProps) {
    return (
        <Html>
            <Head />
            <Preview>Votre établissement {restaurantName} a été approuvé sur Akôm !</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Section style={header}>
                        <Heading style={heading}>Akôm</Heading>
                    </Section>

                    <Section style={content}>
                        <Heading style={h1}>
                            Félicitations, votre établissement est vérifié !
                        </Heading>

                        <Text style={text}>Bonjour,</Text>

                        <Text style={text}>
                            Nous avons le plaisir de vous informer que votre établissement{' '}
                            <strong>{restaurantName}</strong> a été vérifié et approuvé par
                            notre équipe.
                        </Text>

                        <Text style={text}>
                            Votre compte est désormais pleinement actif. Vous pouvez dès
                            maintenant accéder à toutes les fonctionnalités de la plateforme :
                            gestion du catalogue, prise de commandes, encaissement et bien
                            plus encore.
                        </Text>

                        <Section style={buttonContainer}>
                            <Button style={button} href={dashboardUrl}>
                                Accéder à mon tableau de bord
                            </Button>
                        </Section>

                        <Hr style={hr} />

                        <Text style={smallText}>
                            Si vous avez des questions, notre équipe est disponible pour vous
                            accompagner.
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
    backgroundColor: '#16a34a',
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

export default VerificationApprovedEmail
