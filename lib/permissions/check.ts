// lib/permissions/check.ts
// Helpers de vérification de permissions pour les Server Actions.
// Remplace le pattern getCurrentRestaurantId() + vérification manuelle
// par une vérification auth + membership + permission en une seule passe.

import {cookies} from 'next/headers'
import {getAuthUser} from '@/lib/supabase/auth'
import prisma from '@/lib/prisma'
import type {PermissionResource, PermissionAction} from '@prisma/client'

interface PermissionResult {
    userId: string
    restaurantId: string
}

// Select réutilisé pour les deux fonctions
const ROLE_PERMISSION_SELECT = {
    slug: true,
    permissions: {
        select: {
            permission: {
                select: {resource: true, action: true},
            },
        },
    },
} as const

function isSuperadminEmail(email: string): boolean {
    const superadminEmails = process.env.SUPER_ADMIN_EMAILS?.split(',') || []
    return superadminEmails
        .map(e => e.trim().toLowerCase())
        .includes(email.toLowerCase())
}

function checkPermissionInRole(
    permissions: Array<{permission: {resource: PermissionResource; action: PermissionAction}}>,
    resource: PermissionResource,
    action: PermissionAction
): boolean {
    return permissions.some(
        (rp) =>
            rp.permission.resource === resource &&
            (rp.permission.action === action || rp.permission.action === 'manage')
    )
}

const ACTIVE_RESTAURANT_COOKIE = 'akom_current_restaurant_id'
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Résout la structure active avec la même règle que le middleware : celle du
 * cookie si l'utilisateur en est membre, sinon sa première structure.
 */
async function resolveActiveRestaurantId(userId: string): Promise<string | null> {
    const savedId = (await cookies()).get(ACTIVE_RESTAURANT_COOKIE)?.value

    if (savedId && UUID_REGEX.test(savedId)) {
        const ru = await prisma.restaurantUser.findUnique({
            where: {userId_restaurantId: {userId, restaurantId: savedId}},
            select: {restaurantId: true},
        })
        if (ru) return ru.restaurantId
    }

    const first = await prisma.restaurantUser.findFirst({
        where: {userId},
        orderBy: {createdAt: 'asc'},
        select: {restaurantId: true},
    })
    return first?.restaurantId ?? null
}

/**
 * Vérifie l'authentification, l'appartenance à la structure active et la permission.
 *
 * @throws Error si non authentifié, pas de restaurant, ou permission refusée
 */
export async function requirePermission(
    resource: PermissionResource,
    action: PermissionAction
): Promise<PermissionResult> {
    const user = await getAuthUser()
    if (!user) throw new Error('Non authentifié')

    const restaurantId = await resolveActiveRestaurantId(user.id)
    if (!restaurantId) throw new Error('Aucun restaurant trouvé')

    await requirePermissionForRestaurant(restaurantId, resource, action)

    return {userId: user.id, restaurantId}
}

/**
 * Vérifie la permission pour un restaurant spécifique (quand le restaurantId
 * est déjà connu, ex: getRestaurantOrders).
 *
 * @throws Error si non authentifié, pas membre, ou permission refusée
 */
export async function requirePermissionForRestaurant(
    restaurantId: string,
    resource: PermissionResource,
    action: PermissionAction
): Promise<{userId: string}> {
    const user = await getAuthUser()
    if (!user) throw new Error('Non authentifié')

    // SuperAdmin bypass
    if (user.email && isSuperadminEmail(user.email)) {
        return {userId: user.id}
    }

    const result = await checkRestaurantPermission(user.id, restaurantId, resource, action)
    if (result === 'not_member') throw new Error('Accès refusé')
    if (result === 'denied') throw new Error('Permission refusée')

    return {userId: user.id}
}

export type PermissionCheckResult = 'allowed' | 'not_member' | 'denied'

/**
 * Vérifie membership + permission pour un utilisateur déjà authentifié.
 * Utilisable hors session cookie (ex : API mobile authentifiée par Bearer token).
 */
export async function checkRestaurantPermission(
    userId: string,
    restaurantId: string,
    resource: PermissionResource,
    action: PermissionAction
): Promise<PermissionCheckResult> {
    const restaurantUser = await prisma.restaurantUser.findUnique({
        where: {
            userId_restaurantId: {userId, restaurantId},
        },
        select: {
            customRole: {select: ROLE_PERMISSION_SELECT},
        },
    })

    if (!restaurantUser) return 'not_member'

    if (restaurantUser.customRole?.slug === 'admin') return 'allowed'

    if (
        !restaurantUser.customRole ||
        !checkPermissionInRole(restaurantUser.customRole.permissions, resource, action)
    ) {
        return 'denied'
    }

    return 'allowed'
}

/**
 * Vérifie uniquement l'authentification et l'appartenance au restaurant.
 * Pour les actions qui ne nécessitent pas de permission granulaire
 * (ex: lecture simple liée au membership).
 *
 * @throws Error si non authentifié ou pas de restaurant
 */
export async function requireMembership(): Promise<PermissionResult> {
    const user = await getAuthUser()
    if (!user) throw new Error('Non authentifié')

    const restaurantId = await resolveActiveRestaurantId(user.id)
    if (!restaurantId) throw new Error('Aucun restaurant trouvé')

    return {userId: user.id, restaurantId}
}

/**
 * Vérifie l'authentification et l'appartenance à un restaurant spécifique.
 * Pour les actions accessibles à tout membre (ex: lire ses propres permissions).
 *
 * @throws Error si non authentifié ou pas membre du restaurant
 */
export async function requireMembershipForRestaurant(
    restaurantId: string
): Promise<{userId: string}> {
    const user = await getAuthUser()
    if (!user) throw new Error('Non authentifié')

    const restaurantUser = await prisma.restaurantUser.findUnique({
        where: {
            userId_restaurantId: {userId: user.id, restaurantId},
        },
        select: {id: true},
    })

    if (!restaurantUser) throw new Error('Accès refusé')

    return {userId: user.id}
}
