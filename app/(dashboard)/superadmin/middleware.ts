// app/(dashboard)/superadmin/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isSuperAdminEmail } from '@/lib/utils/permissions'

export async function middleware(request: NextRequest) {
    const supabase = await createClient()

    // Vérifier l'authentification
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // Vérifier si SuperAdmin
    const isSuperAdmin = isSuperAdminEmail(user.email || '')

    if (!isSuperAdmin) {
        // Rediriger vers le dashboard normal si pas SuperAdmin
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: '/superadmin/:path*',
}