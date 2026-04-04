// lib/actions/restaurant.ts
'use server'

import {revalidatePath} from 'next/cache'
import {cookies} from 'next/headers'
import {createClient} from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import type {RestaurantWithRole} from '@/types/auth'
import {generateUniqueSlug} from '@/lib/actions/slug'
import {restaurantSettingsSchema, type RestaurantSettingsInput} from '@/lib/validations/restaurant'
import {logRestaurantCreated} from '@/lib/actions/logs'
import {formatRestaurantName} from '@/lib/utils/format-text'
import {SUBSCRIPTION_CONFIG, type SubscriptionPlan} from '@/lib/config/subscription'
import type {ActivityType} from '@/lib/config/activity-labels'
import {initSystemRolesForRestaurant} from '@/lib/permissions/init-system-roles'

// ============================================================
// TYPES
// ============================================================

interface CreateRestaurantInput {
    name: string
    phone?: string
    address?: string
    plan?: SubscriptionPlan
    activityType?: ActivityType
}

// ============================================================
// HELPER : Mappe config statique → champs Prisma Subscription
// Ton schéma n'a que : basePlanPrice, billingCycle, activeUsersCount
// Les features (multi_restaurants, etc.) ne sont PAS en BDD —
// elles se lisent toujours depuis SUBSCRIPTION_CONFIG[plan]
// ============================================================

function buildSubscriptionData(plan: SubscriptionPlan, restaurantId: string) {
    const config = SUBSCRIPTION_CONFIG[plan]
    const now = new Date()
    const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)

    return {
        restaurantId,
        plan,
        status: 'trial' as const,
        trialStartsAt: now,
        trialEndsAt: trialEnd,
        basePlanPrice: config.baseMonthlyPrice,
        billingCycle: 1,
        activeUsersCount: 1,
    }
}

// ============================================================
// CRÉER UN RESTAURANT (onboarding initial)
// ============================================================

export async function createRestaurant(data: CreateRestaurantInput) {
    const supabase = await createClient()
    const {data: {user}} = await supabase.auth.getUser()

    if (!user) return {success: false, error: 'Non authentifié'}
    if (!data.name?.trim()) return {success: false, error: 'Le nom du restaurant est obligatoire'}

    try {
        // -------------------------------------------------------
        // ÉTAPE 1 : Vérifier les droits multi-restaurant
        // -------------------------------------------------------
        const existingRestaurantUser = await prisma.restaurantUser.findFirst({
            where: {userId: user.id, customRole: {slug: 'admin'}},
            include: {
                restaurant: {
                    include: {subscription: true},
                },
            },
        })

        if (existingRestaurantUser) {
            const subscription = existingRestaurantUser.restaurant.subscription

            if (!subscription) {
                return {success: false, error: 'Abonnement invalide.'}
            }

            if (subscription.status === 'trial' || subscription.status === 'active') {
                // Lire multi_restaurants depuis la config statique
                const planConfig = SUBSCRIPTION_CONFIG[subscription.plan as SubscriptionPlan]
                if (!planConfig?.features?.multi_restaurants) {
                    return {
                        success: false,
                        error: 'Passez en Premium pour gérer plusieurs restaurants.',
                    }
                }
            }
        }

        // -------------------------------------------------------
        // ÉTAPE 2 : Slug hors transaction (évite les deadlocks)
        // -------------------------------------------------------
        const formattedName = formatRestaurantName(data.name)
        const slug = await generateUniqueSlug(formattedName)
        const plan: SubscriptionPlan = data.plan ?? 'starter'

        // -------------------------------------------------------
        // ÉTAPE 3 : Transaction atomique
        // -------------------------------------------------------
        const result = await prisma.$transaction(async (tx) => {
            const restaurant = await tx.restaurant.create({
                data: {
                    name: formattedName,
                    slug,
                    phone: data.phone?.trim() || null,
                    address: data.address?.trim() || null,
                    isActive: true,
                    activityType: data.activityType ?? 'restaurant',
                },
            })

            await tx.subscription.create({
                data: buildSubscriptionData(plan, restaurant.id),
            })

            return restaurant
        })

        // Initialiser les rôles système (hors transaction pour éviter les deadlocks sur upsert)
        const {adminRoleId} = await initSystemRolesForRestaurant(prisma, result.id)

        // Assigner le rôle Admin au créateur
        await prisma.restaurantUser.create({
            data: {
                userId: user.id,
                restaurantId: result.id,
                role: 'admin',
                roleId: adminRoleId,
            },
        })

        await logRestaurantCreated(result.id, user.id)

        // Poser le cookie immédiatement pour que le middleware
        // trouve le restaurant dès la prochaine requête vers /dashboard
        const cookieStore = await cookies()
        cookieStore.set('akom_current_restaurant_id', result.id, {
            path: '/',
            sameSite: 'lax',
            httpOnly: false,
        })

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
    const {data: {user}} = await supabase.auth.getUser()

    if (!user) return []

    const restaurantUsers = await prisma.restaurantUser.findMany({
        where: {userId: user.id},
        include: {
            customRole: {
                select: {slug: true, name: true},
            },
            restaurant: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    activityType: true,
                    isActive: true,
                    subscription: {
                        select: {
                            plan: true,
                            status: true,
                        },
                    },
                },
            },
        },
        orderBy: {createdAt: 'asc'},
    })

    return restaurantUsers.map((ru) => ({
        id: ru.restaurant.id,
        name: ru.restaurant.name,
        slug: ru.restaurant.slug,
        activityType: ru.restaurant.activityType,
        role: (ru.customRole?.slug ?? ru.role ?? 'kitchen') as RestaurantWithRole['role'],
        isActive: ru.restaurant.isActive,
        subscription: ru.restaurant.subscription ?? undefined,
    }))
}

