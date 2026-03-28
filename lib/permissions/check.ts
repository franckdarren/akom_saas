// lib/permissions/check.ts
// Helpers de vérification de permissions pour les Server Actions.
// Remplace le pattern getCurrentRestaurantId() + vérification manuelle
// par une vérification auth + membership + permission en une seule passe.

import {createClient} from '@/lib/supabase/server'
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

/**
 * Vérifie l'authentification, l'appartenance au restaurant et la permission.
 * Utilise le premier restaurant trouvé pour l'utilisateur (même comportement
 * que l'ancien getCurrentRestaurantId()).
 *
 * @throws Error si non authentifié, pas de restaurant, ou permission refusée
 */
export async function requirePermission(
    resource: PermissionResource,
    action: PermissionAction
): Promise<PermissionResult> {
    const supabase = await createClient()
    const {data: {user}} = await supabase.auth.getUser()
    if (!user) throw new Error('Non authentifié')

    // SuperAdmin bypass
    if (user.email && isSuperadminEmail(user.email)) {
        const ru = await prisma.restaurantUser.findFirst({
            where: {userId: user.id},
            select: {restaurantId: true},
        })
        if (!ru) throw new Error('Aucun restaurant trouvé')
        return {userId: user.id, restaurantId: ru.restaurantId}
    }

    // Single query : membership + role + permissions
    const restaurantUser = await prisma.restaurantUser.findFirst({
        where: {userId: user.id},
        select: {
            restaurantId: true,
            customRole: {select: ROLE_PERMISSION_SELECT},
        },
    })

    if (!restaurantUser) throw new Error('Aucun restaurant trouvé')

    // Admin : toutes les permissions sont déjà en base, mais shortcut
    if (restaurantUser.customRole?.slug === 'admin') {
        return {userId: user.id, restaurantId: restaurantUser.restaurantId}
    }

    if (
        !restaurantUser.customRole ||
        !checkPermissionInRole(restaurantUser.customRole.permissions, resource, action)
    ) {
        throw new Error('Permission refusée')
    }

    return {userId: user.id, restaurantId: restaurantUser.restaurantId}
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
    const supabase = await createClient()
    const {data: {user}} = await supabase.auth.getUser()
    if (!user) throw new Error('Non authentifié')

    // SuperAdmin bypass
    if (user.email && isSuperadminEmail(user.email)) {
        return {userId: user.id}
    }

    const restaurantUser = await prisma.restaurantUser.findUnique({
        where: {
            userId_restaurantId: {userId: user.id, restaurantId},
        },
        select: {
            customRole: {select: ROLE_PERMISSION_SELECT},
        },
    })

    if (!restaurantUser) throw new Error('Accès refusé')

    if (restaurantUser.customRole?.slug === 'admin') {
        return {userId: user.id}
    }

    if (
        !restaurantUser.customRole ||
        !checkPermissionInRole(restaurantUser.customRole.permissions, resource, action)
    ) {
        throw new Error('Permission refusée')
    }

    return {userId: user.id}
}

/**
 * Vérifie uniquement l'authentification et l'appartenance au restaurant.
 * Pour les actions qui ne nécessitent pas de permission granulaire
 * (ex: lecture simple liée au membership).
 *
 * @throws Error si non authentifié ou pas de restaurant
 */
export async function requireMembership(): Promise<PermissionResult> {
    const supabase = await createClient()
    const {data: {user}} = await supabase.auth.getUser()
    if (!user) throw new Error('Non authentifié')

    const restaurantUser = await prisma.restaurantUser.findFirst({
        where: {userId: user.id},
        select: {restaurantId: true},
    })

    if (!restaurantUser) throw new Error('Aucun restaurant trouvé')

    return {userId: user.id, restaurantId: restaurantUser.restaurantId}
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
    const supabase = await createClient()
    const {data: {user}} = await supabase.auth.getUser()
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
