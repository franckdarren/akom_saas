// app/(dashboard)/dashboard/users/page.tsx
import {Suspense} from 'react'
import {Separator} from '@/components/ui/separator'
import {SidebarTrigger} from '@/components/ui/sidebar'
import prisma from '@/lib/prisma'
import {redirect} from 'next/navigation'
import {createClient} from '@/lib/supabase/server'
import {
    Breadcrumb,
    BreadcrumbList,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbSeparator,
    BreadcrumbPage,
} from '@/components/ui/breadcrumb'
import {TeamManagementTabs} from '@/components/users/TeamManagementTabs'
import {InvitationsSection} from '@/components/users/InvitationsSection'
import {getLabels} from "@/lib/config/activity-labels"
import {PageHeader} from "@/components/ui/page-header"

export default async function UsersPage() {
    const supabase = await createClient()
    const {data: {user}} = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const restaurantUser = await prisma.restaurantUser.findFirst({
        where: {userId: user.id},
        include: {
            restaurant: {
                select: {activityType: true},
            },
        },
    })

    if (!restaurantUser) redirect('/onboarding')

    // ← Calcul des labels
    const labels = getLabels(restaurantUser.restaurant.activityType)

    return (
        <>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1"/>
                <Separator orientation="vertical" className="mr-2 h-4"/>
                <div className="flex justify-between w-full">
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/dashboard">Configuration</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator/>
                            <BreadcrumbItem>
                                <BreadcrumbPage>Gestion de l&apos;équipe</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header>

            <div className="layout-page">
                <PageHeader
                    title="Gestion de l'équipe"
                    description={`Gérez les membres de votre ${labels.structureName}, leurs rôles et permissions`}
                />

                <Suspense
                    fallback={
                        <div className="flex items-center justify-center p-12">
                            <div className="text-muted-foreground">Chargement...</div>
                        </div>
                    }
                >
                    <TeamManagementTabs>
                        <InvitationsSection/>
                    </TeamManagementTabs>
                </Suspense>
            </div>
        </>
    )
}