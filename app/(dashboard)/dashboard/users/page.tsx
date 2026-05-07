// app/(dashboard)/dashboard/users/page.tsx
import {Suspense} from 'react'
import prisma from '@/lib/prisma'
import {AppInsetHeader} from '@/components/layout/AppInsetHeader'
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
            <AppInsetHeader>
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
            </AppInsetHeader>

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