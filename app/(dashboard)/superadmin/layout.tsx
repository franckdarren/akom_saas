import { ReactNode } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { SignOutButton } from '@/components/auth/SignOutButton'
import {
    LayoutDashboard,
    Building2,
    Users,
    BarChart3,
    ArrowLeft,
    MessageSquare,
    FileText,
} from 'lucide-react'
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { signOut, getUserRole } from "@/lib/actions/auth"
import { AppSidebar } from "../components/app-sidebar"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { RestaurantProvider } from "@/lib/hooks/use-restaurant"
import prisma from "@/lib/prisma"

export default async function SuperAdminLayout({ children }: { children: ReactNode }) {

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
                    restaurantName='Akôm Superadmin'
                    onSignOut={handleSignOut}
                />
                <SidebarInset>
                    {children}
                </SidebarInset>
            </SidebarProvider>
        </RestaurantProvider>
    )
}