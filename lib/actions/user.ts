// lib/actions/user.ts
'use server'

import {revalidatePath} from 'next/cache'
import {supabaseAdmin} from '@/lib/supabase/admin'
import prisma from '@/lib/prisma'
import {requirePermissionForRestaurant, requireMembershipForRestaurant} from '@/lib/permissions/check'

// ============================================================
// TYPES
// ============================================================

interface CreateUserData {
    email: string
    password: string
    roleId: string // ID du rôle à attribuer
    restaurantId: string
}

interface TeamMember {
    id: string
    userId: string
    email: string
    roleId: string | null
    roleName: string
    roleSlug: string | null
    createdAt: Date
}

// ============================================================
// RÉCUPÉRER LES MEMBRES DE L'ÉQUIPE
// ============================================================

export async function getTeamMembers(
    restaurantId: string
): Promise<TeamMember[]> {
    try {
        await requirePermissionForRestaurant(restaurantId, 'users', 'read')

        const restaurantUsers = await prisma.restaurantUser.findMany({
            where: {restaurantId},
            select: {
                id: true,
                userId: true,
                roleId: true,
                createdAt: true,
                customRole: {
                    select: {name: true, slug: true},
                },
            },
            orderBy: {createdAt: 'asc'},
        })

        // Récupérer tous les users en une seule requête (batch)
        const {data: usersData} = await supabaseAdmin.auth.admin.listUsers()
        const emailMap = new Map(
            usersData.users.map((u) => [u.id, u.email || 'Email inconnu'])
        )

        const members: TeamMember[] = restaurantUsers
            .filter((ru) => emailMap.has(ru.userId))
            .map((ru) => ({
                id: ru.id,
                userId: ru.userId,
                email: emailMap.get(ru.userId) || 'Email inconnu',
                roleId: ru.roleId,
                roleName: ru.customRole?.name || 'Aucun rôle',
                roleSlug: ru.customRole?.slug ?? null,
                createdAt: ru.createdAt,
            }))

        return members
    } catch (error) {
        console.error('Erreur récupération équipe:', error)
        throw error
    }
}

// ============================================================
// CRÉER UN UTILISATEUR
// ============================================================

export async function createUser(data: CreateUserData) {
    try {
        await requirePermissionForRestaurant(data.restaurantId, 'users', 'create')

        // Validation email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(data.email)) {
            return {error: 'Email invalide'}
        }

        // Validation mot de passe
        if (data.password.length < 6) {
            return {error: 'Le mot de passe doit contenir au moins 6 caractères'}
        }

        // Vérifier que le rôle existe et appartient au restaurant
        const role = await prisma.role.findFirst({
            where: {id: data.roleId, restaurantId: data.restaurantId, isActive: true},
            select: {slug: true},
        })
        if (!role) {
            return {error: 'Rôle introuvable'}
        }

        // Synchronisation legacy : mapper le slug vers l'enum si c'est un rôle système
        const legacyRole = (['admin', 'kitchen', 'cashier'] as const).find(r => r === role.slug) ?? null

        // Vérifier si l'utilisateur existe déjà dans Supabase
        const {data: existingUsers} = await supabaseAdmin.auth.admin.listUsers()
        const existingUser = existingUsers.users.find(
            (u) => u.email === data.email.toLowerCase()
        )

        if (existingUser) {
            // Vérifier s'il est déjà membre du restaurant
            const existingMember = await prisma.restaurantUser.findUnique({
                where: {
                    userId_restaurantId: {
                        userId: existingUser.id,
                        restaurantId: data.restaurantId,
                    },
                },
            })

            if (existingMember) {
                return {error: "Cet utilisateur fait déjà partie de l'équipe"}
            }

            // Ajouter au restaurant
            await prisma.restaurantUser.create({
                data: {
                    userId: existingUser.id,
                    restaurantId: data.restaurantId,
                    roleId: data.roleId,
                    role: legacyRole,
                },
            })

            revalidatePath(`/dashboard/users`)
            return {
                success: true,
                message: "Utilisateur existant ajouté à l'équipe",
            }
        }

        // Créer un nouvel utilisateur
        const {data: newUser, error: createError} =
            await supabaseAdmin.auth.admin.createUser({
                email: data.email.toLowerCase(),
                password: data.password,
                email_confirm: true,
            })

        if (createError || !newUser.user) {
            console.error('Erreur création utilisateur:', createError)
            return {error: 'Erreur lors de la création du compte'}
        }

        // Ajouter au restaurant
        await prisma.restaurantUser.create({
            data: {
                userId: newUser.user.id,
                restaurantId: data.restaurantId,
                roleId: data.roleId,
                role: legacyRole,
            },
        })

        revalidatePath(`/dashboard/users`)
        return {
            success: true,
            message: 'Utilisateur créé avec succès',
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : ''
        if (message === 'Permission refusée') {
            return {error: "Vous n'avez pas la permission de créer des utilisateurs"}
        }
        console.error('Erreur création utilisateur:', error)
        return {error: "Erreur lors de la création de l'utilisateur"}
    }
}

// ============================================================
// CHANGER LE RÔLE D'UN MEMBRE
// ============================================================

