// lib/actions/invitation.ts
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { randomBytes } from 'crypto'
import { sendInvitationEmail as sendEmail } from '@/lib/email/send-invitation'
import { signUp, signIn } from './auth'

// ============================================================
// TYPES
// ============================================================

type ActionResult = {
    success: boolean
    message: string
    error?: string
    invitationId?: string
    shouldRedirect?: string
}

type RolePermission = {
    permission: {
        resource: string
        action: string
    }
}

type CustomRoleWithPermissions = {
    permissions: RolePermission[]
}

type RestaurantUserWithRole = {
    customRole?: CustomRoleWithPermissions | null
}

// ============================================================
// UTILITAIRES
// ============================================================

function generateInvitationToken(): string {
    return randomBytes(32).toString('hex')
}

function getExpirationDate(): Date {
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)
    return expiresAt
}

// async function sendInvitationEmail(
//     email: string,
//     token: string,
//     restaurantName: string,
//     inviterEmail: string,
//     roleName: string
// ) {
//     const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
//     const invitationLink = `${baseUrl}/invite/accept?token=${token}`
//     const expiresAt = getExpirationDate()

//     // MODE DÉVELOPPEMENT : Logger dans la console
//     console.log('='.repeat(80))
//     console.log('📧 EMAIL D\'INVITATION')
//     console.log('='.repeat(80))
//     console.log(`À           : ${email}`)
//     console.log(`Restaurant  : ${restaurantName}`)
//     console.log(`Rôle        : ${roleName}`)
//     console.log(`Invité par  : ${inviterEmail}`)
//     console.log(`Lien        : ${invitationLink}`)
//     console.log(`Expire le   : ${expiresAt.toLocaleDateString('fr-FR')}`)
//     console.log('='.repeat(80))

//     // Pour le MVP, retourner true sans envoyer d'email
//     // L'admin copiera le lien manuellement
//     return true
// }

// ============================================================
// INVITER UN UTILISATEUR
// ============================================================

export async function inviteUserToRestaurant(
    restaurantId: string,
    email: string,
    roleId: string
): Promise<ActionResult> {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return {
                success: false,
                message: 'Non authentifié',
                error: 'Vous devez être connecté pour inviter des utilisateurs',
            }
        }

        // Vérifier que l'utilisateur a les permissions
        const inviterRole = await prisma.restaurantUser.findFirst({
            where: { userId: user.id, restaurantId },
            include: {
                customRole: {
                    include: { permissions: { include: { permission: true } } },
                },
            },
        }) as RestaurantUserWithRole

        if (!inviterRole) {
            return {
                success: false,
                message: 'Accès refusé',
                error: "Vous n'appartenez pas à ce restaurant",
            }
        }

        const canInvite = inviterRole.customRole?.permissions?.some(
            (rp: RolePermission) =>
                rp.permission.resource === 'users' && rp.permission.action === 'create'
        ) ?? false

        if (!canInvite) {
            return {
                success: false,
                message: 'Accès refusé',
                error: "Vous n'avez pas la permission d'inviter des utilisateurs",
            }
        }

        // Valider l'email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            return {
                success: false,
                message: 'Email invalide',
                error: 'Veuillez entrer une adresse email valide',
            }
        }

        const normalizedEmail = email.toLowerCase().trim()

        // Vérifier que le rôle existe
        const role = await prisma.role.findFirst({
            where: { id: roleId, restaurantId, isActive: true },
        })

        if (!role) {
            return {
                success: false,
                message: 'Rôle invalide',
                error: "Le rôle sélectionné n'existe pas ou n'est plus actif",
            }
        }

        // Bloquer si l'utilisateur existe déjà dans la plateforme
        const existingUser = await prisma.$queryRaw<Array<{ exists: boolean }>>`
            SELECT EXISTS (
                SELECT 1 FROM auth.users 
                WHERE LOWER(email) = ${normalizedEmail}
            ) as exists
        `

        if (existingUser[0]?.exists) {
            return {
                success: false,
                message: 'Utilisateur déjà inscrit',
                error: 'Cette personne a déjà un compte sur Akôm. Pour ajouter des utilisateurs existants, veuillez contacter le support.',
            }
        }

        // Vérifier invitation en attente
        const existingInvitation = await prisma.invitation.findFirst({
            where: { email: normalizedEmail, restaurantId, status: 'pending' },
        })

        if (existingInvitation) {
            return {
                success: false,
                message: 'Invitation déjà envoyée',
                error: 'Une invitation est déjà en attente pour cet email',
            }
        }

        const restaurant = await prisma.restaurant.findUnique({
            where: { id: restaurantId },
            select: { name: true },
        })

        if (!restaurant) {
            return { success: false, message: 'Restaurant introuvable' }
        }

        // Créer l'invitation
        const token = generateInvitationToken()
        const expiresAt = getExpirationDate()

        const invitation = await prisma.invitation.create({
            data: {
                restaurantId,
                email: normalizedEmail,
                roleId,
                token,
                status: 'pending',
                invitedBy: user.id,
                expiresAt,
            },
        })

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL!
        const invitationLink = `${baseUrl}/invite/accept?token=${token}`

        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/emails/invitation`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.CRON_SECRET}`,
            },
            body: JSON.stringify({
                to: normalizedEmail,
                restaurantName: restaurant.name,
                roleName: role.name,
                inviterName: user.email || 'Un administrateur',
                invitationLink,
                expiresAt,
            }),
        })



        revalidatePath('/dashboard/users')
        return {
            success: true,
            message: 'Invitation envoyée avec succès',
            invitationId: invitation.id,
        }
    } catch (error) {
        console.error("Erreur lors de l'invitation:", error)
        return {
            success: false,
            message: "Erreur lors de l'envoi de l'invitation",
            error: error instanceof Error ? error.message : 'Erreur inconnue',
        }
    }
}

