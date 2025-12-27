// app/(dashboard)/superadmin/layout.tsx
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { signOut, isSuperAdmin } from "@/lib/actions/auth"
import { AppSidebar } from "../components/app-sidebar"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"

export default async function SuperAdminLayout({
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

    // Vérifier que l'utilisateur est SuperAdmin
    const isSuper = await isSuperAdmin()
    if (!isSuper) {
        redirect("/dashboard")
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
                role="superadmin"
                onSignOut={handleSignOut}
            />
            <SidebarInset>
                {children}
            </SidebarInset>
        </SidebarProvider>
    )
}