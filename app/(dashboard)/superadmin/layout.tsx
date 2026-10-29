// app/(dashboard)/superadmin/layout.tsx

import {ReactNode} from "react"
import {redirect} from "next/navigation"
import {createClient} from "@/lib/supabase/server"
import {signOut, getUserRole} from "@/lib/actions/auth"
import {AppSidebar} from "../components/app-sidebar"
import {SidebarProvider, SidebarInset} from "@/components/ui/sidebar"
import {RestaurantProvider} from "@/lib/hooks/use-restaurant"
import {DashboardProvider} from "@/components/providers/dashboard-provider"

export default async function SuperAdminLayout({
                                                   children,
                                               }: {
    children: ReactNode
}) {
    const supabase = await createClient()

    // ============================================================
    // 1️⃣ Vérification authentification
    // ============================================================

    const {
        data: {user},
    } = await supabase.auth.getUser()

    if (!user) {
        redirect("/login")
    }

    // ============================================================
    // 2️⃣ Vérification rôle
    // ============================================================

    const userRole = await getUserRole()

    if (userRole !== "superadmin") {
        redirect("/dashboard")
    }

    // ============================================================
    // 3️⃣ Server action déconnexion
    // ============================================================

    async function handleSignOut() {
        "use server"
        await signOut()
    }

    // ============================================================
    // 4️⃣ Render
    // ============================================================

    return (
        <DashboardProvider value={{user: {id: user.id, email: user.email || ""}, role: userRole}}>
            <RestaurantProvider>
                <SidebarProvider>
                    <AppSidebar
                        role={userRole}
                        restaurantName="Akôm"
                        restaurantId={undefined}
                        restaurantLogoUrl=""
                        onSignOut={handleSignOut}
                    />
                    <SidebarInset>{children}</SidebarInset>
                </SidebarProvider>
            </RestaurantProvider>
        </DashboardProvider>
    )
}