// ============================================================
// ACCEPTER UNE INVITATION AVEC AUTHENTIFICATION
// Cette fonction gère tout le processus : authentification + acceptation
// ============================================================

export async function acceptInvitationWithAuth(
    token: string,
    email: string,
    password: string,
    isNewAccount: boolean
): Promise<ActionResult> {
    try {
        // Étape 1 : Vérifier que l'invitation existe et est valide
        const invitation = await prisma.invitation.findUnique({
            where: { token },
            include: {
                restaurant: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                role: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        })

        if (!invitation || invitation.status !== 'pending') {
            return {
                success: false,
                message: 'Invitation invalide',
                error: "Cette invitation n'est pas valide ou a déjà été utilisée",
            }
        }

        if (new Date() > invitation.expiresAt) {
            await prisma.invitation.update({
                where: { id: invitation.id },
                data: { status: 'expired' },
            })
            return {
                success: false,
                message: 'Invitation expirée',
                error: 'Cette invitation a expiré',
            }
        }

        // Étape 2 : Authentifier ou créer le compte
        // Important : On utilise les fonctions modifiées qui ne redirigent plus automatiquement
        let authResult
        if (isNewAccount) {
            authResult = await signUp({
                email,
                password,
                confirmPassword: password,
            })
        } else {
            authResult = await signIn({
                email,
                password,
            })
        }

        if (!authResult.success) {
            return {
                success: false,
                message: authResult.message,
                error: authResult.error,
            }
        }

        // Étape 3 : Récupérer l'utilisateur maintenant authentifié
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return {
                success: false,
                message: "Erreur d'authentification",
                error: "Impossible de récupérer les informations utilisateur",
            }
        }

        // Vérifier que l'email correspond
        if (user.email?.toLowerCase() !== invitation.email) {
            return {
                success: false,
                message: 'Email non correspondant',
                error: 'Cette invitation est pour un autre email',
            }
        }

        // Étape 4 : Vérifier si déjà membre (ne devrait pas arriver, mais par sécurité)
        const existingMembership = await prisma.restaurantUser.findFirst({
            where: {
                userId: user.id,
                restaurantId: invitation.restaurantId,
            },
        })

        if (!existingMembership) {
            // Étape 5 : Ajouter au restaurant ET marquer l'invitation comme acceptée
            // en une seule transaction pour garantir la cohérence
            await prisma.$transaction([
                prisma.restaurantUser.create({
                    data: {
                        userId: user.id,
                        restaurantId: invitation.restaurantId,
                        roleId: invitation.roleId,
                    },
                }),
                prisma.invitation.update({
                    where: { id: invitation.id },
                    data: {
                        status: 'accepted',
                        acceptedAt: new Date(),
                    },
                }),
            ])
        } else {
            // Juste marquer l'invitation comme acceptée
            await prisma.invitation.update({
                where: { id: invitation.id },
                data: {
                    status: 'accepted',
                    acceptedAt: new Date(),
                },
            })
        }

        // Étape 6 : Revalider le cache et retourner le succès avec l'URL de redirection
        revalidatePath('/dashboard')
        revalidatePath('/', 'layout')

        return {
            success: true,
            message: `Bienvenue dans ${invitation.restaurant.name} !`,
            shouldRedirect: '/dashboard',
        }
    } catch (error) {
        console.error('Erreur acceptation invitation:', error)
        return {
            success: false,
            message: "Erreur lors de l'acceptation",
            error: error instanceof Error ? error.message : 'Erreur inconnue',
        }
    }
}