// ============================================================
// QUOTA MULTI-STRUCTURE
// Source de vérité : SUBSCRIPTION_CONFIG[plan].features.multi_restaurants
// Le schéma Prisma ne stocke PAS les features — uniquement le plan.
// ============================================================

export async function getMultiRestaurantQuota(): Promise<{
    current: number
    max: number
    canAdd: boolean
    planRequired: SubscriptionPlan | null
}> {
    const supabase = await createClient()
    const {data: {user}} = await supabase.auth.getUser()
    if (!user) throw new Error('Non authentifié')

    const ownedRestaurants = await prisma.restaurantUser.findMany({
        where: {userId: user.id, customRole: {slug: 'admin'}},
        include: {
            restaurant: {
                include: {subscription: true},
            },
        },
    })

    const current = ownedRestaurants.length
    let maxAllowed = 1

    for (const ru of ownedRestaurants) {
        const sub = ru.restaurant.subscription
        if (!sub) continue

        const isActiveOrTrial = sub.status === 'active' || sub.status === 'trial'
        if (!isActiveOrTrial) continue

        const planConfig = SUBSCRIPTION_CONFIG[sub.plan as SubscriptionPlan]
        const hasMulti = planConfig?.features?.multi_restaurants ?? false

        if (hasMulti) {
            if (sub.plan === 'premium') maxAllowed = Math.max(maxAllowed, 10)
            else if (sub.plan === 'business') maxAllowed = Math.max(maxAllowed, 3)
        }
    }

    console.log('🏢 Multi-restaurant quota:', {current, max: maxAllowed, canAdd: current < maxAllowed})

    return {
        current,
        max: maxAllowed,
        canAdd: current < maxAllowed,
        planRequired: current >= maxAllowed ? 'premium' : null,
    }
}

// ============================================================
// CRÉER UNE STRUCTURE SUPPLÉMENTAIRE (multi-restaurant)
// ============================================================

