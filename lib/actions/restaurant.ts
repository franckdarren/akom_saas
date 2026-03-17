// lib/actions/restaurant.ts
'use server'

import {revalidatePath} from 'next/cache'
import {createClient} from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import type {UserRole, RestaurantWithRole} from '@/types/auth'
import {generateUniqueSlug} from '@/lib/actions/slug'
import {restaurantSettingsSchema, type RestaurantSettingsInput} from '@/lib/validations/restaurant'
import {logRestaurantCreated} from '@/lib/actions/logs'
import {formatRestaurantName} from '@/lib/utils/format-text'
import {SUBSCRIPTION_CONFIG, SubscriptionPlan} from '@/lib/config/subscription'
import type {ActivityType} from '@/lib/config/activity-labels' // ← NOUVEAU


interface CreateRestaurantInput {
    name: string
    phone?: string
    address?: string
    plan?: SubscriptionPlan
    activityType?: ActivityType  // ← NOUVEAU
}

// ============================================================
// CRÉER UN RESTAURANT
// ============================================================
// Logique :
//  1. Vérifier l'authentification
//  2. Vérifier si l'utilisateur a déjà un restaurant (règle SaaS)
//  3. Générer un slug unique AVANT la transaction (important !)
//  4. Créer restaurant + lien utilisateur + abonnement en une seule transaction atomique
// ============================================================

export async function createRestaurant(data: CreateRestaurantInput) {
    const supabase = await createClient()

    const {
        data: {user},
    } = await supabase.auth.getUser()

    if (!user) {
        return {success: false, error: 'Non authentifié'}
    }

    // Validation minimale du nom avant tout traitement
    if (!data.name || data.name.trim().length === 0) {
        return {success: false, error: 'Le nom du restaurant est obligatoire'}
    }

    try {
        // -------------------------------------------------------
        // ÉTAPE 1 : Vérifier les droits multi-restaurant
        // Un utilisateur non-premium ne peut posséder qu'un seul restaurant
        // -------------------------------------------------------
        const existingRestaurantUser = await prisma.restaurantUser.findFirst({
            where: {
                userId: user.id,
                role: 'admin',
            },
            include: {
                restaurant: {
                    include: {
                        subscription: true,
                    },
                },
            },
        })

        if (existingRestaurantUser) {
            const subscription = existingRestaurantUser.restaurant.subscription

            // Pas d'abonnement du tout → situation anormale, on bloque
            if (!subscription) {
                return {
                    success: false,
                    error: "Abonnement invalide.",
                }
            }

            // Si l'abonnement est actif ou en trial, vérifier le plan
            if (subscription.status === 'trial' || subscription.status === 'active') {
                if (subscription.plan !== 'premium') {
                    return {
                        success: false,
                        error: "Passez en Premium pour gérer plusieurs restaurants.",
                    }
                }
            }
        }

        // -------------------------------------------------------
        // ÉTAPE 2 : Préparer les données AVANT la transaction
        //
        // ⚠️ POINT CLÉ : generateUniqueSlug() doit être appelée
        // EN DEHORS de la transaction Prisma. Pourquoi ?
        //
        // generateUniqueSlug() exécute des requêtes SELECT en boucle
        // pour vérifier l'unicité du slug. Si on les met DANS la
        // transaction interactive ($transaction avec callback async),
        // Prisma peut créer des conflits de connexion ou des deadlocks
        // car la transaction occupe une connexion pendant que
        // generateUniqueSlug essaie d'en ouvrir une autre.
        //
        // La bonne pratique : calculer tout ce dont on a besoin AVANT,
        // puis n'utiliser la transaction que pour les écritures atomiques.
        // -------------------------------------------------------

        const formattedName = formatRestaurantName(data.name)

        // Génère un slug URL-friendly et garanti unique en base
        // Ex: "Chez Maman" → "chez-maman" ou "chez-maman-2" si déjà pris
        const slug = await generateUniqueSlug(formattedName)

        const now = new Date()
        const trialEnd = new Date()
        trialEnd.setDate(now.getDate() + 14) // 14 jours d'essai gratuit

        const plan: SubscriptionPlan = data.plan ?? 'starter'
        const config = SUBSCRIPTION_CONFIG[plan]

        // -------------------------------------------------------
        // ÉTAPE 3 : Transaction atomique
        //
        // Les 3 créations (restaurant, restaurantUser, subscription)
        // sont liées : si l'une échoue, tout est annulé.
        // C'est ce qu'on appelle l'atomicité — soit tout passe, soit rien.
        // -------------------------------------------------------
        const result = await prisma.$transaction(async (tx) => {
            // Créer le restaurant avec le slug pré-calculé
            const restaurant = await tx.restaurant.create({
                data: {
                    name: formattedName,
                    slug,
                    phone: data.phone?.trim() || null,
                    address: data.address?.trim() || null,
                    isActive: true,
                    activityType: data.activityType ?? 'restaurant', // ← NOUVEAU
                },
            })

            // Associer l'utilisateur au restaurant avec le rôle admin
            await tx.restaurantUser.create({
                data: {
                    userId: user.id,
                    restaurantId: restaurant.id,
                    role: 'admin',
                },
            })

            // Créer l'abonnement en période d'essai (trial)
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

        // Invalider le cache Next.js pour que le dashboard se rafraîchisse
        revalidatePath('/dashboard')

        return {success: true, restaurant: result}

    } catch (error) {
        console.error('Erreur création restaurant:', error)
        return {success: false, error: 'Impossible de créer le restaurant'}
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
                activityType: true, // ← NOUVEAU
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