// app/(dashboard)/dashboard/layout.tsx
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { signOut, getUserRole } from "@/lib/actions/auth"
import { AppSidebar } from "../components/app-sidebar"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
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

    // Récupérer le nom du restaurant actuel (si admin/kitchen)
    let restaurantName: string | undefined
    if (userRole !== "superadmin") {
        const restaurantUser = await prisma.restaurantUser.findFirst({
            where: { userId: user.id },
            include: {
                restaurant: {
                    select: { name: true },
                },
            },
        })
        restaurantName = restaurantUser?.restaurant.name
    }

    // Server action pour déconnexion
    async function handleSignOut() {
        "use server"
        await signOut()
    }

    return (
        <SidebarProvider>
            <AppSidebar
                user={{
                    email: user.email || "",
                    id: user.id,
                }}
                role={userRole}
                restaurantName={restaurantName}
                onSignOut={handleSignOut}
            />
            <SidebarInset>
                {children}
            </SidebarInset>
        </SidebarProvider>
    )
}