export async function createAdditionalRestaurant(data: CreateRestaurantInput) {
    const supabase = await createClient()
    const {data: {user}} = await supabase.auth.getUser()
    if (!user) throw new Error('Non authentifié')
    if (!data.name?.trim()) throw new Error('Le nom est requis')

    const quota = await getMultiRestaurantQuota()
    if (!quota.canAdd) {
        throw new Error(
            `Vous avez atteint la limite de ${quota.max} structure(s) pour votre plan. ` +
            `Passez au plan Premium pour en ajouter davantage.`
        )
    }

    // ✅ Récupérer le plan actif de l'utilisateur (depuis son restaurant principal)
    // La nouvelle structure hérite du même plan — c'est ce que "Multi-restaurants Premium" signifie
    const primaryRestaurantUser = await prisma.restaurantUser.findFirst({
        where: {userId: user.id, customRole: {slug: 'admin'}},
        orderBy: {createdAt: 'asc'}, // Le plus ancien = restaurant principal
        include: {
            restaurant: {
                include: {subscription: true},
            },
        },
    })

    // Plan par défaut : celui du restaurant principal si actif/trial, sinon starter
    const primaryPlan = primaryRestaurantUser?.restaurant.subscription
    const inheritedPlan: SubscriptionPlan =
        primaryPlan && (primaryPlan.status === 'active' || primaryPlan.status === 'trial')
            ? primaryPlan.plan
            : 'starter'

    // data.plan permet de forcer un plan spécifique (ex: depuis le SuperAdmin)
    // Sinon on hérite du plan principal
    const plan: SubscriptionPlan = data.plan ?? inheritedPlan

    const formattedName = formatRestaurantName(data.name)
    const slug = await generateUniqueSlug(formattedName)

    try {
        const restaurant = await prisma.$transaction(async (tx) => {
            const created = await tx.restaurant.create({
                data: {
                    name: formattedName,
                    slug,
                    phone: data.phone?.trim() || null,
                    address: data.address?.trim() || null,
                    activityType: data.activityType ?? 'restaurant',
                    isActive: true,
                },
            })

            await tx.subscription.create({
                data: buildSubscriptionData(plan, created.id),
            })

            return created
        })

        // Initialiser les rôles système (hors transaction)
        const {adminRoleId} = await initSystemRolesForRestaurant(prisma, restaurant.id)

        // Assigner le rôle Admin au créateur
        await prisma.restaurantUser.create({
            data: {
                userId: user.id,
                restaurantId: restaurant.id,
                role: 'admin',
                roleId: adminRoleId,
            },
        })

        await logRestaurantCreated(restaurant.id, user.id)
        revalidatePath('/dashboard')

        return {success: true, restaurant}

    } catch (error) {
        console.error('Erreur création structure supplémentaire:', error)
        throw error
    }
}

// ============================================================
// RÉCUPÉRER LE RÔLE D'UN UTILISATEUR DANS UN RESTAURANT
// ============================================================