// ============================================================
// ACCEPTER UNE INVITATION (pour utilisateur déjà connecté)
// ============================================================

export async function acceptInvitation(token: string): Promise<ActionResult> {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return {
                success: false,
                message: 'Utilisateur non connecté',
                error: "Vous devez être connecté pour accepter une invitation",
            }
        }

        const invitation = await prisma.invitation.findUnique({
            where: { token },
            include: {
                restaurant: {
                    select: {
                        name: true,
                    },
                },
            },
        })

        if (!invitation || invitation.status !== 'pending') {
            return {
                success: false,
                message: 'Invitation invalide ou déjà utilisée',
            }
        }

        if (new Date() > invitation.expiresAt) {
            await prisma.invitation.update({
                where: { id: invitation.id },
                data: { status: 'expired' },
            })
            return {
                success: false,
                message: 'Invitation expirée',
            }
        }

        if (user.email?.toLowerCase() !== invitation.email) {
            return {
                success: false,
                message: 'Email non correspondant',
                error: 'Cette invitation est destinée à une autre adresse email',
            }
        }

        const existingMember = await prisma.restaurantUser.findFirst({
            where: { userId: user.id, restaurantId: invitation.restaurantId },
        })

        if (!existingMember) {
            await prisma.restaurantUser.create({
                data: {
                    userId: user.id,
                    restaurantId: invitation.restaurantId,
                    roleId: invitation.roleId,
                },
            })
        }

        await prisma.invitation.update({
            where: { id: invitation.id },
            data: { status: 'accepted', acceptedAt: new Date() },
        })

        revalidatePath('/dashboard')
        return {
            success: true,
            message: `Vous avez rejoint ${invitation.restaurant.name}`,
        }
    } catch (error) {
        console.error('Erreur acceptInvitation:', error)
        return {
            success: false,
            message: "Erreur lors de l'acceptation de l'invitation",
            error: error instanceof Error ? error.message : 'Erreur inconnue',
        }
    }
}

// ============================================================
// RENVOYER UNE INVITATION
// ============================================================

