import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

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
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    const { pathname } = request.nextUrl

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

    const isPublicRoute = publicRoutes.some((route) =>
        pathname.startsWith(route)
    )

    const isProtectedRoute = protectedRoutes.some((route) =>
        pathname.startsWith(route)
    )

    const isSubscriptionExempt = subscriptionExemptRoutes.some((route) =>
        pathname.startsWith(route)
    )

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

        // VÉRIFICATION SUPERADMIN
        const superAdminEmails = (process.env.SUPER_ADMIN_EMAILS || '').split(',')
        const isSuperAdmin = superAdmins(user.email, superAdminEmails)

        if (isSuperAdmin) {
            console.log('✅ SuperAdmin detected, bypassing subscription check')
            return supabaseResponse
        }

        // Récupérer le restaurant
        const { data: restaurantUser, error: restaurantError } = await supabase
            .from('restaurant_users')
            .select('restaurant_id')
            .eq('user_id', user.id)
            .single()

        console.log('🔍 Restaurant user query:', {
            userId: user.id,
            found: !!restaurantUser,
            error: restaurantError?.message
        })

        if (!restaurantUser) {
            if (!pathname.startsWith('/onboarding')) {
                const url = request.nextUrl.clone()
                url.pathname = '/onboarding'
                return NextResponse.redirect(url)
            }
            return supabaseResponse
        }

        const restaurantId = restaurantUser.restaurant_id

        // Récupérer l'abonnement avec des logs détaillés
        const { data: subscription, error: subscriptionError } = await supabase
            .from('subscriptions')
            .select('id, status, trial_ends_at, current_period_end')
            .eq('restaurant_id', restaurantId)
            .maybeSingle() // ← CHANGEMENT ICI : maybeSingle au lieu de single

        console.log('🔍 Subscription query:', {
            restaurantId,
            found: !!subscription,
            error: subscriptionError?.message,
            subscription: subscription ? {
                id: subscription.id,
                status: subscription.status,
                trial_ends_at: subscription.trial_ends_at,
                current_period_end: subscription.current_period_end
            } : null
        })

        // Si pas d'abonnement trouvé
        if (!subscription) {
            console.log('⚠️ No subscription found, redirecting to expired')
            const url = request.nextUrl.clone()
            url.pathname = '/dashboard/subscription/expired'
            return NextResponse.redirect(url)
        }

        // Vérifier si actif
        const now = new Date()
        let isActive = false

        if (subscription.status === 'trial' && subscription.trial_ends_at) {
            const trialEnd = new Date(subscription.trial_ends_at)
            isActive = !isNaN(trialEnd.getTime()) && trialEnd > now
            
            console.log('🔍 Trial check:', {
                restaurantId,
                status: 'trial',
                trialEnd: trialEnd.toISOString(),
                now: now.toISOString(),
                isActive,
                daysLeft: Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
            })
        } 
        else if (subscription.status === 'active' && subscription.current_period_end) {
            const periodEnd = new Date(subscription.current_period_end)
            isActive = !isNaN(periodEnd.getTime()) && periodEnd > now
            
            console.log('🔍 Active subscription check:', {
                restaurantId,
                status: 'active',
                periodEnd: periodEnd.toISOString(),
                now: now.toISOString(),
                isActive,
                daysLeft: Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
            })
        }
        else {
            console.log('❌ Subscription inactive:', {
                restaurantId,
                status: subscription.status,
                hasTrialEnd: !!subscription.trial_ends_at,
                hasPeriodEnd: !!subscription.current_period_end
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
    return list.some((e) => e.trim().toLowerCase() === email.toLowerCase())
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}