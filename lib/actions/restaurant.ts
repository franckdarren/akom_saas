'use server'

import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import type { UserRole, RestaurantWithRole } from '@/types/auth'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { generateUniqueSlug } from '@/lib/actions/slug'
import { restaurantSettingsSchema, type RestaurantSettingsInput } from '@/lib/validations/restaurant'
import { logRestaurantCreated } from '@/lib/actions/logs'


interface CreateRestaurantData {
    name: string
    phone?: string
    address?: string
}

// ============================================================
// CREER UN RESTAURANT 
// ============================================================

export async function createRestaurant(data: CreateRestaurantData) {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Non authentifié' }
    }

    if (!data.name || data.name.trim().length === 0) {
        return { error: 'Le nom du restaurant est obligatoire' }
    }

    // PAS DE try/catch AUTOUR DE redirect
    const slug = await generateUniqueSlug(data.name)

    await prisma.$transaction(async (tx) => {
        const restaurant = await tx.restaurant.create({
            data: {
                name: data.name.trim(),
                slug,
                phone: data.phone?.trim() || null,
                address: data.address?.trim() || null,
                isActive: true,
            },
        })

        await tx.restaurantUser.create({
            data: {
                userId: user.id,
                restaurantId: restaurant.id,
                role: 'admin',
            },
        })

        // Logger la création
        await logRestaurantCreated(restaurant.id, restaurant.name)
    })

    revalidatePath('/dashboard')
    redirect('/dashboard')
}



// ============================================================
// RÉCUPÉRER LES RESTAURANTS D'UN UTILISATEUR
// ============================================================

export async function getUserRestaurants(): Promise<RestaurantWithRole[]> {
    const supabase = await createClient()

    // Récupérer l'utilisateur connecté
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return []
    }

    // Récupérer les restaurants avec les rôles
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
        data: { user },
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
// ============================================================

export async function inviteUserToRestaurant(
    restaurantId: string,
    email: string,
    role: UserRole
) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Non authentifié')
    }

    // Vérifier que l'utilisateur actuel est admin du restaurant
    const currentUserRole = await getUserRoleInRestaurant(restaurantId)

    if (currentUserRole !== 'admin') {
        throw new Error('Seuls les admins peuvent inviter des utilisateurs')
    }

    // Récupérer l'utilisateur à inviter par email
    const { data: invitedUser } = await supabase
        .from('auth.users')
        .select('id')
        .eq('email', email)
        .single()

    if (!invitedUser) {
        throw new Error('Utilisateur non trouvé')
    }

    // Vérifier qu'il n'est pas déjà membre
    const existingMembership = await prisma.restaurantUser.findUnique({
        where: {
            userId_restaurantId: {
                userId: invitedUser.id,
                restaurantId: restaurantId,
            },
        },
    })

    if (existingMembership) {
        throw new Error('Cet utilisateur est déjà membre du restaurant')
    }

    // Ajouter l'utilisateur au restaurant
    const restaurantUser = await prisma.restaurantUser.create({
        data: {
            userId: invitedUser.id,
            restaurantId: restaurantId,
            role: role,
        },
    })

    return restaurantUser
}

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
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Non authentifié')
    }

    // Vérifier que l'utilisateur actuel est admin
    const currentUserRole = await getUserRoleInRestaurant(restaurantId)

    if (currentUserRole !== 'admin') {
        throw new Error('Seuls les admins peuvent changer les rôles')
    }

    // Empêcher de changer son propre rôle
    if (user.id === targetUserId) {
        throw new Error('Vous ne pouvez pas changer votre propre rôle')
    }

    // Mettre à jour le rôle
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
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Non authentifié')
    }

    // Vérifier que l'utilisateur actuel est admin
    const currentUserRole = await getUserRoleInRestaurant(restaurantId)

    if (currentUserRole !== 'admin') {
        throw new Error('Seuls les admins peuvent retirer des utilisateurs')
    }

    // Empêcher de se retirer soi-même
    if (user.id === targetUserId) {
        throw new Error('Vous ne pouvez pas vous retirer vous-même')
    }

    // Supprimer l'utilisateur
    await prisma.restaurantUser.delete({
        where: {
            userId_restaurantId: {
                userId: targetUserId,
                restaurantId: restaurantId,
            },
        },
    })

    return { success: true }
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
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Non authentifié' }
    }

    // Vérifier que l'utilisateur est admin du restaurant
    const userRole = await prisma.restaurantUser.findUnique({
        where: {
            userId_restaurantId: {
                userId: user.id,
                restaurantId: restaurantId,
            },
        },
        select: { role: true },
    })

    if (!userRole || userRole.role !== 'admin') {
        return { error: 'Seuls les admins peuvent modifier l\'image de couverture' }
    }

    try {
        // Mettre à jour l'image
        await prisma.restaurant.update({
            where: { id: restaurantId },
            data: { coverImageUrl },
        })

        // Revalider les pages concernées
        revalidatePath('/dashboard/restaurants')
        revalidatePath(`/dashboard/restaurants/${restaurantId}`)

        return { success: true }
    } catch (error) {
        console.error('Erreur mise à jour cover:', error)
        return { error: 'Erreur lors de la mise à jour' }
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
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Non authentifié' }
    }

    // Validation des données
    const parsed = restaurantSettingsSchema.safeParse(data)
    if (!parsed.success) {
        return {
            error: parsed.error.issues[0].message,
        }
    }

    // Vérifier que l'utilisateur est admin du restaurant
    const userRole = await prisma.restaurantUser.findUnique({
        where: {
            userId_restaurantId: {
                userId: user.id,
                restaurantId: restaurantId,
            },
        },
        select: { role: true },
    })

    if (!userRole || userRole.role !== 'admin') {
        return { error: 'Seuls les admins peuvent modifier les paramètres' }
    }

    try {
        // Mettre à jour le restaurant
        const restaurant = await prisma.restaurant.update({
            where: { id: restaurantId },
            data: {
                name: parsed.data.name,
                phone: parsed.data.phone || null,
                address: parsed.data.address || null,
                logoUrl: parsed.data.logoUrl || null,
                coverImageUrl: parsed.data.coverImageUrl || null,
                isActive: parsed.data.isActive,
            },
        })

        // Revalider les pages concernées
        revalidatePath('/dashboard')
        revalidatePath('/dashboard/restaurants')
        revalidatePath(`/dashboard/restaurants/${restaurantId}`)

        return { success: true, restaurant }
    } catch (error) {
        console.error('Erreur mise à jour restaurant:', error)
        return { error: 'Erreur lors de la mise à jour' }
    }
}

// ============================================================
// RÉCUPÉRER LES DÉTAILS D'UN RESTAURANT (pour l'admin)
// ============================================================

export async function getRestaurantDetails(restaurantId: string) {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Non authentifié' }
    }

    if (!restaurantId) {
        throw new Error("Restaurant non sélectionné")
    }

    // Vérifier l'accès
    const userRole = await prisma.restaurantUser.findUnique({
        where: {
            userId_restaurantId: {
                userId: user.id,
                restaurantId: restaurantId,
            },
        },
        select: { role: true },
    })

    if (!userRole) {
        return { error: 'Accès refusé' }
    }

    try {
        const restaurant = await prisma.restaurant.findUnique({
            where: { id: restaurantId },
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
            return { error: 'Restaurant introuvable' }
        }

        return { success: true, restaurant }
    } catch (error) {
        console.error('Erreur récupération restaurant:', error)
        return { error: 'Erreur lors de la récupération' }
    }
}