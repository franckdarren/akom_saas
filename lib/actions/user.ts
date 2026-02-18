// lib/actions/user.ts
'use server'

import {revalidatePath} from 'next/cache'
import {createClient} from '@/lib/supabase/server'
import {supabaseAdmin} from '@/lib/supabase/admin'
import prisma from '@/lib/prisma'
import type {UserRole} from '@/types/auth'

// ============================================================
// TYPES
// ============================================================

interface CreateUserData {
    email: string
    password: string
    role: UserRole
    restaurantId: string
}

interface TeamMember {
    id: string
    userId: string
    email: string
    role: UserRole
    createdAt: Date
}

// ============================================================
// UTILITAIRE : Vérifier que l'utilisateur est admin
// ============================================================

async function requireAdmin(restaurantId: string) {
    const supabase = await createClient()
    const {
        data: {user},
    } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Non authentifié')
    }

    const restaurantUser = await prisma.restaurantUser.findUnique({
        where: {
            userId_restaurantId: {
                userId: user.id,
                restaurantId: restaurantId,
            },
        },
        select: {role: true},
    })

    if (!restaurantUser || restaurantUser.role !== 'admin') {
        throw new Error("Seuls les admins peuvent gérer l'équipe")
    }

    return user
}

// ============================================================
// RÉCUPÉRER LES MEMBRES DE L'ÉQUIPE
// ============================================================

export async function getTeamMembers(
    restaurantId: string
): Promise<TeamMember[]> {
    try {
        await requireAdmin(restaurantId)

        const restaurantUsers = await prisma.restaurantUser.findMany({
            where: {restaurantId},
            select: {
                id: true,
                userId: true,
                role: true,
                createdAt: true,
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
                role: ru.role as UserRole,
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
        await requireAdmin(data.restaurantId)

        // Validation email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(data.email)) {
            return {error: 'Email invalide'}
        }

        // Validation mot de passe
        if (data.password.length < 6) {
            return {error: 'Le mot de passe doit contenir au moins 6 caractères'}
        }

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
                    role: data.role,
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
                role: data.role,
            },
        })

        revalidatePath(`/dashboard/users`)
        return {
            success: true,
            message: 'Utilisateur créé avec succès',
        }
    } catch (error) {
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
    newRole: UserRole
) {
    try {
        const currentUser = await requireAdmin(restaurantId)

        // Impossible de modifier son propre rôle
        if (currentUser.id === userId) {
            return {error: 'Vous ne pouvez pas modifier votre propre rôle'}
        }

        // Vérifier qu'il reste au moins 1 admin
        if (newRole === 'kitchen') {
            const adminCount = await prisma.restaurantUser.count({
                where: {
                    restaurantId,
                    role: 'admin',
                },
            })

            if (adminCount <= 1) {
                return {error: 'Il doit rester au moins 1 administrateur'}
            }
        }

        await prisma.restaurantUser.update({
            where: {
                userId_restaurantId: {
                    userId,
                    restaurantId,
                },
            },
            data: {role: newRole},
        })

        revalidatePath(`/dashboard/users`)
        return {success: true}
    } catch (error) {
        console.error('Erreur changement rôle:', error)
        return {error: 'Erreur lors du changement de rôle'}
    }
}

// ============================================================
// RETIRER UN MEMBRE
// ============================================================

export async function removeTeamMember(restaurantId: string, userId: string) {
    try {
        const currentUser = await requireAdmin(restaurantId)

        // Impossible de se retirer soi-même
        if (currentUser.id === userId) {
            return {error: 'Vous ne pouvez pas vous retirer vous-même'}
        }

        // Récupérer le rôle du membre à retirer
        const member = await prisma.restaurantUser.findUnique({
            where: {
                userId_restaurantId: {
                    userId,
                    restaurantId,
                },
            },
            select: {role: true},
        })

        if (!member) {
            return {error: 'Membre introuvable'}
        }

        // Si c'est un admin, vérifier qu'il en reste au moins 1
        if (member.role === 'admin') {
            const adminCount = await prisma.restaurantUser.count({
                where: {
                    restaurantId,
                    role: 'admin',
                },
            })

            if (adminCount <= 1) {
                return {
                    error: 'Impossible de retirer le dernier administrateur',
                }
            }
        }

        await prisma.restaurantUser.delete({
            where: {
                userId_restaurantId: {
                    userId,
                    restaurantId,
                },
            },
        })

        revalidatePath(`/dashboard/users`)
        return {success: true}
    } catch (error) {
        console.error('Erreur retrait membre:', error)
        return {error: 'Erreur lors du retrait du membre'}
    }
}

// ============================================================
// Récupérer les utilisateurs d'un restaurant
// ============================================================

export async function getRestaurantUsers(restaurantId: string) {
    try {
        const supabase = await createClient()
        const {
            data: {user},
        } = await supabase.auth.getUser()

        if (!user) {
            return {error: 'Non authentifié'}
        }

        // Vérification d'accès
        const hasAccess = await prisma.restaurantUser.findUnique({
            where: {
                userId_restaurantId: {
                    userId: user.id,
                    restaurantId: restaurantId,
                },
            },
            select: {id: true},
        })

        if (!hasAccess) {
            return {error: 'Accès refusé'}
        }

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