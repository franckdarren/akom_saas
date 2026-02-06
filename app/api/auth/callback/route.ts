import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { isSuperAdminEmail } from '@/lib/utils/permissions'

export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/dashboard'

    if (code) {
        const supabase = await createClient()
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)
        
        if (!error && data?.user) {
            // Déterminer la destination
            let redirectUrl = `${origin}/dashboard`
            
            if (isSuperAdminEmail(data.user.email || '')) {
                redirectUrl = `${origin}/superadmin`
            } else {
                const restaurantUser = await prisma.restaurantUser.findFirst({
                    where: { userId: data.user.id }
                })
                
                if (!restaurantUser) {
                    redirectUrl = `${origin}/onboarding`
                }
            }
            
            // ✅ Ajouter un paramètre de succès pour afficher un message
            const finalUrl = new URL(redirectUrl)
            finalUrl.searchParams.set('verified', 'true')
            
            return NextResponse.redirect(finalUrl.toString())
        }
    }

    return NextResponse.redirect(`${origin}/login?error=Impossible de confirmer votre email`)
}