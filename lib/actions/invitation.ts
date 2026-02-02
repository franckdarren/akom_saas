// lib/actions/invitation.ts
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
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

// ============================================================
// UTILITAIRES
// ============================================================

/**
 * Génère un token sécurisé pour l'invitation
 * Format : 32 octets = 64 caractères hexadécimaux
 */
function generateInvitationToken(): string {
    return randomBytes(32).toString('hex')
}

/**
 * Calcule la date d'expiration (7 jours à partir de maintenant)
 */
function getExpirationDate(): Date {
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)
    return expiresAt
}

/**
 * Envoie un email d'invitation
 * TODO: Intégrer Resend en production
 */
async function sendInvitationEmail(
    email: string,
    token: string,
    restaurantName: string,
    inviterEmail: string,
    roleName: string
) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const invitationLink = `${baseUrl}/invite/accept?token=${token}`

    // Pour le MVP : affichage dans la console
    console.log('='.repeat(80))
    console.log('📧 INVITATION ENVOYÉE')
    console.log('='.repeat(80))
    console.log(`À           : ${email}`)
    console.log(`Restaurant  : ${restaurantName}`)
    console.log(`Rôle        : ${roleName}`)
    console.log(`Invité par  : ${inviterEmail}`)
    console.log(`Lien        : ${invitationLink}`)
    console.log(`Expire le   : ${getExpirationDate().toLocaleDateString('fr-FR')}`)
    console.log('='.repeat(80))

    // TODO: En production, utiliser Resend
    // Voir la section "Intégration Resend" ci-dessous

    return true
}

// ============================================================
// INVITER UN UTILISATEUR (adapté au système de rôles personnalisés)
// ============================================================

export async function inviteUserToRestaurant(
    restaurantId: string,
    email: string,
    roleId: string
): Promise<ActionResult> {
    try {
        // Vérifier l'authentification
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
            where: {
                userId: user.id,
                restaurantId: restaurantId,
            },
            include: {
                customRole: { 
                    include: {
                        permissions: {
                            include: {
                                permission: true,
                            },
                        },
                    },
                },
            },
        })

        if (!inviterRole) {
            return {
                success: false,
                message: 'Accès refusé',
                error: 'Vous n\'appartenez pas à ce restaurant',
            }
        }

        // Vérifier que l'utilisateur a la permission d'inviter
        const canInvite = inviterRole.customRole?.permissions?.some(
            (rp) => rp.permission.resource === 'users' && rp.permission.action === 'create'
        ) ?? false

        if (!canInvite) {
            return {
                success: false,
                message: 'Accès refusé',
                error: 'Vous n\'avez pas la permission d\'inviter des utilisateurs',
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
            where: {
                id: roleId,
                restaurantId: restaurantId,
                isActive: true,
            },
        })

        if (!role) {
            return {
                success: false,
                message: 'Rôle invalide',
                error: 'Le rôle sélectionné n\'existe pas ou n\'est plus actif',
            }
        }

        // Vérifier si l'utilisateur n'est pas déjà membre
        // Utilisation d'une requête raw pour accéder à auth.users
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

        // Vérifier s'il n'y a pas déjà une invitation en attente
        const existingInvitation = await prisma.invitation.findFirst({
            where: {
                email: normalizedEmail,
                restaurantId: restaurantId,
                status: 'pending',
            },
        })

        if (existingInvitation) {
            return {
                success: false,
                message: 'Invitation déjà envoyée',
                error: 'Une invitation est déjà en attente pour cet email',
            }
        }

        // Récupérer les informations du restaurant
        const restaurant = await prisma.restaurant.findUnique({
            where: { id: restaurantId },
            select: { name: true },
        })

        if (!restaurant) {
            return {
                success: false,
                message: 'Restaurant introuvable',
            }
        }

        // Générer le token et créer l'invitation
        const token = generateInvitationToken()
        const expiresAt = getExpirationDate()

        const invitation = await prisma.invitation.create({
            data: {
                restaurantId,
                email: normalizedEmail,
                roleId: roleId, // Utilisation du roleId personnalisé
                token,
                status: 'pending',
                invitedBy: user.id,
                expiresAt,
            },
        })

        // Envoyer l'email d'invitation
        await sendInvitationEmail(
            normalizedEmail,
            token,
            restaurant.name,
            user.email || 'Un administrateur',
            role.name
        )

        revalidatePath('/dashboard/users')
        return {
            success: true,
            message: 'Invitation envoyée avec succès',
            invitationId: invitation.id,
        }
    } catch (error) {
        console.error('Erreur lors de l\'invitation:', error)
        return {
            success: false,
            message: 'Erreur lors de l\'envoi de l\'invitation',
            error: error instanceof Error ? error.message : 'Erreur inconnue',
        }
    }
}

// ============================================================
// ACCEPTER UNE INVITATION
// ============================================================

