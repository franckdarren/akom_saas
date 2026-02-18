// app/(dashboard)/dashboard/layout.tsx
import {redirect} from "next/navigation"
import {createClient} from "@/lib/supabase/server"
import {signOut, getUserRole} from "@/lib/actions/auth"
import {AppSidebar} from "../components/app-sidebar"
import {SidebarProvider, SidebarInset} from "@/components/ui/sidebar"
import {RestaurantProvider} from "@/lib/hooks/use-restaurant"
import prisma from "@/lib/prisma"
import {FloatingSupportButton} from "@/components/support/FloatingSupportButton"

// Routes du dashboard accessibles même sans vérification complète
// (ex: settings pour soumettre les documents, subscription, support)
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
    const supabase = await createClient()

    // Vérifier l'authentification
    const {
        data: {user},
    } = await supabase.auth.getUser()

    if (!user) {
        redirect("/login")
    }

    // Récupérer le rôle de l'utilisateur
    const userRole = await getUserRole()

    // Les SuperAdmins passent directement
    if (userRole === "superadmin") {
        // On laisse passer, le middleware gère la redirection vers /superadmin
    } else {
        // Vérifier que l'utilisateur a bien un restaurant
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

        if (!restaurantUser) {
            redirect("/onboarding")
        }

        const restaurant = restaurantUser!.restaurant
        const verificationStatus = restaurant.verificationStatus

        // ============================================================
        // VÉRIFICATION DU STATUT DE VÉRIFICATION
        // Un restaurant non vérifié ne peut pas accéder au dashboard complet
        // Statuts bloquants : pending_documents, documents_submitted, documents_rejected, suspended
        // Seul "verified" donne accès complet
        // ============================================================

        const isVerified = verificationStatus === 'verified'

        if (!isVerified) {
            // Récupérer le pathname depuis les headers (disponible côté server)
            const {headers} = await import('next/headers')
            const headersList = await headers()
            const pathname = headersList.get('x-pathname') || ''

            const isExempt = VERIFICATION_EXEMPT_ROUTES.some(route =>
                pathname.startsWith(route)
            )

            if (!isExempt) {
                // Rediriger selon le statut
                if (verificationStatus === 'suspended') {
                    redirect('/onboarding/suspended')
                } else {
                    redirect('/onboarding/verification')
                }
            }
        }
    }

    // Récupérer les infos du restaurant (seulement si pas SuperAdmin)
    const restaurantUser = userRole !== "superadmin"
        ? await prisma.restaurantUser.findFirst({
            where: {userId: user.id},
            include: {
                restaurant: {
                    select: {
                        id: true,
                        name: true,
                        logoUrl: true,
                    },
                },
            },
        })
        : null

    const restaurantName = restaurantUser?.restaurant.name
    const restaurantId = restaurantUser?.restaurant.id
    const restaurantLogoUrl = restaurantUser?.restaurant.logoUrl

    async function handleSignOut() {
        "use server"
        await signOut()
    }

    return (
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
                    restaurantLogoUrl={restaurantLogoUrl ? restaurantLogoUrl : ""}
                    onSignOut={handleSignOut}
                />
                <SidebarInset>
                    {children}
                </SidebarInset>
                <FloatingSupportButton/>
            </SidebarProvider>
        </RestaurantProvider>
    )
}