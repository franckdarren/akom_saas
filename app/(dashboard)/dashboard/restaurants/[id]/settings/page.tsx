// app/dashboard/restaurants/[id]/settings/page.tsx
import {redirect, notFound} from 'next/navigation'
import {createClient} from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import {RestaurantSettingsForm} from './restaurant-settings-form'
import {VerificationDocumentsForm} from '@/components/restaurant/verification-documents-form'
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {Separator} from '@/components/ui/separator'
import {SidebarTrigger} from '@/components/ui/sidebar'
import {CircuitSheetForm} from '@/components/restaurant/circuit-sheet-form'
import {Alert, AlertDescription} from '@/components/ui/alert'
import {AlertTriangle} from 'lucide-react'
import {getLabels} from '@/lib/config/activity-labels'
import {DeleteRestaurantDialog} from '@/components/dashboard/DeleteRestaurantDialog'

export default async function RestaurantSettingsPage({
                                                         params,
                                                     }: {
    params: Promise<{ id: string }>
}) {
    const {id} = await params
    const supabase = await createClient()
    const {data: {user}} = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const restaurant = await prisma.restaurant.findUnique({
        where: {id},
        include: {
            verificationDocuments: true,
            circuitSheet: true,
            subscription: {
                select: {plan: true},
            },
        },
    })

    if (!restaurant) notFound()

    const userRole = await prisma.restaurantUser.findUnique({
        where: {
            userId_restaurantId: {
                userId: user.id,
                restaurantId: id,
            },
        },
    })

    if (!userRole || userRole.role !== 'admin') redirect('/dashboard')

    const labels = getLabels(restaurant.activityType)

    const needsVerification = !restaurant.isVerified
    const needsCircuitSheet =
        restaurant.circuitSheet &&
        !restaurant.circuitSheet.isSubmitted &&
        (restaurant.subscription?.plan === 'business' ||
            restaurant.subscription?.plan === 'premium')

    // Déterminer si c'est le restaurant principal (le plus ancien de l'user)
    // Le restaurant principal ne peut pas être supprimé
    const firstRestaurantUser = await prisma.restaurantUser.findFirst({
        where: {userId: user.id, role: 'admin'},
        orderBy: {createdAt: 'asc'},
        select: {restaurantId: true},
    })
    const isFirstRestaurant = firstRestaurantUser?.restaurantId === id

    return (
        <>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1"/>
                <Separator orientation="vertical" className="mr-2 h-4"/>
                <div className="flex justify-between w-full">
                    <div className="my-auto">
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbLink href="/dashboard">Configuration</BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator/>
                                <BreadcrumbItem>
                                    <BreadcrumbPage>{labels.settingsTitle}</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </div>
            </header>

            <div className="flex flex-1 flex-col gap-4 p-4">
                <div>
                    <h1 className="text-3xl font-bold">{labels.settingsTitle}</h1>
                    <p className="text-muted-foreground mt-2">
                        Gérez les informations et les documents de votre {labels.structureName}
                    </p>
                </div>

                {/* Alerte vérification */}
                {needsVerification && (
                    <Alert variant="destructive">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4"/>
                            <AlertDescription>
                                <strong>Compte non vérifié :</strong> Votre {labels.catalogName} n&apos;est
                                pas encore accessible aux {labels.customerNameCapital}s. Veuillez soumettre
                                vos documents de vérification ci-dessous.
                            </AlertDescription>
                        </div>
                    </Alert>
                )}

                {/* Formulaire de vérification */}
                {needsVerification && (
                    <VerificationDocumentsForm
                        restaurantId={restaurant.id}
                        verificationDocument={restaurant.verificationDocuments}
                    />
                )}

                {/* Fiche circuit */}
                {needsCircuitSheet && (
                    <CircuitSheetForm
                        restaurantId={restaurant.id}
                        circuitSheet={restaurant.circuitSheet}
                        plan={restaurant.subscription?.plan || 'starter'}
                    />
                )}

                {/* Formulaire paramètres */}
                <RestaurantSettingsForm restaurant={restaurant} labels={labels}/>

                {/* ── Zone de danger (structures secondaires uniquement) ── */}
                {!isFirstRestaurant && (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-5 space-y-3">
                        <div>
                            <p className="text-sm font-semibold text-destructive">
                                Zone de danger
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                La suppression de cette structure est définitive et irréversible.
                                Toutes les données associées seront perdues.
                            </p>
                        </div>
                        {/* Client Component pour le dialog */}
                        <DeleteRestaurantDialog
                            restaurantId={restaurant.id}
                            restaurantName={restaurant.name}
                        />
                    </div>
                )}
            </div>
        </>
    )
}