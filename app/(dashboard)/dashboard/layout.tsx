// app/(dashboard)/dashboard/layout.tsx
import {redirect} from "next/navigation"
import {getAuthUser} from "@/lib/supabase/auth"
import {cookies} from "next/headers"
import {signOut, getUserRole} from "@/lib/actions/auth"
import {getRestaurantSubscription} from "@/lib/actions/subscription"
import {getMultiRestaurantQuota} from "@/lib/actions/restaurant"
import {getActiveModules, hydrateDefaultModules} from "@/lib/actions/modules"
import {MODULE_CATALOG, type ModuleKey} from "@/lib/config/modules"
import {AppSidebar} from "../components/app-sidebar"
import {SidebarProvider, SidebarInset} from "@/components/ui/sidebar"
import {RestaurantProvider} from "@/lib/hooks/use-restaurant"
import prisma from "@/lib/prisma"
import {IdleTimeoutProvider} from "@/providers/IdleTimeoutProvider"
import type {SubscriptionPlan} from "@/lib/config/subscription"
import type {ActivityType} from "@/lib/config/activity-labels"
import {VerificationBanner} from "@/components/dashboard/VerificationBanner"

const VERIFICATION_EXEMPT_ROUTES = [
    '/dashboard/settings',
    '/dashboard/subscription',
    '/dashboard/support',
]

