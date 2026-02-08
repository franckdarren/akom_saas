// app/(dashboard)/dashboard/users/page.tsx
import { Suspense } from 'react'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import prisma from '@/lib/prisma'
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
import { InvitationsSection } from '@/components/users/InvitationsSection'
import { getUserRole } from '@/lib/actions/auth'

export default async function UsersPage() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    const userRole = await getUserRole()

    if (!user) {
        redirect('/login')
    }

    const restaurantUser = await prisma.restaurantUser.findFirst({
        where: { userId: user.id },
    })

    if (!restaurantUser) {
        redirect('/onboarding')
    }

    return (
        <>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <div className="flex justify-between w-full">
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/dashboard">Configuration</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Gestion de l'équipe</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header>

            <div className="flex flex-col gap-6 p-6">
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
                    <TeamManagementTabs>
                        {/* 
                            InvitationsSection est un Server Component.
                            En le passant comme children ici, il sera re-rendu 
                            par Next.js à chaque router.refresh() — données fraîches 
                            sans useEffect ni fetch client-side.
                        */}
                        <InvitationsSection />
                    </TeamManagementTabs>
                </Suspense>
            </div>
        </>
    )
}