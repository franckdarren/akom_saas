// app/(dashboard)/dashboard/restaurants/[id]/verify/page.tsx
import {redirect, notFound} from 'next/navigation'
import {createClient} from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import {
    Breadcrumb, BreadcrumbItem, BreadcrumbLink,
    BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {Separator} from '@/components/ui/separator'
import {SidebarTrigger} from '@/components/ui/sidebar'
import {VerificationDocumentsForm} from '@/components/restaurant/verification-documents-form'

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function RestaurantVerifyPage({params}: PageProps) {
    const {id: restaurantId} = await params

    const supabase = await createClient()
    const {data: {user}} = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Vérifier que l'user est admin de ce restaurant
    const restaurantUser = await prisma.restaurantUser.findUnique({
        where: {
            userId_restaurantId: {userId: user.id, restaurantId},
        },
        include: {
            restaurant: {
                select: {
                    id: true,
                    name: true,
                    verificationStatus: true,
                    // Charger le document de vérification existant
                    verificationDocuments: true,
                },
            },
        },
    })

    if (!restaurantUser || restaurantUser.role !== 'admin') notFound()

    const restaurant = restaurantUser.restaurant

    // Déjà vérifié → rediriger vers les settings
    if (restaurant.verificationStatus === 'verified') {
        redirect(`/dashboard/restaurants/${restaurantId}/settings`)
    }

    // Le document de vérification existant (null si premier passage)
    const verificationDocument = restaurant.verificationDocuments ?? null

    return (
        <div className="flex flex-col min-h-screen">
            {/* Header */}
            <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1"/>
                <Separator orientation="vertical" className="mr-2 h-4"/>
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator/>
                        <BreadcrumbItem>
                            <BreadcrumbLink href={`/dashboard/restaurants/${restaurantId}/settings`}>
                                {restaurant.name}
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator/>
                        <BreadcrumbItem>
                            <BreadcrumbPage>Vérification</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </header>

            {/* Contenu */}
            <main className="flex-1 p-6 max-w-4xl mx-auto w-full space-y-6">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold tracking-tight">
                        Vérification de {restaurant.name}
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Soumettez vos documents pour activer cette structure.
                        Chaque établissement est vérifié indépendamment.
                    </p>
                </div>

                {/* ✅ Props exactes attendues par le composant */}
                <VerificationDocumentsForm
                    restaurantId={restaurantId}
                    verificationDocument={verificationDocument}
                />
            </main>
        </div>
    )
}