import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import { Logo } from '@/components/ui/logo'
import { OnboardingModulesStep } from '@/components/modules/OnboardingModulesStep'
import { getDefaultModulesForActivity } from '@/lib/config/modules'
import type { ActivityType } from '@/lib/config/activity-labels'

export default async function OnboardingModulesPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const cookieStore = await cookies()
    const restaurantId = cookieStore.get('akom_current_restaurant_id')?.value

    if (!restaurantId) redirect('/onboarding')

    const restaurant = await prisma.restaurant.findUnique({
        where: { id: restaurantId },
        select: { id: true, name: true, activityType: true },
    })

    if (!restaurant) redirect('/onboarding')

    // Si les modules ont déjà été initialisés, sauter cette étape
    const existingModules = await prisma.restaurantModule.count({
        where: { restaurantId },
    })
    if (existingModules > 0) redirect('/onboarding/verification')

    const defaults = getDefaultModulesForActivity(restaurant.activityType as ActivityType)

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 p-4">
            <div className="w-full max-w-2xl">
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center mb-4">
                        <Logo size="lg" variant="color" />
                    </div>
                    <h1 className="text-2xl font-bold text-foreground">
                        Personnalisez votre espace
                    </h1>
                    <p className="text-muted-foreground mt-2 text-sm">
                        Activez uniquement ce dont vous avez besoin. Vous pourrez modifier ça à tout moment.
                    </p>
                </div>

                <OnboardingModulesStep
                    restaurantId={restaurant.id}
                    restaurantName={restaurant.name}
                    activityType={restaurant.activityType as ActivityType}
                    userId={user.id}
                    defaultModules={defaults}
                />
            </div>
        </div>
    )
}
