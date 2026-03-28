// middleware.ts
import {createServerClient} from '@supabase/ssr'
import {NextResponse, type NextRequest} from 'next/server'

export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({request})

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({name, value}) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({request})
                    cookiesToSet.forEach(({name, value, options}) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const {pathname} = request.nextUrl

    const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password']
    const isPublicRoute = publicRoutes.some(r => pathname.startsWith(r))

    // Ne pas appeler getUser() sur les routes publiques — inutile et source de timeout
    let user = null
    if (!isPublicRoute) {
        try {
            const result = await Promise.race([
                supabase.auth.getUser(),
                new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error('Supabase timeout')), 5000)
                ),
            ])
            user = result.data.user ?? null
        } catch (err) {
            console.error('❌ Middleware auth error:', err)
            if (!pathname.startsWith('/reset-password')) {
                const url = request.nextUrl.clone()
                url.pathname = '/login'
                return NextResponse.redirect(url)
            }
        }
    }

    // ============================================================
    // PROTECTION DES ROUTES SUPERADMIN
    // ============================================================

    if (pathname.startsWith('/superadmin')) {
        if (!user) {
            const url = request.nextUrl.clone()
            url.pathname = '/login'
            return NextResponse.redirect(url)
        }

        const superAdminEmails = (process.env.SUPER_ADMIN_EMAILS || '').split(',')
        if (!superAdmins(user.email, superAdminEmails)) {
            const url = request.nextUrl.clone()
            url.pathname = '/dashboard'
            return NextResponse.redirect(url)
        }

        return supabaseResponse
    }

    // ============================================================
    // ROUTES
    // ============================================================

    const protectedRoutes = ['/dashboard', '/superadmin', '/update-password', '/onboarding']
    const subscriptionExemptRoutes = [
        '/dashboard/subscription',
        '/dashboard/subscription/expired',
        '/dashboard/subscription/choose-plan',
        '/dashboard/subscription/payment',
    ]

    const isProtectedRoute    = protectedRoutes.some(r => pathname.startsWith(r))
    const isSubscriptionExempt = subscriptionExemptRoutes.some(r => pathname.startsWith(r))

    // ============================================================
    // RÈGLES AUTH
    // ============================================================

    if (pathname.startsWith('/reset-password')) return supabaseResponse

    if (user && isPublicRoute) {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
    }

    if (!user && isProtectedRoute) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // ============================================================
    // RÈGLES ABONNEMENT
    // ============================================================

    if (user && pathname.startsWith('/dashboard') && !isSubscriptionExempt) {

        const superAdminEmails = (process.env.SUPER_ADMIN_EMAILS || '').split(',')
        if (superAdmins(user.email, superAdminEmails)) return supabaseResponse

        // Résolution du restaurant actif via cookie
        const savedRestaurantId = request.cookies.get('akom_current_restaurant_id')?.value
        let restaurantId: string | null = null

        try {
            if (savedRestaurantId) {
                const {data: specificRu} = await supabase
                    .from('restaurant_users')
                    .select('restaurant_id')
                    .eq('user_id', user.id)
                    .eq('restaurant_id', savedRestaurantId)
                    .maybeSingle()

                if (specificRu) restaurantId = specificRu.restaurant_id
            }

            if (!restaurantId) {
                const {data: firstRu} = await supabase
                    .from('restaurant_users')
                    .select('restaurant_id')
                    .eq('user_id', user.id)
                    .order('created_at', {ascending: true})
                    .limit(1)
                    .maybeSingle()

                restaurantId = firstRu?.restaurant_id ?? null
            }
        } catch (err) {
            console.error('❌ Middleware restaurant query error:', err)
            const url = request.nextUrl.clone()
            url.pathname = '/login'
            return NextResponse.redirect(url)
        }

        if (!restaurantId) {
            if (!pathname.startsWith('/onboarding')) {
                const url = request.nextUrl.clone()
                url.pathname = '/onboarding'
                return NextResponse.redirect(url)
            }
            return supabaseResponse
        }

        // Synchroniser le cookie si absent ou différent.
        // On l'écrit sur le request ET sur la response : le request est nécessaire
        // pour que les Server Components le voient dans ce même cycle de requête.
        if (savedRestaurantId !== restaurantId) {
            request.cookies.set('akom_current_restaurant_id', restaurantId)
            supabaseResponse = NextResponse.next({ request })
            supabaseResponse.cookies.set('akom_current_restaurant_id', restaurantId, {
                path: '/',
                sameSite: 'lax',
                httpOnly: false,
            })
        }

        // Vérification abonnement
        try {
            const {data: subscription} = await supabase
                .from('subscriptions')
                .select('id, status, trial_ends_at, current_period_end')
                .eq('restaurant_id', restaurantId)
                .maybeSingle()

            if (!subscription) {
                const url = request.nextUrl.clone()
                url.pathname = '/dashboard/subscription/expired'
                return NextResponse.redirect(url)
            }

            const now = new Date()
            let isActive = false

            if (subscription.status === 'trial' && subscription.trial_ends_at) {
                isActive = new Date(subscription.trial_ends_at) > now
            } else if (subscription.status === 'active' && subscription.current_period_end) {
                isActive = new Date(subscription.current_period_end) > now
            }

            if (!isActive) {
                const url = request.nextUrl.clone()
                url.pathname = '/dashboard/subscription/expired'
                return NextResponse.redirect(url)
            }
        } catch (err) {
            console.error('❌ Middleware subscription query error:', err)
            const url = request.nextUrl.clone()
            url.pathname = '/dashboard/subscription/expired'
            return NextResponse.redirect(url)
        }
    }

    return supabaseResponse
}

function superAdmins(email: string | null | undefined, list: string[]): boolean {
    if (!email) return false
    return list.some(e => e.trim().toLowerCase() === email.toLowerCase())
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}