export default async function DashboardLayout({
                                                  children,
                                              }: {
    children: React.ReactNode
}) {
    // ── Auth ──────────────────────────────────────────────────
    const user = await getAuthUser()
    if (!user) redirect("/login")

    const userRole = await getUserRole()

    let restaurantName: string | undefined
    let restaurantId: string | undefined
    let restaurantLogoUrl: string | undefined
    let restaurantActivityType: ActivityType | undefined
    let currentPlan: SubscriptionPlan = 'starter'
    let canAddMoreRestaurants = false
    let activeModules: ModuleKey[] = []
    // Statut de vérification de la structure active
    let verificationStatus: string | null = null
    let isFirstRestaurant = false

    if (userRole !== "superadmin") {

        const cookieStore = await cookies()
        const savedRestaurantId = cookieStore.get('akom_current_restaurant_id')?.value

        const whereClause = savedRestaurantId
            ? {userId: user.id, restaurantId: savedRestaurantId}
            : {userId: user.id}

        // Les deux requêtes sont indépendantes → parallèle
        const [restaurantUser, firstRestaurantUser] = await Promise.all([
            prisma.restaurantUser.findFirst({
                where: whereClause,
                orderBy: {createdAt: 'asc'},
                include: {
                    restaurant: {
                        select: {
                            id: true,
                            name: true,
                            activityType: true,
                            logoUrl: true,
                            verificationStatus: true,
                            isVerified: true,
                        },
                    },
                },
            }),
            prisma.restaurantUser.findFirst({
                where: {userId: user.id, customRole: {slug: 'admin'}},
                orderBy: {createdAt: 'asc'},
                select: {restaurantId: true},
            }),
        ])

        if (!restaurantUser) redirect("/onboarding")

        const restaurant = restaurantUser.restaurant

        restaurantName = restaurant.name
        restaurantId = restaurant.id
        restaurantLogoUrl = restaurant.logoUrl || undefined
        restaurantActivityType = restaurant.activityType as ActivityType
        verificationStatus = restaurant.verificationStatus

        isFirstRestaurant = firstRestaurantUser?.restaurantId === restaurant.id

        // ── Vérification bloquante UNIQUEMENT pour le restaurant principal
        // en cours d'onboarding (pas encore entré dans le dashboard)
        if (restaurant.verificationStatus !== 'verified') {

            const {headers} = await import('next/headers')
            const headersList = await headers()
            const pathname = headersList.get('x-pathname') || ''

            const isExempt = VERIFICATION_EXEMPT_ROUTES.some(route =>
                pathname.startsWith(route)
            )

            // Bloquer seulement le restaurant principal et seulement
            // s'il est suspendu (cas grave) ou si on n'est pas sur une
            // route exemptée. Les structures secondaires : jamais de
            // blocage → bannière dans le layout à la place.
            if (isFirstRestaurant && !isExempt) {
                if (restaurant.verificationStatus === 'suspended') {
                    redirect('/onboarding/suspended')
                } else if (restaurant.verificationStatus === 'pending_documents') {
                    // Première fois → onboarding bloquant
                    redirect('/onboarding/verification')
                }
                // documents_submitted / documents_rejected → bannière,
                // pas de redirect (l'user a déjà soumis, il attend)
            }
        }

        // ── Plan + modules + quota ────────────────────────────
        // Ces trois lectures sont indépendantes → exécutées en parallèle.
        // Chaque branche garde son propre try/catch pour rester tolérante
        // (table manquante, abonnement absent, etc.).
        const [planResult, modulesResult, quotaResult] = await Promise.all([
            // ── Plan ──
            (async () => {
                try {
                    const {subscription} = await getRestaurantSubscription(restaurant.id)
                    return subscription?.plan ?? null
                } catch (err) {
                    console.error('Erreur récupération abonnement:', err)
                    return null
                }
            })(),
            // ── Modules actifs ──
            // Isolé dans un try-catch : si la table n'existe pas encore
            // (migration SQL non exécutée), le dashboard reste fonctionnel.
            (async () => {
                try {
                    const modules = await getActiveModules(restaurant.id)
                    if (modules === null) {
                        return await hydrateDefaultModules(
                            restaurant.id,
                            restaurant.activityType as ActivityType,
                            user.id,
                        )
                    }
                    return modules
                } catch (err) {
                    console.error('Modules : table manquante ou erreur Prisma — migration SQL à exécuter :', err)
                    // Fallback : tous les modules actifs → comportement identique à avant la feature
                    return Object.keys(MODULE_CATALOG) as ModuleKey[]
                }
            })(),
            // ── Quota multi-structure ──
            (async () => {
                if (userRole !== 'admin') return false
                try {
                    const quota = await getMultiRestaurantQuota()
                    return quota.canAdd
                } catch (err) {
                    console.error('❌ Erreur getMultiRestaurantQuota:', err)
                    return false
                }
            })(),
        ])

        if (planResult) currentPlan = planResult
        activeModules = modulesResult
        canAddMoreRestaurants = quotaResult
    }

    async function handleSignOut() {
        "use server"
        await signOut()
    }

    // Afficher la bannière de vérification si la structure active
    // n'est pas encore vérifiée (mais sans bloquer la navigation)
    const showVerificationBanner = verificationStatus !== null
        && verificationStatus !== 'verified'
        && verificationStatus !== 'suspended'

    return (
        <IdleTimeoutProvider userRole={userRole ?? undefined}>
            <RestaurantProvider>
                <SidebarProvider>
                    <AppSidebar
                        user={{email: user.email || "", id: user.id}}
                        role={userRole}
                        restaurantName={restaurantName}
                        activityType={restaurantActivityType}
                        restaurantId={restaurantId}
                        restaurantLogoUrl={restaurantLogoUrl || ""}
                        currentPlan={currentPlan}
                        onSignOut={handleSignOut}
                        canAddMoreRestaurants={canAddMoreRestaurants}
                        activeModules={activeModules}
                    />
                    <SidebarInset>
                        {/* Bannière non bloquante pour les structures en attente */}
                        {showVerificationBanner && restaurantId && (
                            <VerificationBanner
                                restaurantId={restaurantId}
                                status={verificationStatus!}
                                isFirstRestaurant={isFirstRestaurant}
                            />
                        )}
                        {children}
                    </SidebarInset>
                </SidebarProvider>
            </RestaurantProvider>
        </IdleTimeoutProvider>
    )
}