export async function changeUserRole(
    restaurantId: string,
    userId: string,
    newRoleId: string
) {
    try {
        const {userId: currentUserId} = await requirePermissionForRestaurant(restaurantId, 'users', 'update')

        // Impossible de modifier son propre rôle
        if (currentUserId === userId) {
            return {error: 'Vous ne pouvez pas modifier votre propre rôle'}
        }

        // Vérifier que le nouveau rôle existe
        const newRole = await prisma.role.findFirst({
            where: {id: newRoleId, restaurantId, isActive: true},
            select: {slug: true},
        })
        if (!newRole) {
            return {error: 'Rôle introuvable'}
        }

        // Vérifier qu'il reste au moins 1 admin si on dégrade un admin
        const currentMember = await prisma.restaurantUser.findUnique({
            where: {userId_restaurantId: {userId, restaurantId}},
            select: {customRole: {select: {slug: true}}},
        })

        if (currentMember?.customRole?.slug === 'admin' && newRole.slug !== 'admin') {
            const adminCount = await prisma.restaurantUser.count({
                where: {restaurantId, customRole: {slug: 'admin'}},
            })

            if (adminCount <= 1) {
                return {error: 'Il doit rester au moins 1 administrateur'}
            }
        }

        const legacyRole = (['admin', 'kitchen', 'cashier'] as const).find(r => r === newRole.slug) ?? null

        await prisma.restaurantUser.update({
            where: {
                userId_restaurantId: {userId, restaurantId},
            },
            data: {roleId: newRoleId, role: legacyRole},
        })

        revalidatePath(`/dashboard/users`)
        return {success: true}
    } catch (error) {
        const message = error instanceof Error ? error.message : ''
        if (message === 'Permission refusée') {
            return {error: "Vous n'avez pas la permission de modifier les rôles"}
        }
        console.error('Erreur changement rôle:', error)
        return {error: 'Erreur lors du changement de rôle'}
    }
}

// ============================================================
// RETIRER UN MEMBRE
// ============================================================

export async function removeTeamMember(restaurantId: string, userId: string) {
    try {
        const {userId: currentUserId} = await requirePermissionForRestaurant(restaurantId, 'users', 'delete')

        // Impossible de se retirer soi-même
        if (currentUserId === userId) {
            return {error: 'Vous ne pouvez pas vous retirer vous-même'}
        }

        // Récupérer le rôle du membre à retirer
        const member = await prisma.restaurantUser.findUnique({
            where: {
                userId_restaurantId: {userId, restaurantId},
            },
            select: {customRole: {select: {slug: true}}},
        })

        if (!member) {
            return {error: 'Membre introuvable'}
        }

        // Si c'est un admin, vérifier qu'il en reste au moins 1
        if (member.customRole?.slug === 'admin') {
            const adminCount = await prisma.restaurantUser.count({
                where: {restaurantId, customRole: {slug: 'admin'}},
            })

            if (adminCount <= 1) {
                return {
                    error: 'Impossible de retirer le dernier administrateur',
                }
            }
        }

        await prisma.restaurantUser.delete({
            where: {
                userId_restaurantId: {userId, restaurantId},
            },
        })

        revalidatePath(`/dashboard/users`)
        return {success: true}
    } catch (error) {
        const message = error instanceof Error ? error.message : ''
        if (message === 'Permission refusée') {
            return {error: "Vous n'avez pas la permission de retirer des membres"}
        }
        console.error('Erreur retrait membre:', error)
        return {error: 'Erreur lors du retrait du membre'}
    }
}

// ============================================================
// Récupérer les utilisateurs d'un restaurant
// ============================================================

export async function getRestaurantUsers(restaurantId: string) {
    try {
        await requireMembershipForRestaurant(restaurantId)

        // Récupération des membres
        const restaurantUsers = await prisma.restaurantUser.findMany({
            where: {
                restaurantId: restaurantId,
            },
            select: {
                id: true,
                userId: true,
                roleId: true,
                createdAt: true,
                customRole: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'asc',
            },
        })

        // Récupérer les emails en batch via supabaseAdmin
        const {data: usersData} = await supabaseAdmin.auth.admin.listUsers()
        const emailMap = new Map(
            usersData.users.map((u) => [u.id, u.email || 'Email inconnu'])
        )

        const usersWithEmails = restaurantUsers.map((ru) => ({
            id: ru.id,
            userId: ru.userId,
            email: emailMap.get(ru.userId) || 'Email inconnu',
            roleId: ru.roleId,
            roleName: ru.customRole?.name || 'Aucun rôle',
            roleSlug: ru.customRole?.slug ?? null,
            createdAt: ru.createdAt.toISOString(),
        }))

        return {success: true, users: usersWithEmails}
    } catch (error) {
        console.error('Erreur récupération utilisateurs:', error)
        return {error: 'Erreur lors de la récupération des utilisateurs'}
    }
}

// ============================================================
// NOTE : inviteUserToRestaurant a été supprimé de ce fichier
// Utiliser lib/actions/invitation.ts → inviteUserToRestaurant()
// qui gère le flow complet avec la table `invitations`
// ============================================================
