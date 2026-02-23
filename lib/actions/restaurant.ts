// lib/actions/restaurant.ts
'use server'

import {revalidatePath} from 'next/cache'
import {redirect} from 'next/navigation'
import {createClient} from '@/lib/supabase/server'
import {supabaseAdmin} from '@/lib/supabase/admin'
import prisma from '@/lib/prisma'
import type {UserRole, RestaurantWithRole} from '@/types/auth'
import {generateUniqueSlug} from '@/lib/actions/slug'
import {restaurantSettingsSchema, type RestaurantSettingsInput} from '@/lib/validations/restaurant'
import {logRestaurantCreated} from '@/lib/actions/logs'
import {formatRestaurantName} from '@/lib/utils/format-text'
import {SUBSCRIPTION_CONFIG, SubscriptionPlan} from '@/lib/config/subscription'


interface CreateRestaurantInput {
    name: string
    plan: SubscriptionPlan
    userId: string
}

export async function createRestaurantAction({
                                                 name,
                                                 plan,
                                                 userId,
                                             }: CreateRestaurantInput) {
    try {
        const now = new Date()
        const trialEnd = new Date()
        trialEnd.setDate(now.getDate() + 14)

        const config = SUBSCRIPTION_CONFIG[plan]
        const formattedName = formatRestaurantName(name)

        const result = await prisma.$transaction(async (tx) => {
            // 1️⃣ Créer le restaurant
            const restaurant = await tx.restaurant.create({
                data: {
                    name: formattedName,
                    slug: formattedName.toLowerCase().replace(/\s+/g, '-'),
                    isActive: true,
                },
            })

            // 2️⃣ Créer la relation RestaurantUser (ADMIN)
            await tx.restaurantUser.create({
                data: {
                    userId,
                    restaurantId: restaurant.id,
                    role: 'admin',
                },
            })

            // 3️⃣ Créer l'abonnement
            await tx.subscription.create({
                data: {
                    restaurantId: restaurant.id,
                    plan,
                    status: 'trial',
                    trialStartsAt: now,
                    trialEndsAt: trialEnd,
                    basePlanPrice: config.baseMonthlyPrice,
                    billingCycle: 1,
                    activeUsersCount: 1,
                },
            })

            return restaurant
        })

        revalidatePath('/dashboard')

        return {
            success: true,
            restaurant: result,
        }
    } catch (error) {
        console.error('Erreur création restaurant:', error)

        return {
            success: false,
            error: 'Impossible de créer le restaurant',
        }
    }
}

// ============================================================
// RÉCUPÉRER LES RESTAURANTS D'UN UTILISATEUR
// ============================================================

export async function getUserRestaurants(): Promise<RestaurantWithRole[]> {
    const supabase = await createClient()

    const {
        data: {user},
    } = await supabase.auth.getUser()

    if (!user) {
        return []
    }

    const restaurantUsers = await prisma.restaurantUser.findMany({
        where: {
            userId: user.id,
        },
        include: {
            restaurant: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    isActive: true,
                },
            },
        },
    })

    return restaurantUsers.map((ru) => ({
        id: ru.restaurant.id,
        name: ru.restaurant.name,
        slug: ru.restaurant.slug,
        role: ru.role as UserRole,
        isActive: ru.restaurant.isActive,
    }))
}

// ============================================================
// RÉCUPÉRER LE RÔLE D'UN UTILISATEUR DANS UN RESTAURANT
// ============================================================

export async function getUserRoleInRestaurant(
    restaurantId: string
): Promise<UserRole | null> {
    const supabase = await createClient()

    const {
        data: {user},
    } = await supabase.auth.getUser()

    if (!user) {
        return null
    }

    const restaurantUser = await prisma.restaurantUser.findUnique({
        where: {
            userId_restaurantId: {
                userId: user.id,
                restaurantId: restaurantId,
            },
        },
        select: {
            role: true,
        },
    })

    return restaurantUser ? (restaurantUser.role as UserRole) : null
}

// ============================================================
// VÉRIFIER SI UN UTILISATEUR A ACCÈS À UN RESTAURANT
// ============================================================

export async function hasAccessToRestaurant(
    restaurantId: string
): Promise<boolean> {
    const role = await getUserRoleInRestaurant(restaurantId)
    return role !== null
}

// ============================================================
// INVITER UN UTILISATEUR DANS UN RESTAURANT
// NOTE : Cette fonction est dépréciée.
// Utiliser lib/actions/invitation.ts → inviteUserToRestaurant()
// qui gère le flow complet avec emails, tokens et la table `invitations`.
// ============================================================

// ============================================================
// CHANGER LE RÔLE D'UN UTILISATEUR
// ============================================================

export async function changeUserRole(
    restaurantId: string,
    targetUserId: string,
    newRole: UserRole
) {
    const supabase = await createClient()

    const {
        data: {user},
    } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Non authentifié')
    }

    const currentUserRole = await getUserRoleInRestaurant(restaurantId)

    if (currentUserRole !== 'admin') {
        throw new Error('Seuls les admins peuvent changer les rôles')
    }

    if (user.id === targetUserId) {
        throw new Error('Vous ne pouvez pas changer votre propre rôle')
    }

    const restaurantUser = await prisma.restaurantUser.update({
        where: {
            userId_restaurantId: {
                userId: targetUserId,
                restaurantId: restaurantId,
            },
        },
        data: {
            role: newRole,
        },
    })

    return restaurantUser
}

