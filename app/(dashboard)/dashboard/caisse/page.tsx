// app/(dashboard)/dashboard/caisse/page.tsx
import {redirect} from 'next/navigation'
import {getCurrentUserAndRestaurant} from '@/lib/auth/session'
import prisma from '@/lib/prisma'
import {CaisseShell} from './_components/CaisseShell'
import {FeatureGuard} from '@/components/guards/FeatureGuard'
import {SidebarTrigger} from "@/components/ui/sidebar"
import {Separator} from "@/components/ui/separator"
import {
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator
} from "@/components/ui/breadcrumb"

export const metadata = {title: 'Caisse — Akôm'}

export default async function CaissePage() {
    // Récupérer les informations de l'utilisateur et du restaurant
    const {userId, restaurantId} = await getCurrentUserAndRestaurant()

    // Si l'un des deux est absent, rediriger vers le login
    if (!userId || !restaurantId) {
        redirect('/login')
    }

    // Construire la date du jour normalisée à minuit
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Recherche de la session du jour pour ce restaurant
    const todaySession = await prisma.cashSession.findFirst({
        where: {
            restaurantId,
            sessionDate: today,
        },
        include: {
            manualRevenues: {
                orderBy: {createdAt: 'desc'},
                include: {product: {select: {name: true}}},
            },
            expenses: {
                orderBy: {createdAt: 'desc'},
                include: {product: {select: {name: true}}},
            },
        },
    })

    // Les 90 dernières sessions pour le calendrier historique
    const recentSessions = await prisma.cashSession.findMany({
        where: {
            restaurantId,
            ...(todaySession ? {NOT: {id: todaySession.id}} : {}),
        },
        orderBy: {sessionDate: 'desc'},
        take: 90,
        select: {
            id: true,
            sessionDate: true,
            status: true,
            isHistorical: true,
            openingBalance: true,
            closingBalance: true,
            theoreticalBalance: true,
            balanceDifference: true,
        },
    })

    // Les produits actifs avec leur stock
    const products = await prisma.product.findMany({
        where: {restaurantId, isAvailable: true},
        include: {stock: true},
        orderBy: {name: 'asc'},
    })

    // ============================================================
    // PROTECTION : Vérifier que l'utilisateur a accès au module caisse
    // ============================================================

    return (
        <FeatureGuard
            restaurantId={restaurantId}
            requiredFeature="caisse_module"
            showError={true}
        >
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1"/>
                <Separator orientation="vertical" className="mr-2 h-4"/>
                <div className="flex justify-between w-full">
                    <div className='my-auto'>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/dashboard">Opérations</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator/>
                            <BreadcrumbItem>
                                <BreadcrumbPage>Caisse</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </div>
                </div>
            </header>

            <div className="flex flex-1 flex-col gap-4 p-4">
                <CaisseShell
                    todaySession={todaySession}
                    recentSessions={recentSessions}
                    products={products}
                    restaurantId={restaurantId}
                />
            </div>
        </FeatureGuard>
    )
}