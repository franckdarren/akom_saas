import {createClient} from '@/lib/supabase/server'
import {NextResponse} from 'next/server'
import type {NextRequest} from 'next/server'
import prisma from '@/lib/prisma'
import {isSuperAdminEmail} from '@/lib/utils/permissions'

export async function GET(request: NextRequest) {
    const {searchParams, origin} = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next')

    if (code) {
        const supabase = await createClient()

        // ✅ Flow recovery : déconnecter la session existante avant d'échanger le code
        if (next === '/reset-password') {
            await supabase.auth.signOut()
        }

        const {data, error} = await supabase.auth.exchangeCodeForSession(code)

        if (!error && data?.user) {

            // ✅ Si `next` est fourni (ex: reset-password), on redirige directement
            if (next) {
                return NextResponse.redirect(`${origin}${next}`)
            }

            // Sinon, calcul de la redirection normale post-login
            let redirectUrl = `${origin}/dashboard`

            if (isSuperAdminEmail(data.user.email || '')) {
                redirectUrl = `${origin}/superadmin`
            } else {
                const restaurantUser = await prisma.restaurantUser.findFirst({
                    where: {userId: data.user.id}
                })

                if (!restaurantUser) {
                    redirectUrl = `${origin}/onboarding`
                } else {
                    switch (restaurantUser.role) {
                        case 'kitchen':
                            redirectUrl = `${origin}/dashboard/orders`
                            break
                        case 'cashier':
                            redirectUrl = `${origin}/dashboard/pos`
                            break
                    }
                }
            }

            const finalUrl = new URL(redirectUrl)
            finalUrl.searchParams.set('verified', 'true')

            return NextResponse.redirect(finalUrl.toString())
        }
    }

    return NextResponse.redirect(`${origin}/login?error=Impossible de confirmer votre email`)
}