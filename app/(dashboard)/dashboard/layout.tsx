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

/**
 * Routes exemptées de la vérification du statut du restaurant
 *
 * Ces routes restent accessibles même si le restaurant n'est pas vérifié,
 * permettant aux utilisateurs de gérer leurs paramètres et abonnements.
 */
const VERIFICATION_EXEMPT_ROUTES = [
    '/dashboard/settings',
    '/dashboard/subscription',
    '/dashboard/support',
]

/**
 * Layout principal du dashboard
 *
 * RESPONSABILITÉS :
 * =================
 * 1. Vérifier l'authentification de l'utilisateur
 * 2. Vérifier le statut de vérification du restaurant
 * 3. Récupérer le plan d'abonnement actuel
 * 4. Configurer la sidebar avec toutes les informations nécessaires
 * 5. Envelopper dans les providers appropriés
 */
export default async function DashboardLayout({
                                                  children,
                                              }: {
    children: React.ReactNode
}) {
    // ============================================================
    // ÉTAPE 1 : Vérification de l'authentification
    // ============================================================

    const supabase = await createClient()

    const {
        data: {user},
    } = await supabase.auth.getUser()

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

    // Variables qui seront utilisées pour la sidebar
    let restaurantName: string | undefined
    let restaurantId: string | undefined
    let restaurantLogoUrl: string | undefined
    let currentPlan: SubscriptionPlan = 'starter' // Valeur par défaut

    if (userRole === "superadmin") {
        // ============================================================
        // CAS SUPERADMIN : Pas de vérification de restaurant
        // ============================================================

        // Les superadmins n'ont pas de restaurant associé
        // Le middleware gère leurs accès spécifiques
        // On laisse les variables undefined et le plan par défaut

    } else {
        // ============================================================
        // CAS UTILISATEURS NORMAUX : Vérifications complètes
        // ============================================================

        // Récupérer le restaurant de l'utilisateur
        const restaurantUser = await prisma.restaurantUser.findFirst({
            where: {userId: user.id},
            include: {
                restaurant: {
                    select: {
                        id: true,
                        name: true,
                        logoUrl: true,
                        verificationStatus: true,
                        isVerified: true,
                    },
                },
            },
        })

        // Si l'utilisateur n'a pas de restaurant, le rediriger vers l'onboarding
        if (!restaurantUser) {
            redirect("/onboarding")
        }

        const restaurant = restaurantUser.restaurant

        // Assigner les valeurs pour la sidebar
        restaurantName = restaurant.name
        restaurantId = restaurant.id
        restaurantLogoUrl = restaurant.logoUrl || undefined

        // ============================================================
        // ÉTAPE 4 : Vérification du statut de vérification
        // ============================================================

        const verificationStatus = restaurant.verificationStatus
        const isVerified = verificationStatus === 'verified'

        if (!isVerified) {
            // Récupérer le pathname actuel pour vérifier si on est sur une route exemptée
            const {headers} = await import('next/headers')
            const headersList = await headers()
            const pathname = headersList.get('x-pathname') || ''

            const isExempt = VERIFICATION_EXEMPT_ROUTES.some(route =>
                pathname.startsWith(route)
            )

            // Si pas sur une route exemptée, rediriger selon le statut
            if (!isExempt) {
                if (verificationStatus === 'suspended') {
                    redirect('/onboarding/suspended')
                } else {
                    redirect('/onboarding/verification')
                }
            }
        }

        // ============================================================
        // ÉTAPE 5 : NOUVEAU - Récupération du plan d'abonnement
        // ============================================================

        try {
            const {subscription} = await getRestaurantSubscription(restaurant.id)

            if (subscription && subscription.plan) {
                // Utiliser le plan de l'abonnement actif
                currentPlan = subscription.plan
            }
            // Sinon, on garde 'starter' comme valeur par défaut

        } catch (error) {
            console.error('Erreur récupération abonnement:', error)
            // En cas d'erreur, on continue avec le plan par défaut 'starter'
            // Cela évite de bloquer l'utilisateur si le système d'abonnement a un problème
        }
    }

    // ============================================================
    // ÉTAPE 6 : Fonction de déconnexion (server action)
    // ============================================================

    async function handleSignOut() {
        "use server"
        await signOut()
    }

    // ============================================================
    // ÉTAPE 7 : Rendu du layout avec tous les providers
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
                        restaurantId={restaurantId}
                        restaurantLogoUrl={restaurantLogoUrl || ""}
                        currentPlan={currentPlan}  // NOUVEAU : Passer le plan d'abonnement
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