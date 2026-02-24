// app/(dashboard)/superadmin/layout.tsx

import {ReactNode} from "react"
import {redirect} from "next/navigation"
import {createClient} from "@/lib/supabase/server"
import {signOut, getUserRole} from "@/lib/actions/auth"
import {AppSidebar} from "../components/app-sidebar"
import {SidebarProvider, SidebarInset} from "@/components/ui/sidebar"
import {RestaurantProvider} from "@/lib/hooks/use-restaurant"

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
        <RestaurantProvider>
            <SidebarProvider>
                <AppSidebar
                    user={{
                        email: user.email || "",
                        id: user.id,
                    }}
                    role={userRole}
                    restaurantName="Akôm"
                    restaurantId={undefined}
                    restaurantLogoUrl=""
                    onSignOut={handleSignOut}
                />
                <SidebarInset>{children}</SidebarInset>
            </SidebarProvider>
        </RestaurantProvider>
    )
}