export async function resendInvitation(invitationId: string): Promise<ActionResult> {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return {
                success: false,
                message: 'Non authentifié',
                error: 'Vous devez être connecté',
            }
        }

        const invitation = await prisma.invitation.findUnique({
            where: { id: invitationId },
            include: {
                restaurant: { select: { name: true } },
                role: { select: { name: true } },
            },
        })

        if (!invitation) {
            return {
                success: false,
                message: 'Invitation introuvable',
            }
        }

        const inviterRole = (await prisma.restaurantUser.findFirst({
            where: { userId: user.id, restaurantId: invitation.restaurantId },
            include: {
                customRole: {
                    include: { permissions: { include: { permission: true } } },
                },
            },
        })) as RestaurantUserWithRole

        if (!inviterRole) {
            return {
                success: false,
                message: 'Accès refusé',
                error: "Vous n'appartenez pas à ce restaurant",
            }
        }

        const canInvite =
            inviterRole.customRole?.permissions?.some(
                (rp: RolePermission) =>
                    rp.permission.resource === 'users' && rp.permission.action === 'create'
            ) ?? false

        if (!canInvite) {
            return {
                success: false,
                message: 'Accès refusé',
                error: "Vous n'avez pas la permission d'inviter des utilisateurs",
            }
        }

        const token = generateInvitationToken()
        const expiresAt = getExpirationDate()

        await prisma.invitation.update({
            where: { id: invitationId },
            data: { token, expiresAt, status: 'pending' },
        })

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL!
        const invitationLink = `${baseUrl}/invite/accept?token=${token}`

        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/emails/invitation`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.CRON_SECRET}`,
            },
            body: JSON.stringify({
                to: invitation.email,
                restaurantName: invitation.restaurant.name,
                roleName: invitation.role.name,
                inviterName: user.email || 'Un administrateur',
                invitationLink,
                expiresAt,
            }),
        })



        revalidatePath('/dashboard/users')
        return {
            success: true,
            message: 'Invitation renvoyée avec succès',
        }
    } catch (error) {
        console.error('Erreur resendInvitation:', error)
        return {
            success: false,
            message: "Erreur lors du renvoi de l'invitation",
            error: error instanceof Error ? error.message : 'Erreur inconnue',
        }
    }
}

// ============================================================
// RÉVOQUER UNE INVITATION
// ============================================================

export async function revokeInvitation(invitationId: string): Promise<ActionResult> {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return {
                success: false,
                message: 'Non authentifié',
                error: 'Vous devez être connecté',
            }
        }

        const invitation = await prisma.invitation.findUnique({
            where: { id: invitationId },
        })

        if (!invitation) {
            return {
                success: false,
                message: 'Invitation introuvable',
            }
        }

        const inviterRole = (await prisma.restaurantUser.findFirst({
            where: { userId: user.id, restaurantId: invitation.restaurantId },
            include: {
                customRole: {
                    include: { permissions: { include: { permission: true } } },
                },
            },
        })) as RestaurantUserWithRole

        if (!inviterRole) {
            return {
                success: false,
                message: 'Accès refusé',
                error: "Vous n'appartenez pas à ce restaurant",
            }
        }

        const canDelete =
            inviterRole.customRole?.permissions?.some(
                (rp: RolePermission) =>
                    rp.permission.resource === 'users' && rp.permission.action === 'delete'
            ) ?? false

        if (!canDelete) {
            return {
                success: false,
                message: 'Accès refusé',
                error: "Vous n'avez pas la permission de révoquer des invitations",
            }
        }

        if (invitation.status !== 'pending') {
            return {
                success: false,
                message: 'Cette invitation ne peut plus être révoquée',
            }
        }

        await prisma.invitation.update({
            where: { id: invitationId },
            data: { status: 'revoked' },
        })

        revalidatePath('/dashboard/users')
        return {
            success: true,
            message: 'Invitation révoquée',
        }
    } catch (error) {
        console.error('Erreur revokeInvitation:', error)
        return {
            success: false,
            message: "Erreur lors de la révocation de l'invitation",
            error: error instanceof Error ? error.message : 'Erreur inconnue',
        }
    }
}

// ============================================================
// RÉCUPÉRER LES INVITATIONS D'UN RESTAURANT
// ============================================================

export async function getRestaurantInvitations(restaurantId: string) {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return []
        }

        // Vérifier l'accès au restaurant
        const hasAccess = await prisma.restaurantUser.findFirst({
            where: {
                userId: user.id,
                restaurantId: restaurantId,
            },
        })

        if (!hasAccess) {
            return []
        }

        const invitations = await prisma.invitation.findMany({
            where: {
                restaurantId,
            },
            include: {
                role: {
                    select: {
                        name: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        })

        return invitations
    } catch (error) {
        console.error('Erreur lors de la récupération des invitations:', error)
        return []
    }
}