export async function acceptInvitation(token: string): Promise<ActionResult> {
    try {
        // Récupérer l'invitation
        const invitation = await prisma.invitation.findUnique({
            where: { token },
            include: {
                restaurant: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
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

        if (!invitation) {
            return {
                success: false,
                message: 'Invitation introuvable',
                error: 'Ce lien d\'invitation n\'est pas valide',
            }
        }

        // Vérifier le statut
        if (invitation.status !== 'pending') {
            return {
                success: false,
                message: 'Invitation non valide',
                error:
                    invitation.status === 'accepted'
                        ? 'Cette invitation a déjà été acceptée'
                        : invitation.status === 'expired'
                            ? 'Cette invitation a expiré'
                            : 'Cette invitation a été révoquée',
            }
        }

        // Vérifier l'expiration
        if (new Date() > invitation.expiresAt) {
            await prisma.invitation.update({
                where: { id: invitation.id },
                data: { status: 'expired' },
            })

            return {
                success: false,
                message: 'Invitation expirée',
                error: 'Cette invitation a expiré. Demandez une nouvelle invitation.',
            }
        }

        // Récupérer l'utilisateur connecté
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            // L'utilisateur doit d'abord se connecter ou s'inscrire
            return {
                success: false,
                message: 'Authentification requise',
                error: 'redirect_to_auth',
            }
        }

        // Vérifier que l'email correspond
        if (user.email?.toLowerCase() !== invitation.email) {
            return {
                success: false,
                message: 'Email non correspondant',
                error: `Cette invitation est pour ${invitation.email}. Vous êtes connecté avec ${user.email}.`,
            }
        }

        // Vérifier si déjà membre
        const existingMembership = await prisma.restaurantUser.findFirst({
            where: {
                userId: user.id,
                restaurantId: invitation.restaurantId,
            },
        })

        if (existingMembership) {
            // Marquer l'invitation comme acceptée quand même
            await prisma.invitation.update({
                where: { id: invitation.id },
                data: {
                    status: 'accepted',
                    acceptedAt: new Date(),
                },
            })

            return {
                success: true,
                message: 'Vous êtes déjà membre de ce restaurant',
            }
        }

        // Ajouter l'utilisateur au restaurant et marquer l'invitation comme acceptée
        await prisma.$transaction([
            prisma.restaurantUser.create({
                data: {
                    userId: user.id,
                    restaurantId: invitation.restaurantId,
                    roleId: invitation.roleId, // Utilisation du roleId personnalisé
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

        revalidatePath('/dashboard')
        return {
            success: true,
            message: `Bienvenue dans ${invitation.restaurant.name} !`,
        }
    } catch (error) {
        console.error('Erreur lors de l\'acceptation:', error)
        return {
            success: false,
            message: 'Erreur lors de l\'acceptation',
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
            }
        }

        // Récupérer l'invitation
        const invitation = await prisma.invitation.findUnique({
            where: { id: invitationId },
        })

        if (!invitation) {
            return {
                success: false,
                message: 'Invitation introuvable',
            }
        }

        // Vérifier les permissions
        const userRole = await prisma.restaurantUser.findFirst({
            where: {
                userId: user.id,
                restaurantId: invitation.restaurantId,
            },
            include: {
                customRole: {  // ← CORRECT
                    include: {
                        permissions: {
                            include: {
                                permission: true,
                            },
                        },
                    },
                },
            },
        })

        if (!userRole || !userRole.customRole) {
            return {
                success: false,
                message: 'Accès refusé',
            }
        }

        const canManageUsers = userRole.customRole.permissions.some(
            (rp) => rp.permission.resource === 'users' && rp.permission.action === 'delete'
        )

        if (!canManageUsers) {
            return {
                success: false,
                message: 'Vous n\'avez pas la permission de révoquer des invitations',
            }
        }

        if (invitation.status !== 'pending') {
            return {
                success: false,
                message: 'Cette invitation ne peut plus être révoquée',
            }
        }

        // Marquer comme révoquée
        await prisma.invitation.update({
            where: { id: invitationId },
            data: { status: 'revoked' },
        })

        revalidatePath('/dashboard/users')
        return {
            success: true,
            message: 'Invitation révoquée avec succès',
        }
    } catch (error) {
        console.error('Erreur lors de la révocation:', error)
        return {
            success: false,
            message: 'Erreur lors de la révocation',
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
            }
        }

        // Récupérer l'invitation avec toutes les relations
        const invitation = await prisma.invitation.findUnique({
            where: { id: invitationId },
            include: {
                restaurant: true,
                role: true,
            },
        })

        if (!invitation) {
            return {
                success: false,
                message: 'Invitation introuvable',
            }
        }

        // Vérifier les permissions
        const userRole = await prisma.restaurantUser.findFirst({
            where: {
                userId: user.id,
                restaurantId: invitation.restaurantId,
            },
            include: {
                customRole: {
                    include: {
                        permissions: {
                            include: {
                                permission: true,
                            },
                        },
                    },
                },
            },
        })

        if (!userRole || !userRole.customRole) {
            return {
                success: false,
                message: 'Accès refusé',
            }
        }

        const canManageUsers = userRole.customRole.permissions.some(
            (rp) => rp.permission.resource === 'users' && rp.permission.action === 'create'
        )

        if (!canManageUsers) {
            return {
                success: false,
                message: 'Vous n\'avez pas la permission de renvoyer des invitations',
            }
        }

        if (invitation.status === 'accepted') {
            return {
                success: false,
                message: 'Cette invitation a déjà été acceptée',
            }
        }

        // Générer un nouveau token et une nouvelle date d'expiration
        const token = generateInvitationToken()
        const expiresAt = getExpirationDate()

        // Mettre à jour l'invitation
        await prisma.invitation.update({
            where: { id: invitationId },
            data: {
                token,
                expiresAt,
                status: 'pending',
            },
        })

        // Renvoyer l'email
        await sendInvitationEmail(
            invitation.email,
            token,
            invitation.restaurant.name,
            user.email || 'Un administrateur',
            invitation.role.name
        )

        revalidatePath('/dashboard/users')
        return {
            success: true,
            message: 'Invitation renvoyée avec succès',
        }
    } catch (error) {
        console.error('Erreur lors du renvoi:', error)
        return {
            success: false,
            message: 'Erreur lors du renvoi',
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