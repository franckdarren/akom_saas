// app/dashboard/restaurants/[id]/settings/page.tsx
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { RestaurantSettingsForm } from './restaurant-settings-form'
import { VerificationDocumentsForm } from '@/components/restaurant/verification-documents-form'
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
import { CircuitSheetForm } from '@/components/restaurant/circuit-sheet-form'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle } from 'lucide-react'

export default async function RestaurantSettingsPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Récupérer le restaurant avec toutes les informations de vérification
    const restaurant = await prisma.restaurant.findUnique({
        where: { id },
        include: {
            verificationDocuments: true,
            circuitSheet: true,
            subscription: {
                select: { plan: true },
            },
        },
    })

    if (!restaurant) {
        notFound()
    }

    // Vérifier que l'utilisateur a accès à ce restaurant
    const userRole = await prisma.restaurantUser.findUnique({
        where: {
            userId_restaurantId: {
                userId: user.id,
                restaurantId: id,
            },
        },
    })

    if (!userRole || userRole.role !== 'admin') {
        redirect('/dashboard')
    }

    const needsVerification = !restaurant.isVerified
    const needsCircuitSheet = restaurant.circuitSheet &&
        !restaurant.circuitSheet.isSubmitted &&
        (restaurant.subscription?.plan === 'business' ||
            restaurant.subscription?.plan === 'premium')

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
            <div>
                <h1 className="text-3xl font-bold">Paramètres du restaurant</h1>
                <p className="text-muted-foreground mt-2">
                    Gérez les informations et les documents de votre restaurant
                </p>
            </div>

            {/* Alerte si compte non vérifié */}
            {needsVerification && (
                <Alert variant="destructive">
                <div className="flex items-start space-x-2">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        <strong>Compte non vérifié :</strong> Votre menu n'est pas encore accessible
                        aux clients. Veuillez soumettre vos documents de vérification ci-dessous.
                    </AlertDescription>
                    </div>
                </Alert>
            )}

            {/* Section 1 : Vérification des documents (si nécessaire) */}
            {needsVerification && (
                <>
                    <VerificationDocumentsForm
                        restaurantId={restaurant.id}
                        verificationDocument={restaurant.verificationDocuments}
                    />
                    <Separator className="my-8" />
                </>
            )}

            {/* Section 2 : Fiche circuit (si Business et non soumise) */}
            {needsCircuitSheet && (
                <>
                    <CircuitSheetForm
                        restaurantId={restaurant.id}
                        circuitSheet={restaurant.circuitSheet}
                        plan={restaurant.subscription?.plan || 'starter'}
                    />
                    <Separator className="my-8" />
                </>
            )}

            {/* Section 3 : Paramètres classiques du restaurant */}
            <RestaurantSettingsForm restaurant={restaurant} />
        </div>
        </>
    )
}