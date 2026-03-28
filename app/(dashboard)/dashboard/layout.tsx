// app/(dashboard)/dashboard/layout.tsx
import {redirect} from "next/navigation"
import {createClient} from "@/lib/supabase/server"
import {cookies} from "next/headers"
import {signOut, getUserRole} from "@/lib/actions/auth"
import {getRestaurantSubscription} from "@/lib/actions/subscription"
import {getMultiRestaurantQuota} from "@/lib/actions/restaurant"
import {AppSidebar} from "../components/app-sidebar"
import {SidebarProvider, SidebarInset} from "@/components/ui/sidebar"
import {RestaurantProvider} from "@/lib/hooks/use-restaurant"
import prisma from "@/lib/prisma"
import {FloatingSupportButton} from "@/components/support/FloatingSupportButton"
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
    const supabase = await createClient()
    const {data: {user}} = await supabase.auth.getUser()
    if (!user) redirect("/login")

    const userRole = await getUserRole()

    let restaurantName: string | undefined
    let restaurantId: string | undefined
    let restaurantLogoUrl: string | undefined
    let restaurantActivityType: ActivityType | undefined
    let currentPlan: SubscriptionPlan = 'starter'
    let canAddMoreRestaurants = false
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

        // ── Plan ──────────────────────────────────────────────
        try {
            const {subscription} = await getRestaurantSubscription(restaurant.id)
            if (subscription?.plan) currentPlan = subscription.plan
        } catch (error) {
            console.error('Erreur récupération abonnement:', error)
        }

        // ── Quota multi-structure ─────────────────────────────
        if (userRole === 'admin') {
            try {
                const quota = await getMultiRestaurantQuota()
                canAddMoreRestaurants = quota.canAdd
            } catch (err) {
                console.error('❌ Erreur getMultiRestaurantQuota:', err)
            }
        }
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
                    <FloatingSupportButton/>
                </SidebarProvider>
            </RestaurantProvider>
        </IdleTimeoutProvider>
    )
}