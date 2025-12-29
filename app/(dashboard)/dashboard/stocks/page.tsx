// app/(dashboard)/dashboard/stocks/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import {
    Breadcrumb,
    BreadcrumbList,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { StocksList } from './stocks-list'

export default async function StocksPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const restaurantUser = await prisma.restaurantUser.findFirst({
        where: { userId: user.id },
    })

    if (!restaurantUser) {
        redirect('/onboarding')
    }

    // Récupérer tous les stocks avec les infos produits
    const stocks = await prisma.stock.findMany({
        where: { restaurantId: restaurantUser.restaurantId },
        include: {
            product: {
                select: {
                    id: true,
                    name: true,
                    isAvailable: true,
                    category: {
                        select: { name: true },
                    },
                },
            },
        },
        orderBy: {
            product: {
                name: 'asc',
            },
        },
    })

    return (
        <>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/dashboard">Tableau de bord</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>Stocks</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </header>

            <div className="flex flex-1 flex-col gap-4 p-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Gestion des stocks</h1>
                    <p className="text-muted-foreground mt-2">
                        Ajustez les quantités en stock. Les produits avec stock &gt; 0 sont automatiquement disponibles.
                    </p>
                </div>

                <StocksList stocks={stocks} />
            </div>
        </>
    )
}