// app/dashboard/restaurants/[id]/settings/page.tsx
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getRestaurantDetails } from '@/lib/actions/restaurant'
import { RestaurantSettingsForm } from './restaurant-settings-form'
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Plus } from 'lucide-react'
import { getUserRole } from "@/lib/actions/auth"
import { createClient } from '@/lib/supabase/server'


export default async function RestaurantSettingsPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    const userRole = await getUserRole()

    if (!user) {
        redirect('/login')
    }

    // Récupérer les détails du restaurant
    const result = await getRestaurantDetails(id)

    if (result.error) {
        if (result.error === 'Non authentifié') {
            redirect('/login')
        }
        notFound()
    }

    // Vérification explicite pour TypeScript
    if (!result.success || !result.restaurant) {
        notFound()
    }

    const restaurant = result.restaurant

    return (
        <>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                        <SidebarTrigger className="-ml-1" />
                        <Separator orientation="vertical" className="mr-2 h-4" />
                        <div className="flex justify-between w-full">
                            <div className='my-auto'>
                                <BreadcrumbList>
                                    <BreadcrumbItem>
                                        <BreadcrumbLink href="/dashboard">Configuration</BreadcrumbLink>
                                    </BreadcrumbItem>
                                    <BreadcrumbSeparator />
                                    <BreadcrumbItem>
                                        <BreadcrumbPage>Paramètres</BreadcrumbPage>
                                    </BreadcrumbItem>
                                </BreadcrumbList>
                            </div>
                        </div>
                    </header>
            <div className="flex flex-1 flex-col gap-4 p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Paramètres du restaurant
                        </h1>
                        <p className="text-muted-foreground mt-2">
                            Gérez les informations et l'apparence de votre restaurant
                        </p>
                    </div>
                </div>

                {/* Formulaire */}
                <RestaurantSettingsForm restaurant={restaurant} />
            </div>
        </>
    )
}