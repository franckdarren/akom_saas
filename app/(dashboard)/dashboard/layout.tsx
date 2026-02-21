// app/(dashboard)/dashboard/layout.tsx
import {redirect} from "next/navigation"
import {createClient} from "@/lib/supabase/server"
import {signOut, getUserRole} from "@/lib/actions/auth"
import {AppSidebar} from "../components/app-sidebar"
import {SidebarProvider, SidebarInset} from "@/components/ui/sidebar"
import {RestaurantProvider} from "@/lib/hooks/use-restaurant"
import prisma from "@/lib/prisma"
import {FloatingSupportButton} from "@/components/support/FloatingSupportButton"
// On importe simplement notre nouveau provider client
import {IdleTimeoutProvider} from "@/providers/IdleTimeoutProvider"

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

    const {
        data: {user},
    } = await supabase.auth.getUser()

    if (!user) {
        redirect("/login")
    }

    const userRole = await getUserRole()

    if (userRole === "superadmin") {
        // SuperAdmin passe directement, le middleware gère la suite
    } else {
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
    }

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
        // IdleTimeoutProvider englobe tout le layout dashboard.
        // Il reçoit le rôle depuis le serveur et décide lui-même
        // d'activer ou non le timer selon le rôle (admin, manager).
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
                        restaurantLogoUrl={restaurantLogoUrl ? restaurantLogoUrl : ""}
                        onSignOut={handleSignOut}
                    />
                    <SidebarInset>
                        {/*
                            children est passé à l'intérieur du provider,
                            ce qui signifie que toutes les pages du dashboard
                            sont automatiquement protégées par le timer d'inactivité.
                        */}
                        {children}
                    </SidebarInset>
                    <FloatingSupportButton/>
                </SidebarProvider>
            </RestaurantProvider>
        </IdleTimeoutProvider>
    )
}