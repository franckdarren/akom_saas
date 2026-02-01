// app/(dashboard)/dashboard/users/page.tsx
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
    Breadcrumb,
    BreadcrumbList,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbSeparator,
    BreadcrumbPage,
} from '@/components/ui/breadcrumb'
import { TeamManagementTabs } from '@/components/users/TeamManagementTabs'

export default async function UsersPage() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            {/* Breadcrumb */}
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/dashboard">Tableau de bord</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>Gestion de l'équipe</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    Gestion de l'équipe
                </h1>
                <p className="text-muted-foreground mt-2">
                    Gérez les membres de votre équipe, leurs rôles et permissions
                </p>
            </div>

            {/* Tabs avec contenu */}
            <Suspense
                fallback={
                    <div className="flex items-center justify-center p-12">
                        <div className="text-muted-foreground">Chargement...</div>
                    </div>
                }
            >
                <TeamManagementTabs />
            </Suspense>
        </div>
    )
}