import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import prisma from '@/lib/prisma'

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

// Vérifie le Bearer token + x-restaurant-id + appartenance au restaurant.
// À appeler en tête de chaque route API mobile protégée.
export async function validateMobileRequest(req: Request): Promise<AuthSuccess | AuthFailure> {
    const { userId, error: tokenError } = await validateToken(req)
    if (tokenError) return { ctx: null, error: tokenError }

    const restaurantId = req.headers.get('x-restaurant-id')
    if (!restaurantId) {
        return { ctx: null, error: NextResponse.json({ error: 'x-restaurant-id manquant' }, { status: 400 }) }
    }

    const member = await prisma.restaurantUser.findFirst({
        where: { userId: userId!, restaurantId },
        select: { id: true },
    })

    if (!member) {
        return { ctx: null, error: NextResponse.json({ error: 'Accès refusé à cette structure' }, { status: 403 }) }
    }

    return { ctx: { userId: userId!, restaurantId }, error: null }
}
