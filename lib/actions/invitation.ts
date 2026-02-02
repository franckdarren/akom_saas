// lib/actions/invitation.ts
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { randomBytes } from 'crypto'

// ============================================================
// TYPES
// ============================================================

type ActionResult = {
    success: boolean
    message: string
    error?: string
    invitationId?: string
}

// Type pour les permissions liées à un rôle personnalisé
type RolePermission = {
    permission: {
        resource: string
        action: string
    }
}

// Type pour un rôle personnalisé complet
type CustomRoleWithPermissions = {
    permissions: RolePermission[]
}

// Type pour l'utilisateur avec son rôle personnalisé
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

async function sendInvitationEmail(
    email: string,
    token: string,
    restaurantName: string,
    inviterEmail: string,
    roleName: string
) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const invitationLink = `${baseUrl}/invite/accept?token=${token}`

    console.log('='.repeat(80))
    console.log('📧 INVITATION ENVOYÉE')
    console.log(`À           : ${email}`)
    console.log(`Restaurant  : ${restaurantName}`)
    console.log(`Rôle        : ${roleName}`)
    console.log(`Invité par  : ${inviterEmail}`)
    console.log(`Lien        : ${invitationLink}`)
    console.log(`Expire le   : ${getExpirationDate().toLocaleDateString('fr-FR')}`)
    console.log('='.repeat(80))

    return true
}

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

        // Vérifier que l'utilisateur est admin du restaurant
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

        // Vérifier que l'utilisateur a la permission d'inviter
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

        // Vérifier que le rôle existe et appartient au restaurant
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

        // Vérifier si l'utilisateur est déjà membre
        const existingMember = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count
      FROM restaurant_users ru
      INNER JOIN auth.users u ON u.id = ru.user_id
      WHERE LOWER(u.email) = ${normalizedEmail}
        AND ru.restaurant_id = ${restaurantId}::uuid
    `
        if (Number(existingMember[0]?.count) > 0) {
            return {
                success: false,
                message: 'Utilisateur déjà membre',
                error: 'Cette personne fait déjà partie de votre restaurant',
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

        await sendInvitationEmail(
            normalizedEmail,
            token,
            restaurant.name,
            user.email || 'Un administrateur',
            role.name
        )

        revalidatePath('/dashboard/users')
        return { success: true, message: 'Invitation envoyée avec succès', invitationId: invitation.id }
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
// ACCEPT
// ============================================================

export async function acceptInvitation(token: string): Promise<ActionResult> {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return { success: false, message: 'Utilisateur non connecté', error: 'Vous devez être connecté pour accepter une invitation' }

        const invitation = await prisma.invitation.findUnique({ where: { token } })
        if (!invitation || invitation.status !== 'pending') return { success: false, message: 'Invitation invalide ou déjà utilisée' }

        if (new Date() > invitation.expiresAt) {
            await prisma.invitation.update({ where: { id: invitation.id }, data: { status: 'expired' } })
            return { success: false, message: 'Invitation expirée' }
        }

        if (user.email?.toLowerCase() !== invitation.email) {
            return { success: false, message: 'Email non correspondant', error: 'Cette invitation est destinée à une autre adresse email' }
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
        return { success: true, message: 'Invitation acceptée' }
    } catch (error) {
        console.error('Erreur acceptInvitation:', error)
        return { success: false, message: 'Erreur lors de l\'acceptation de l\'invitation', error: error instanceof Error ? error.message : 'Erreur inconnue' }
    }
}


// ============================================================
// RESEND
// ============================================================

export async function resendInvitation(invitationId: string): Promise<ActionResult> {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, message: 'Non authentifié', error: 'Vous devez être connecté' }

        const invitation = await prisma.invitation.findUnique({
            where: { id: invitationId },
            include: { restaurant: { select: { name: true } }, role: { select: { name: true } } },
        })
        if (!invitation) return { success: false, message: 'Invitation introuvable' }

        const inviterRole = await prisma.restaurantUser.findFirst({
            where: { userId: user.id, restaurantId: invitation.restaurantId },
            include: { customRole: { include: { permissions: { include: { permission: true } } } } },
        }) as RestaurantUserWithRole
        if (!inviterRole) return { success: false, message: 'Accès refusé', error: "Vous n'appartenez pas à ce restaurant" }

        const canInvite = inviterRole.customRole?.permissions?.some(
            (rp: RolePermission) => rp.permission.resource === 'users' && rp.permission.action === 'create'
        ) ?? false
        if (!canInvite) return { success: false, message: 'Accès refusé', error: "Vous n'avez pas la permission d'inviter des utilisateurs" }

        const token = generateInvitationToken()
        const expiresAt = getExpirationDate()

        await prisma.invitation.update({
            where: { id: invitationId },
            data: { token, expiresAt, status: 'pending' },
        })

        await sendInvitationEmail(invitation.email, token, invitation.restaurant.name, user.email || 'Un administrateur', invitation.role.name)
        revalidatePath('/dashboard/users')
        return { success: true, message: 'Invitation renvoyée avec succès' }
    } catch (error) {
        console.error('Erreur resendInvitation:', error)
        return { success: false, message: 'Erreur lors du renvoi de l\'invitation', error: error instanceof Error ? error.message : 'Erreur inconnue' }
    }
}

// ============================================================
// REVOKE INVITATIONS
// ============================================================

export async function revokeInvitation(invitationId: string): Promise<ActionResult> {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, message: 'Non authentifié', error: 'Vous devez être connecté' }

        const invitation = await prisma.invitation.findUnique({ where: { id: invitationId } })
        if (!invitation) return { success: false, message: 'Invitation introuvable' }

        const inviterRole = await prisma.restaurantUser.findFirst({
            where: { userId: user.id, restaurantId: invitation.restaurantId },
            include: { customRole: { include: { permissions: { include: { permission: true } } } } },
        }) as RestaurantUserWithRole
        if (!inviterRole) return { success: false, message: 'Accès refusé', error: "Vous n'appartenez pas à ce restaurant" }

        const canInvite = inviterRole.customRole?.permissions?.some(
            (rp: RolePermission) => rp.permission.resource === 'users' && rp.permission.action === 'create'
        ) ?? false
        if (!canInvite) return { success: false, message: 'Accès refusé', error: "Vous n'avez pas la permission d'inviter des utilisateurs" }

        await prisma.invitation.update({ where: { id: invitationId }, data: { status: 'revoked' } })
        revalidatePath('/dashboard/users')
        return { success: true, message: 'Invitation révoquée' }
    } catch (error) {
        console.error('Erreur revokeInvitation:', error)
        return { success: false, message: 'Erreur lors de la révocation de l\'invitation', error: error instanceof Error ? error.message : 'Erreur inconnue' }
    }
}