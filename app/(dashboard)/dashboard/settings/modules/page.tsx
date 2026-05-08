import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { AppInsetHeader } from '@/components/layout/AppInsetHeader'
import { PageHeader } from '@/components/ui/page-header'
import { ModulesManager } from '@/components/modules/ModulesManager'
import { getActiveModules, hydrateDefaultModules } from '@/lib/actions/modules'
import type { ModuleKey } from '@/lib/config/modules'
import type { ActivityType } from '@/lib/config/activity-labels'
import type { SubscriptionPlan } from '@/lib/config/subscription'

export default async function ModulesPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const cookieStore = await cookies()
    const restaurantId = cookieStore.get('akom_current_restaurant_id')?.value

    const restaurantUser = await prisma.restaurantUser.findFirst({
        where: restaurantId
            ? { userId: user.id, restaurantId }
            : { userId: user.id },
        include: {
            restaurant: {
                select: {
                    id: true,
                    activityType: true,
                    subscription: { select: { plan: true } },
                },
            },
            customRole: { select: { slug: true } },
        },
    })

    if (!restaurantUser) redirect('/onboarding')
    if (restaurantUser.customRole?.slug !== 'admin') redirect('/dashboard')

    const restaurant = restaurantUser.restaurant
    const currentPlan = (restaurant.subscription?.plan ?? 'starter') as SubscriptionPlan

    let activeModules = await getActiveModules(restaurant.id)
    if (activeModules === null) {
        activeModules = await hydrateDefaultModules(
            restaurant.id,
            restaurant.activityType as ActivityType,
            user.id,
        )
    }

    return (
        <>
            <AppInsetHeader>
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/dashboard">Tableau de bord</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>Modules</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </AppInsetHeader>

            <div className="layout-page">
                <PageHeader
                    title="Modules de votre espace"
                    description="Activez uniquement les modules dont vous avez besoin. Votre sidebar s'adapte en temps réel."
                />
                <ModulesManager
                    restaurantId={restaurant.id}
                    activityType={restaurant.activityType as ActivityType}
                    currentPlan={currentPlan}
                    initialActiveModules={activeModules as ModuleKey[]}
                />
            </div>
        </>
    )
}
