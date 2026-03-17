import {createServerClient} from '@supabase/ssr'
import {NextResponse, type NextRequest} from 'next/server'

export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

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

    const {data: {user}} = await supabase.auth.getUser()

    const {pathname} = request.nextUrl

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
        const isSuperAdmin = superAdmins(user.email, superAdminEmails)

        if (!isSuperAdmin) {
            const url = request.nextUrl.clone()
            url.pathname = '/dashboard'
            return NextResponse.redirect(url)
        }

        return supabaseResponse
    }

    // ============================================================
    // ROUTES
    // ============================================================

    const publicRoutes = [
        '/login',
        '/register',
        '/forgot-password',
        '/reset-password',
    ]

    const protectedRoutes = [
        '/dashboard',
        '/superadmin',
        '/update-password',
        '/onboarding',
    ]

    const subscriptionExemptRoutes = [
        '/dashboard/subscription',
        '/dashboard/subscription/expired',
        '/dashboard/subscription/choose-plan',
        '/dashboard/subscription/payment',
    ]

    const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
    const isSubscriptionExempt = subscriptionExemptRoutes.some(route => pathname.startsWith(route))

    // ============================================================
    // RÈGLES DE REDIRECTION — AUTH
    // ============================================================

    if (pathname.startsWith('/reset-password')) {
        return supabaseResponse
    }

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
    // RÈGLES DE REDIRECTION — ABONNEMENT
    // ============================================================

    if (user && pathname.startsWith('/dashboard') && !isSubscriptionExempt) {

        const superAdminEmails = (process.env.SUPER_ADMIN_EMAILS || '').split(',')
        if (superAdmins(user.email, superAdminEmails)) {
            return supabaseResponse
        }

        // ── Résolution du restaurant actif ────────────────────────
        // On tente d'abord avec le cookie posé par le RestaurantSwitcher.
        // Si absent ou invalide, on tombe sur le premier restaurant de l'user.
        const savedRestaurantId = request.cookies.get('akom_current_restaurant_id')?.value

        let restaurantId: string | null = null

        if (savedRestaurantId) {
            // Vérifier que ce restaurant appartient bien à l'utilisateur
            const {data: specificRu} = await supabase
                .from('restaurant_users')
                .select('restaurant_id')
                .eq('user_id', user.id)
                .eq('restaurant_id', savedRestaurantId)
                .maybeSingle()

            if (specificRu) {
                restaurantId = specificRu.restaurant_id
            }
        }

        // Fallback : premier restaurant de l'user
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

        // Aucun restaurant → onboarding
        if (!restaurantId) {
            if (!pathname.startsWith('/onboarding')) {
                const url = request.nextUrl.clone()
                url.pathname = '/onboarding'
                return NextResponse.redirect(url)
            }
            return supabaseResponse
        }

        // ── Vérification de l'abonnement ──────────────────────────
        const {data: subscription, error: subscriptionError} = await supabase
            .from('subscriptions')
            .select('id, status, trial_ends_at, current_period_end')
            .eq('restaurant_id', restaurantId)
            .maybeSingle()

        console.log('🔍 Subscription check:', {
            restaurantId,
            found: !!subscription,
            error: subscriptionError?.message,
            status: subscription?.status ?? null,
        })

        if (!subscription) {
            console.log('⚠️ No subscription found, redirecting to expired')
            const url = request.nextUrl.clone()
            url.pathname = '/dashboard/subscription/expired'
            return NextResponse.redirect(url)
        }

        const now = new Date()
        let isActive = false

        if (subscription.status === 'trial' && subscription.trial_ends_at) {
            const trialEnd = new Date(subscription.trial_ends_at)
            isActive = !isNaN(trialEnd.getTime()) && trialEnd > now
            console.log('🔍 Trial check:', {
                trialEnd: trialEnd.toISOString(),
                isActive,
                daysLeft: Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
            })
        } else if (subscription.status === 'active' && subscription.current_period_end) {
            const periodEnd = new Date(subscription.current_period_end)
            isActive = !isNaN(periodEnd.getTime()) && periodEnd > now
            console.log('🔍 Active check:', {
                periodEnd: periodEnd.toISOString(),
                isActive,
                daysLeft: Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
            })
        } else {
            console.log('❌ Subscription inactive:', {
                status: subscription.status,
                hasTrialEnd: !!subscription.trial_ends_at,
                hasPeriodEnd: !!subscription.current_period_end,
            })
        }

        if (!isActive) {
            console.log('🚫 Redirecting to expired page')
            const url = request.nextUrl.clone()
            url.pathname = '/dashboard/subscription/expired'
            return NextResponse.redirect(url)
        }

        console.log('✅ Subscription active, allowing access to:', pathname)
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