// ============================================================
// RETIRER UN UTILISATEUR D'UN RESTAURANT
// ============================================================

export async function removeUserFromRestaurant(
    restaurantId: string,
    targetUserId: string
) {
    const supabase = await createClient()

    const {
        data: {user},
    } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Non authentifié')
    }

    const currentUserRole = await getUserRoleInRestaurant(restaurantId)

    if (currentUserRole !== 'admin') {
        throw new Error('Seuls les admins peuvent retirer des utilisateurs')
    }

    if (user.id === targetUserId) {
        throw new Error('Vous ne pouvez pas vous retirer vous-même')
    }

    await prisma.restaurantUser.delete({
        where: {
            userId_restaurantId: {
                userId: targetUserId,
                restaurantId: restaurantId,
            },
        },
    })

    return {success: true}
}

// ============================================================
// METTRE À JOUR L'IMAGE DE COUVERTURE
// ============================================================

export async function updateRestaurantCover(
    restaurantId: string,
    coverImageUrl: string | null
) {
    const supabase = await createClient()
    const {
        data: {user},
    } = await supabase.auth.getUser()

    if (!user) {
        return {error: 'Non authentifié'}
    }

    const userRole = await prisma.restaurantUser.findUnique({
        where: {
            userId_restaurantId: {
                userId: user.id,
                restaurantId: restaurantId,
            },
        },
        select: {role: true},
    })

    if (!userRole || userRole.role !== 'admin') {
        return {error: "Seuls les admins peuvent modifier l'image de couverture"}
    }

    try {
        await prisma.restaurant.update({
            where: {id: restaurantId},
            data: {coverImageUrl},
        })

        revalidatePath('/dashboard/restaurants')
        revalidatePath(`/dashboard/restaurants/${restaurantId}`)

        return {success: true}
    } catch (error) {
        console.error('Erreur mise à jour cover:', error)
        return {error: 'Erreur lors de la mise à jour'}
    }
}

// ============================================================
// METTRE À JOUR LES PARAMÈTRES DU RESTAURANT
// ============================================================

export async function updateRestaurantSettings(
    restaurantId: string,
    data: RestaurantSettingsInput
) {
    const supabase = await createClient()
    const {
        data: {user},
    } = await supabase.auth.getUser()

    if (!user) {
        return {error: 'Non authentifié'}
    }

    const parsed = restaurantSettingsSchema.safeParse(data)
    if (!parsed.success) {
        return {
            error: parsed.error.issues[0].message,
        }
    }

    const userRole = await prisma.restaurantUser.findUnique({
        where: {
            userId_restaurantId: {
                userId: user.id,
                restaurantId: restaurantId,
            },
        },
        select: {role: true},
    })

    if (!userRole || userRole.role !== 'admin') {
        return {error: 'Seuls les admins peuvent modifier les paramètres'}
    }

    try {
        const formattedName = formatRestaurantName(parsed.data.name)

        const restaurant = await prisma.restaurant.update({
            where: {id: restaurantId},
            data: {
                name: formattedName,
                phone: parsed.data.phone || null,
                address: parsed.data.address || null,
                logoUrl: parsed.data.logoUrl || null,
                coverImageUrl: parsed.data.coverImageUrl || null,
                isActive: parsed.data.isActive,
            },
        })

        revalidatePath('/dashboard')
        revalidatePath('/dashboard/restaurants')
        revalidatePath(`/dashboard/restaurants/${restaurantId}`)

        return {success: true, restaurant}
    } catch (error) {
        console.error('Erreur mise à jour restaurant:', error)
        return {error: 'Erreur lors de la mise à jour'}
    }
}

// ============================================================
// RÉCUPÉRER LES DÉTAILS D'UN RESTAURANT
// ============================================================

export async function getRestaurantDetails(restaurantId: string) {
    const supabase = await createClient()
    const {
        data: {user},
    } = await supabase.auth.getUser()

    if (!user) {
        return {error: 'Non authentifié'}
    }

    if (!restaurantId) {
        throw new Error('Restaurant non sélectionné')
    }

    const userRole = await prisma.restaurantUser.findUnique({
        where: {
            userId_restaurantId: {
                userId: user.id,
                restaurantId: restaurantId,
            },
        },
        select: {role: true},
    })

    if (!userRole) {
        return {error: 'Accès refusé'}
    }

    try {
        const restaurant = await prisma.restaurant.findUnique({
            where: {id: restaurantId},
            select: {
                id: true,
                name: true,
                slug: true,
                phone: true,
                address: true,
                logoUrl: true,
                coverImageUrl: true,
                isActive: true,
            },
        })

        if (!restaurant) {
            return {error: 'Restaurant introuvable'}
        }

        return {success: true, restaurant}
    } catch (error) {
        console.error('Erreur récupération restaurant:', error)
        return {error: 'Erreur lors de la récupération'}
    }
}