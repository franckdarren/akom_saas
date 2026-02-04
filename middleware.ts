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

    // Rafraîchir la session si elle existe
    const {
        data: { user },
    } = await supabase.auth.getUser()

    const { pathname } = request.nextUrl

    // ============================================================
    // ROUTES
    // ============================================================

    // Routes accessibles sans être connecté
    const publicRoutes = [
        '/login',
        '/register',
        '/forgot-password',
        '/reset-password',
    ]

    // Routes réservées aux utilisateurs connectés
    const protectedRoutes = [
        '/dashboard',
        '/superadmin',
        '/update-password',
        '/onboarding',
    ]

    // Pages d'abonnement autorisées même si l'abonnement est expiré.
    // Sans cette liste, un utilisateur expiré serait redirigé en boucle
    // vers /dashboard/subscription/expired et ne pourrait jamais
    // atteindre la page de choix de plan ou de paiement.
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

    // On vérifie si la route actuelle est une route "exempte" du
    // contrôle d'abonnement. On utilise startsWith pour couvrir
    // aussi les sous-routes avec des query params (ex: /payment?plan=business)
    const isSubscriptionExempt = subscriptionExemptRoutes.some((route) =>
        pathname.startsWith(route)
    )

    // ============================================================
    // RÈGLES DE REDIRECTION — AUTH
    // ============================================================

    // TOUJOURS autoriser /reset-password (PASSWORD_RECOVERY)
    if (pathname.startsWith('/reset-password')) {
        return supabaseResponse
    }

    // 🔐 Utilisateur connecté → pas accès aux pages d'auth
    if (user && isPublicRoute) {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
    }

    // 🚫 Utilisateur non connecté → pas accès aux pages protégées
    if (!user && isProtectedRoute) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // ============================================================
    // RÈGLES DE REDIRECTION — ABONNEMENT
    // Cette section ne s'exécute que si :
    //   1. L'utilisateur est bien connecté
    //   2. Il est sur une route /dashboard/...
    //   3. Il n'est PAS sur une page d'abonnement (exemptée)
    //   4. Il n'est PAS SuperAdmin (ils sont toujours autorisés)
    // ============================================================

    if (user && pathname.startsWith('/dashboard') && !isSubscriptionExempt) {

        // VÉRIFICATION SUPERADMIN EN PREMIER
        // Les SuperAdmins bypassent TOUTES les vérifications (restaurant + abonnement).
        // On doit vérifier ça AVANT de toucher à restaurant_users pour éviter
        // de rediriger un SuperAdmin vers /onboarding s'il n'a pas de restaurant.
        const superAdminEmails = (process.env.SUPER_ADMIN_EMAILS || '').split(',')
        const isSuperAdmin = superAdmins(user.email, superAdminEmails)

        if (isSuperAdmin) {
            // SuperAdmin détecté → on laisse passer sans aucune autre vérification
            return supabaseResponse
        }

        // À partir d'ici, on sait que l'utilisateur N'EST PAS SuperAdmin.
        // On peut donc vérifier le restaurant et l'abonnement normalement.

        // Étape 1 : on récupère le restaurant de l'utilisateur.
        // On utilise Supabase directement (pas Prisma) car le
        // middleware tourne en Edge Runtime où Prisma n'est pas dispo.
        const { data: restaurantUser } = await supabase
            .from('restaurant_users')
            .select('restaurant_id')
            .eq('user_id', user.id)
            .single()

        // Si l'utilisateur n'a aucun restaurant, on le pousse
        // vers l'onboarding pour en créer un.
        if (!restaurantUser) {
            if (!pathname.startsWith('/onboarding')) {
                const url = request.nextUrl.clone()
                url.pathname = '/onboarding'
                return NextResponse.redirect(url)
            }
            // S'il est déjà sur /onboarding, on le laisse passer
            return supabaseResponse
        }

        // Étape 2 : on récupère l'abonnement lié au restaurant.
        const { data: subscription } = await supabase
            .from('subscriptions')
            .select('status, trial_ends_at, current_period_end')
            .eq('restaurant_id', restaurantUser.restaurant_id)
            .single()

        // Étape 3 : on détermine si l'abonnement est encore valable.
        // La logique est simple :
        //   - Si status = 'trial'  → on compare avec trial_ends_at
        //   - Si status = 'active' → on compare avec current_period_end
        //   - Sinon (expired/suspended/cancelled) → c'est inactif
        const now = new Date()
        let isActive = false

        if (subscription) {
            if (subscription.status === 'trial') {
                isActive = new Date(subscription.trial_ends_at) > now
            } else if (subscription.status === 'active' && subscription.current_period_end) {
                isActive = new Date(subscription.current_period_end) > now
            }
            // Les autres statuts (expired, suspended, cancelled)
            // laissent isActive à false par défaut.
        }

        // Étape 4 : si l'abonnement n'est plus actif, on redirige
        // vers la page "expiré" où l'utilisateur peut renouveler.
        if (!isActive) {
            const url = request.nextUrl.clone()
            url.pathname = '/dashboard/subscription/expired'
            return NextResponse.redirect(url)
        }
    }

    // ✅ Note importante : La vérification "a-t-il un restaurant ?"
    // est faite côté serveur dans les layouts (dashboard/layout.tsx)
    // car on ne peut pas faire de requête Prisma dans le middleware

    return supabaseResponse
}

// ============================================================
// HELPER — Vérifie si un email est SuperAdmin
// Séparé pour rendre la logique plus lisible dans le middleware.
// On trim chaque email de la liste pour éviter les erreurs
// causées par des espaces autour des virgules dans .env
// (ex: "email1@gmail.com, email2@gmail.com")
// ============================================================
function superAdmins(email: string | null | undefined, list: string[]): boolean {
    if (!email) return false
    return list.some((e) => e.trim().toLowerCase() === email.toLowerCase())
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico
         * - public files (images, etc.)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}