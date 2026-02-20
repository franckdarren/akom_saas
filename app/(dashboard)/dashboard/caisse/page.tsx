// app/(dashboard)/caisse/page.tsx
import {redirect} from 'next/navigation'
import {getCurrentUserAndRestaurant} from '@/lib/auth/session'
import prisma from '@/lib/prisma'
import {CaisseShell} from './_components/CaisseShell'
import {SidebarTrigger} from "@/components/ui/sidebar";
import {Separator} from "@/components/ui/separator";
import {
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator
} from "@/components/ui/breadcrumb";

export const metadata = {title: 'Caisse — Akôm'}

// Cette page est un Server Component pur.
// Pas de 'use client', pas de useState, pas de useEffect.
// La gestion de l'authentification se fait côté serveur uniquement.
export default async function CaissePage() {
    // Ta fonction getCurrentUserAndRestaurant retourne { userId, restaurantId }
    // d'après l'erreur TypeScript. On utilise donc ces deux champs.
    const {userId, restaurantId} = await getCurrentUserAndRestaurant()

    // Si l'un des deux est absent, l'utilisateur n'est pas authentifié
    // ou n'appartient à aucun restaurant — on redirige vers le login.
    if (!userId || !restaurantId) {
        redirect('/login')
    }

    // On construit la date du jour normalisée à minuit.
    // Le champ sessionDate est de type DATE dans PostgreSQL (sans heure),
    // donc la comparaison doit se faire avec une date exactement à 00:00:00.
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Recherche de la session du jour pour ce restaurant.
    // On inclut les recettes et dépenses pour que CaisseShell
    // puisse tout afficher sans requête supplémentaire.
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

    // Les 90 dernières sessions pour le calendrier historique.
    // On exclut la session du jour si elle existe déjà — elle est
    // passée séparément dans todaySession pour éviter les doublons.
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

    // Les produits actifs avec leur stock pour les selects
    // dans les formulaires de recette et de dépense.
    const products = await prisma.product.findMany({
        where: {restaurantId, isAvailable: true},
        include: {stock: true},
        orderBy: {name: 'asc'},
    })

    return (
        <>
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
        </>
    )
}