// app/(dashboard)/dashboard/layout.tsx
import {redirect} from "next/navigation"
import {createClient} from "@/lib/supabase/server"
import {signOut, getUserRole} from "@/lib/actions/auth"
import {getRestaurantSubscription} from "@/lib/actions/subscription"
import {AppSidebar} from "../components/app-sidebar"
import {SidebarProvider, SidebarInset} from "@/components/ui/sidebar"
import {RestaurantProvider} from "@/lib/hooks/use-restaurant"
import prisma from "@/lib/prisma"
import {FloatingSupportButton} from "@/components/support/FloatingSupportButton"
import {IdleTimeoutProvider} from "@/providers/IdleTimeoutProvider"
import type {SubscriptionPlan} from "@/lib/config/subscription"
import type {ActivityType} from "@/lib/config/activity-labels" // ← NOUVEAU

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
    // ============================================================
    // ÉTAPE 1 : Vérification de l'authentification
    // ============================================================

    const supabase = await createClient()
    const {data: {user}} = await supabase.auth.getUser()

    if (!user) {
        redirect("/login")
    }

    // ============================================================
    // ÉTAPE 2 : Récupération du rôle utilisateur
    // ============================================================

    const userRole = await getUserRole()

    // ============================================================
    // ÉTAPE 3 : Gestion spécifique par rôle
    // ============================================================

    let restaurantName: string | undefined
    let restaurantId: string | undefined
    let restaurantLogoUrl: string | undefined
    let restaurantActivityType: ActivityType | undefined // ← NOUVEAU
    let currentPlan: SubscriptionPlan = 'starter'

    if (userRole === "superadmin") {
        // Superadmins : pas de restaurant associé
    } else {
        // ============================================================
        // CAS UTILISATEURS NORMAUX : Vérifications complètes
        // ============================================================

        const restaurantUser = await prisma.restaurantUser.findFirst({
            where: {userId: user.id},
            include: {
                restaurant: {
                    select: {
                        id: true,
                        name: true,
                        activityType: true, // ← déjà présent dans ton code
                        logoUrl: true,
                        verificationStatus: true,
                        isVerified: true,
                    },
                },
            },
        })

        if (!restaurantUser) {
            redirect("/onboarding")
        }

        const restaurant = restaurantUser.restaurant

        // Assigner les valeurs pour la sidebar
        restaurantName = restaurant.name
        restaurantId = restaurant.id
        restaurantLogoUrl = restaurant.logoUrl || undefined
        restaurantActivityType = restaurant.activityType as ActivityType // ← NOUVEAU

        // ============================================================
        // ÉTAPE 4 : Vérification du statut
        // ============================================================

        const verificationStatus = restaurant.verificationStatus
        const isVerified = verificationStatus === 'verified'

        if (!isVerified) {
            const {headers} = await import('next/headers')
            const headersList = await headers()
            const pathname = headersList.get('x-pathname') || ''

            const isExempt = VERIFICATION_EXEMPT_ROUTES.some(route =>
                pathname.startsWith(route)
            )

            if (!isExempt) {
                if (verificationStatus === 'suspended') {
                    redirect('/onboarding/suspended')
                } else {
                    redirect('/onboarding/verification')
                }
            }
        }

        // ============================================================
        // ÉTAPE 5 : Récupération du plan d'abonnement
        // ============================================================

        try {
            const {subscription} = await getRestaurantSubscription(restaurant.id)
            if (subscription && subscription.plan) {
                currentPlan = subscription.plan
            }
        } catch (error) {
            console.error('Erreur récupération abonnement:', error)
        }
    }

    // ============================================================
    // ÉTAPE 6 : Fonction de déconnexion
    // ============================================================

    async function handleSignOut() {
        "use server"
        await signOut()
    }

    // ============================================================
    // ÉTAPE 7 : Rendu
    // ============================================================

    return (
        <IdleTimeoutProvider userRole={userRole ?? undefined}>
            <RestaurantProvider>
                <SidebarProvider>
                    <AppSidebar
                        user={{
                            email: user.email || "",
                            id: user.id,
                        }}
                        role={userRole}
                        restaurantName={restaurantName}
                        activityType={restaurantActivityType} // ← NOUVEAU : variable dédiée
                        restaurantId={restaurantId}
                        restaurantLogoUrl={restaurantLogoUrl || ""}
                        currentPlan={currentPlan}
                        onSignOut={handleSignOut}
                    />
                    <SidebarInset>
                        {children}
                    </SidebarInset>
                    <FloatingSupportButton/>
                </SidebarProvider>
            </RestaurantProvider>
        </IdleTimeoutProvider>
    )
}