import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import prisma from '@/lib/prisma'
import { checkRestaurantPermission, type PermissionCheckResult } from '@/lib/permissions/check'
import type { PermissionAction, PermissionResource } from '@prisma/client'

export type MobileAuthContext = {
    userId: string
    restaurantId: string
}

type AuthSuccess = { ctx: MobileAuthContext; error: null }
type AuthFailure = { ctx: null; error: NextResponse }

// Vérifie uniquement le Bearer token — pour les routes qui n'ont pas encore de restaurant sélectionné.
export async function validateToken(req: Request): Promise<{ userId: string; error: null } | { userId: null; error: NextResponse }> {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
        return { userId: null, error: NextResponse.json({ error: 'Token manquant' }, { status: 401 }) }
    }

    const token = authHeader.slice(7)
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)

    if (error || !user) {
        return { userId: null, error: NextResponse.json({ error: 'Token invalide ou expiré' }, { status: 401 }) }
    }

    return { userId: user.id, error: null }
}

// 'cash' : même règle que la caisse web (requireCashAccess) — admin ou cashier.
// Il n'existe pas de permission orders.create dans le RBAC.
export type MobileAccess =
    | { resource: PermissionResource; action: PermissionAction }
    | 'cash'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function checkMobileAccess(userId: string, restaurantId: string, access: MobileAccess): Promise<PermissionCheckResult> {
    if (access !== 'cash') {
        return checkRestaurantPermission(userId, restaurantId, access.resource, access.action)
    }

    const member = await prisma.restaurantUser.findUnique({
        where: { userId_restaurantId: { userId, restaurantId } },
        select: { role: true, customRole: { select: { slug: true } } },
    })
    if (!member) return 'not_member'

    const slug = member.customRole?.slug ?? member.role
    return slug === 'admin' || slug === 'cashier' ? 'allowed' : 'denied'
}

// Vérifie le Bearer token + x-restaurant-id + appartenance au restaurant + droit d'accès.
// À appeler en tête de chaque route API mobile protégée.
export async function validateMobileRequest(req: Request, access: MobileAccess): Promise<AuthSuccess | AuthFailure> {
    const { userId, error: tokenError } = await validateToken(req)
    if (tokenError) return { ctx: null, error: tokenError }

    const restaurantId = req.headers.get('x-restaurant-id')
    if (!restaurantId || !UUID_REGEX.test(restaurantId)) {
        return { ctx: null, error: NextResponse.json({ error: 'x-restaurant-id manquant ou invalide' }, { status: 400 }) }
    }

    const result = await checkMobileAccess(userId!, restaurantId, access)

    if (result === 'not_member') {
        return { ctx: null, error: NextResponse.json({ error: 'Accès refusé à cette structure' }, { status: 403 }) }
    }
    if (result === 'denied') {
        return { ctx: null, error: NextResponse.json({ error: 'Votre rôle ne permet pas cette action' }, { status: 403 }) }
    }

    return { ctx: { userId: userId!, restaurantId }, error: null }
}
