// app/(dashboard)/dashboard/layout.tsx
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { signOut, getUserRole } from "@/lib/actions/auth"
import { AppSidebar } from "../components/app-sidebar"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { RestaurantProvider } from "@/lib/hooks/use-restaurant" // 🆕 Import
import prisma from "@/lib/prisma"

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()

    // Vérifier l'authentification
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect("/login")
    }

    // Vérifier si l'utilisateur a au moins un restaurant
    const hasRestaurant = await prisma.restaurantUser.findFirst({
        where: { userId: user.id },
    })

    // Si pas de restaurant, rediriger vers l'onboarding
    if (!hasRestaurant) {
        redirect("/onboarding")
    }

    // Récupérer le rôle de l'utilisateur
    const userRole = await getUserRole()


    // Récupérer les infos du restaurant actuel
const restaurantUser = userRole !== "superadmin" 
    ? await prisma.restaurantUser.findFirst({
        where: { userId: user.id },
        include: {
            restaurant: {
                select: { 
                    id: true,
                    name: true,
                    logoUrl: true
                },
            },
        },
    })
    : null

const restaurantName = restaurantUser?.restaurant.name
const restaurantId = restaurantUser?.restaurant.id
const restaurantLogoUrl = restaurantUser?.restaurant.logoUrl

    // Server action pour déconnexion
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
                    restaurantLogoUrl={restaurantLogoUrl}
                    onSignOut={handleSignOut}
                />
                <SidebarInset>
                    {children}
                </SidebarInset>
            </SidebarProvider>
        </RestaurantProvider>
    )
}