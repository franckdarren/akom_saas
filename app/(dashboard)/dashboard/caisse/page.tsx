// app/(dashboard)/dashboard/caisse/page.tsx
import {redirect} from 'next/navigation'
import {getCurrentUserAndRestaurant} from '@/lib/auth/session'
import prisma from '@/lib/prisma'
import {CaisseShell} from './_components/CaisseShell'
import {FeatureGuard} from '@/components/guards/FeatureGuard'
import {
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator
} from "@/components/ui/breadcrumb"
import {AppInsetHeader} from "@/components/layout/AppInsetHeader"

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

    // Recherche de la session du jour (doit précéder recentSessions qui l'exclut)
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

    // Les 90 dernières sessions et les produits sont indépendants → parallèle
    const [recentSessions, products] = await Promise.all([
        prisma.cashSession.findMany({
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
        }),
        prisma.product.findMany({
            where: {restaurantId, isAvailable: true},
            include: {stock: true},
            orderBy: {name: 'asc'},
            // Garde-fou : la recherche produit du POS est côté client, donc pas de
            // pagination possible sans revoir l'UX de recherche ; ce plafond évite
            // de charger un catalogue sans limite sur les gros comptes.
            take: 500,
        }),
    ])

    // ============================================================
    // PROTECTION : Vérifier que l'utilisateur a accès au module caisse
    // ============================================================

    return (
        <FeatureGuard
            restaurantId={restaurantId}
            requiredFeature="caisse_module"
            showError={true}
        >
            <AppInsetHeader>
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
            </AppInsetHeader>

            <div className="layout-page">
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