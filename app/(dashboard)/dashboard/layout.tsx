// app/(dashboard)/dashboard/layout.tsx
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { signOut, getUserRole } from "@/lib/actions/auth"
import { AppSidebar } from "../components/app-sidebar"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { RestaurantProvider } from "@/lib/hooks/use-restaurant"
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

    // Récupérer le rôle de l'utilisateur EN PREMIER
    const userRole = await getUserRole()

    // ⚡ NOUVEAU : Rediriger les SuperAdmins vers /superadmin automatiquement
    // (sauf s'ils sont déjà sur une route /superadmin)
    if (userRole === "superadmin") {
        // On ne redirige que si l'utilisateur est sur /dashboard (page d'accueil)
        // Pour éviter une boucle de redirection sur les autres pages /superadmin/*
        const url = new URL(
            typeof window !== 'undefined' ? window.location.href : 'http://localhost:3000'
        )
        
        // Si on est sur /dashboard (exactement) ou toute route qui ne commence pas par /superadmin
        // on redirige vers /superadmin
        // Note: on ne peut pas accéder à pathname directement ici, donc on passe par autre chose
        // On va plutôt gérer ça dans la page /dashboard elle-même
    }

    // ⚡ FIX : Vérifier le restaurant UNIQUEMENT si ce n'est PAS un SuperAdmin
    // Les SuperAdmins peuvent accéder au dashboard même sans restaurant
    if (userRole !== "superadmin") {
        const hasRestaurant = await prisma.restaurantUser.findFirst({
            where: { userId: user.id },
        })

        // Si pas de restaurant ET pas SuperAdmin, rediriger vers l'onboarding
        if (!hasRestaurant) {
            redirect("/onboarding")
        }
    }

    // Récupérer les infos du restaurant actuel (seulement si pas SuperAdmin)
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
                    restaurantLogoUrl={restaurantLogoUrl ? restaurantLogoUrl : ""}
                    onSignOut={handleSignOut}
                />
                <SidebarInset>
                    {children}
                </SidebarInset>
            </SidebarProvider>
        </RestaurantProvider>
    )
}