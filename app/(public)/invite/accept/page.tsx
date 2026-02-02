// app/invite/accept/page.tsx
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { acceptInvitation } from '@/lib/actions/invitation'
import prisma from '@/lib/prisma'
import { InvitationAcceptForm } from '@/components/invite/InvitationAcceptForm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Building2, Shield, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface PageProps {
    searchParams: Promise<{
        token?: string
    }>
}

async function AcceptInvitationContent({ token }: { token: string }) {
    // Vérifier si l'utilisateur est déjà connecté
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    // Récupérer l'invitation
    const invitation = await prisma.invitation.findUnique({
        where: { token },
        include: {
            restaurant: {
                select: {
                    name: true,
                    slug: true,
                },
            },
            role: {
                select: {
                    name: true,
                    description: true,
                },
            },
        },
    })

    // === GESTION DES CAS D'ERREUR ===

    // Cas 1 : Invitation introuvable
    if (!invitation) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-muted">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <div className="flex items-center gap-2 text-destructive mb-2">
                            <AlertCircle className="h-5 w-5" />
                            <CardTitle>Invitation introuvable</CardTitle>
                        </div>
                        <CardDescription>
                            Ce lien d'invitation n'est pas valide ou a expiré.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Vérifiez que vous avez utilisé le bon lien ou demandez à
                            l'administrateur de votre restaurant de vous renvoyer une invitation.
                        </p>
                        <Button asChild className="w-full">
                            <Link href="/login">Aller à la connexion</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Cas 2 : Invitation non valide (déjà acceptée, expirée ou révoquée)
    if (invitation.status !== 'pending') {
        const statusInfo = {
            accepted: {
                title: 'Invitation déjà acceptée',
                message: 'Cette invitation a déjà été utilisée.',
                icon: <CheckCircle2 className="h-5 w-5 text-green-600" />,
            },
            expired: {
                title: 'Invitation expirée',
                message: 'Cette invitation a expiré. Demandez une nouvelle invitation à votre administrateur.',
                icon: <AlertCircle className="h-5 w-5 text-orange-600" />,
            },
            revoked: {
                title: 'Invitation révoquée',
                message: 'Cette invitation a été annulée par l\'administrateur.',
                icon: <AlertCircle className="h-5 w-5 text-red-600" />,
            },
        }

        const info = statusInfo[invitation.status as keyof typeof statusInfo] || statusInfo.expired

        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-muted">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <div className="flex items-center gap-2 mb-2">
                            {info.icon}
                            <CardTitle>{info.title}</CardTitle>
                        </div>
                        <CardDescription>{info.message}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild className="w-full">
                            <Link href="/login">Aller à la connexion</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Cas 3 : Invitation expirée (date dépassée)
    if (new Date() > invitation.expiresAt) {
        // Marquer comme expirée dans la base de données
        await prisma.invitation.update({
            where: { id: invitation.id },
            data: { status: 'expired' },
        })

        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-muted">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <div className="flex items-center gap-2 text-orange-600 mb-2">
                            <AlertCircle className="h-5 w-5" />
                            <CardTitle>Invitation expirée</CardTitle>
                        </div>
                        <CardDescription>
                            Cette invitation a expiré le{' '}
                            {invitation.expiresAt.toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                            })}.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Pour rejoindre <strong>{invitation.restaurant.name}</strong>, demandez
                            à l'administrateur de vous renvoyer une nouvelle invitation.
                        </p>
                        <Button asChild className="w-full">
                            <Link href="/login">Aller à la connexion</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // === CAS UTILISATEUR CONNECTÉ ===
    
    if (user) {
        // Cas 4 : Email non correspondant
        if (user.email?.toLowerCase() !== invitation.email) {
            return (
                <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-muted">
                    <Card className="w-full max-w-md">
                        <CardHeader>
                            <div className="flex items-center gap-2 text-destructive mb-2">
                                <AlertCircle className="h-5 w-5" />
                                <CardTitle>Email non correspondant</CardTitle>
                            </div>
                            <CardDescription>
                                Cette invitation est destinée à une autre adresse email
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="bg-muted p-4 rounded-lg space-y-2">
                                <div className="text-sm">
                                    <span className="text-muted-foreground">Invitation pour :</span>
                                    <p className="font-medium">{invitation.email}</p>
                                </div>
                                <div className="text-sm">
                                    <span className="text-muted-foreground">Vous êtes connecté avec :</span>
                                    <p className="font-medium">{user.email}</p>
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Veuillez vous déconnecter et vous reconnecter avec le bon compte
                                ou demander une invitation pour votre adresse actuelle.
                            </p>
                            <div className="flex gap-2">
                                <Button asChild variant="outline" className="flex-1">
                                    <Link href="/dashboard">Dashboard</Link>
                                </Button>
                                <Button asChild className="flex-1">
                                    <Link href="/api/auth/signout">Se déconnecter</Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )
        }

        // Cas 5 : Utilisateur connecté avec le bon email - Acceptation automatique
        const result = await acceptInvitation(token)

        if (result.success) {
            // Succès - Redirection vers le dashboard
            // IMPORTANT : Pas de redirection vers onboarding ou création de restaurant
            redirect('/dashboard')
        } else {
            // Erreur lors de l'acceptation
            return (
                <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-muted">
                    <Card className="w-full max-w-md">
                        <CardHeader>
                            <div className="flex items-center gap-2 text-destructive mb-2">
                                <AlertCircle className="h-5 w-5" />
                                <CardTitle>Erreur</CardTitle>
                            </div>
                            <CardDescription>{result.message}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {result.error && (
                                <p className="text-sm text-muted-foreground">
                                    {result.error}
                                </p>
                            )}
                            <Button asChild className="w-full">
                                <Link href="/dashboard">Aller au dashboard</Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )
        }
    }

    // === CAS UTILISATEUR NON CONNECTÉ ===
    
    // Cas 6 : Afficher le formulaire de connexion/inscription
    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-muted">
            <Card className="w-full max-w-lg">
                <CardHeader className="space-y-4">
                    {/* En-tête avec informations sur l'invitation */}
                    <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Building2 className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                            <CardTitle className="text-2xl">
                                Invitation à rejoindre
                            </CardTitle>
                            <CardDescription className="text-lg font-medium text-foreground mt-1">
                                {invitation.restaurant.name}
                            </CardDescription>
                        </div>
                    </div>

                    {/* Badge du rôle */}
                    <div className="flex items-center gap-2 pt-2">
                        <span className="text-sm text-muted-foreground">
                            Rôle qui vous sera attribué :
                        </span>
                        <Badge className="gap-1">
                            <Shield className="h-3 w-3" />
                            {invitation.role.name}
                        </Badge>
                    </div>

                    {/* Description du rôle si disponible */}
                    {invitation.role.description && (
                        <div className="bg-muted p-3 rounded-lg">
                            <p className="text-sm text-muted-foreground">
                                {invitation.role.description}
                            </p>
                        </div>
                    )}
                </CardHeader>

                <CardContent>
                    {/* Formulaire de connexion/inscription */}
                    <InvitationAcceptForm
                        token={token}
                        email={invitation.email}
                        restaurantName={invitation.restaurant.name}
                    />
                </CardContent>
            </Card>
        </div>
    )
}

export default async function AcceptInvitationPage({ searchParams }: PageProps) {
    const params = await searchParams
    const token = params.token

    // Redirection si pas de token
    if (!token) {
        redirect('/login')
    }

    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted">
                    <div className="flex flex-col items-center gap-4">
                        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm text-muted-foreground">
                            Vérification de l'invitation...
                        </p>
                    </div>
                </div>
            }
        >
            <AcceptInvitationContent token={token} />
        </Suspense>
    )
}