export async function getUserRoleInRestaurant(
    restaurantId: string
): Promise<string | null> {
    const supabase = await createClient()
    const {data: {user}} = await supabase.auth.getUser()
    if (!user) return null

    const restaurantUser = await prisma.restaurantUser.findUnique({
        where: {
            userId_restaurantId: {userId: user.id, restaurantId},
        },
        select: {role: true, customRole: {select: {slug: true}}},
    })

    if (!restaurantUser) return null
    return restaurantUser.customRole?.slug ?? restaurantUser.role ?? null
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
// CHANGER LE RÔLE D'UN UTILISATEUR
// ============================================================

export async function changeUserRole(
    restaurantId: string,
    targetUserId: string,
    newRoleId: string
) {
    const supabase = await createClient()
    const {data: {user}} = await supabase.auth.getUser()
    if (!user) throw new Error('Non authentifié')

    const currentUserRole = await getUserRoleInRestaurant(restaurantId)
    if (currentUserRole !== 'admin') throw new Error('Seuls les admins peuvent changer les rôles')
    if (user.id === targetUserId) throw new Error('Vous ne pouvez pas changer votre propre rôle')

    // Vérifier que le rôle cible existe et appartient au restaurant
    const targetRole = await prisma.role.findFirst({
        where: {id: newRoleId, restaurantId, isActive: true},
        select: {slug: true},
    })
    if (!targetRole) throw new Error('Rôle introuvable')

    // Synchroniser le champ legacy `role` pour les rôles système
    const legacyRole = (['admin', 'kitchen', 'cashier'] as const).find(r => r === targetRole.slug) ?? null

    return prisma.restaurantUser.update({
        where: {
            userId_restaurantId: {userId: targetUserId, restaurantId},
        },
        data: {roleId: newRoleId, role: legacyRole},
    })
}

// ============================================================
// RETIRER UN UTILISATEUR D'UN RESTAURANT
// ============================================================

export async function removeUserFromRestaurant(
    restaurantId: string,
    targetUserId: string
) {
    const supabase = await createClient()
    const {data: {user}} = await supabase.auth.getUser()
    if (!user) throw new Error('Non authentifié')

    const currentUserRole = await getUserRoleInRestaurant(restaurantId)
    if (currentUserRole !== 'admin') throw new Error('Seuls les admins peuvent retirer des utilisateurs')
    if (user.id === targetUserId) throw new Error('Vous ne pouvez pas vous retirer vous-même')

    // Vérifier qu'on ne retire pas le dernier admin
    const targetMember = await prisma.restaurantUser.findUnique({
        where: {userId_restaurantId: {userId: targetUserId, restaurantId}},
        select: {customRole: {select: {slug: true}}},
    })
    if (targetMember?.customRole?.slug === 'admin') {
        const adminCount = await prisma.restaurantUser.count({
            where: {restaurantId, customRole: {slug: 'admin'}},
        })
        if (adminCount <= 1) throw new Error('Impossible de retirer le dernier administrateur')
    }

    await prisma.restaurantUser.delete({
        where: {
            userId_restaurantId: {userId: targetUserId, restaurantId},
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
    const {data: {user}} = await supabase.auth.getUser()
    if (!user) return {error: 'Non authentifié'}

    const userRole = await prisma.restaurantUser.findUnique({
        where: {userId_restaurantId: {userId: user.id, restaurantId}},
        select: {customRole: {select: {slug: true}}},
    })

    if (!userRole || userRole.customRole?.slug !== 'admin') {
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
    const {data: {user}} = await supabase.auth.getUser()
    if (!user) return {error: 'Non authentifié'}

    const parsed = restaurantSettingsSchema.safeParse(data)
    if (!parsed.success) return {error: parsed.error.issues[0].message}

    const userRole = await prisma.restaurantUser.findUnique({
        where: {userId_restaurantId: {userId: user.id, restaurantId}},
        select: {customRole: {select: {slug: true}}},
    })

    if (!userRole || userRole.customRole?.slug !== 'admin') {
        return {error: 'Seuls les admins peuvent modifier les paramètres'}
    }

    try {
        const restaurant = await prisma.restaurant.update({
            where: {id: restaurantId},
            data: {
                name: formatRestaurantName(parsed.data.name),
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
    const {data: {user}} = await supabase.auth.getUser()
    if (!user) return {error: 'Non authentifié'}
    if (!restaurantId) throw new Error('Restaurant non sélectionné')

    const userAccess = await prisma.restaurantUser.findUnique({
        where: {userId_restaurantId: {userId: user.id, restaurantId}},
        select: {id: true},
    })

    if (!userAccess) return {error: 'Accès refusé'}

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
                activityType: true,
            },
        })

        if (!restaurant) return {error: 'Restaurant introuvable'}

        return {success: true, restaurant}
    } catch (error) {
        console.error('Erreur récupération restaurant:', error)
        return {error: 'Erreur lors de la récupération'}
    }
}

// ============================================================
// SUPPRIMER UNE STRUCTURE
// ============================================================

export async function deleteRestaurant(restaurantId: string): Promise<{
    success: boolean
    error?: string
}> {
    const supabase = await createClient()
    const {data: {user}} = await supabase.auth.getUser()
    if (!user) return {success: false, error: 'Non authentifié'}

    // ── 1. Vérifier que l'user est admin de cette structure ───────────
    const restaurantUser = await prisma.restaurantUser.findUnique({
        where: {
            userId_restaurantId: {userId: user.id, restaurantId},
        },
        select: {customRole: {select: {slug: true}}},
    })

    if (!restaurantUser || restaurantUser.customRole?.slug !== 'admin') {
        return {success: false, error: 'Accès refusé'}
    }

    // ── 2. Vérifier que ce n'est PAS le restaurant principal ──────────
    const firstRestaurantUser = await prisma.restaurantUser.findFirst({
        where: {userId: user.id, customRole: {slug: 'admin'}},
        orderBy: {createdAt: 'asc'},
        select: {restaurantId: true},
    })

    if (firstRestaurantUser?.restaurantId === restaurantId) {
        return {
            success: false,
            error: 'Impossible de supprimer votre structure principale. ' +
                'Contactez le support si vous souhaitez fermer votre compte.',
        }
    }

    // ── 3. Vérifier l'absence de commandes actives ────────────────────
    const activeOrdersCount = await prisma.order.count({
        where: {
            restaurantId,
            status: {in: ['pending', 'preparing', 'ready']},
        },
    })

    if (activeOrdersCount > 0) {
        return {
            success: false,
            error: `Impossible de supprimer cette structure : ${activeOrdersCount} commande(s) en cours. ` +
                `Terminez ou annulez toutes les commandes avant de supprimer.`,
        }
    }

    // ── 4. Supprimer (cascade via Prisma) ─────────────────────────────
    // Le onDelete: Cascade sur toutes les relations supprime automatiquement :
    // tables, categories, products, orders, stocks, subscription, etc.
    try {
        await prisma.restaurant.delete({
            where: {id: restaurantId},
        })

        // Nettoyer le cookie si c'était la structure active
        revalidatePath('/dashboard')

        return {success: true}
    } catch (error) {
        console.error('Erreur suppression restaurant:', error)
        return {success: false, error: 'Erreur lors de la suppression'}
    }
}