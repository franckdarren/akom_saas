// app/(dashboard)/dashboard/stocks/page.tsx
import {redirect} from 'next/navigation'
import {createClient} from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import {
    Breadcrumb,
    BreadcrumbList,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {StocksList} from './stocks-list'
import {AppInsetHeader} from '@/components/layout/AppInsetHeader'
import {getUserRole} from "@/lib/actions/auth"
import {getLabels} from "@/lib/config/activity-labels" // ← NOUVEAU
import {PageHeader} from "@/components/ui/page-header"

export default async function StocksPage({
    searchParams,
}: {
    searchParams: Promise<{q?: string}>
}) {
    const supabase = await createClient()
    const {data: {user}} = await supabase.auth.getUser()

    const userRole = await getUserRole()

    if (!user) redirect('/login')

    const restaurantUser = await prisma.restaurantUser.findFirst({
        where: {userId: user.id},
        include: {
            restaurant: {
                select: {activityType: true}, // ← NOUVEAU
            },
        },
    })

    if (!restaurantUser) redirect('/onboarding')

    const {q} = await searchParams
    const labels = getLabels(restaurantUser.restaurant.activityType)

    const stocks = await prisma.stock.findMany({
        where: {
            restaurantId: restaurantUser.restaurantId,
            ...(q ? {product: {name: {contains: q, mode: 'insensitive'}}} : {}),
        },
        include: {
            product: {
                select: {
                    id: true,
                    name: true,
                    isAvailable: true,
                    category: {
                        select: {name: true},
                    },
                },
            },
        },
        orderBy: {
            product: {name: 'asc'},
        },
        take: 100,
    })

    return (
        <>
            <AppInsetHeader>
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/dashboard">Opérations</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator/>
                        <BreadcrumbItem>
                            {/* ← Label dynamique */}
                            <BreadcrumbPage>Stocks</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </AppInsetHeader>

            <div className="layout-page">
                <PageHeader
                    title={`Stocks — ${labels.productNameCapital}s`}
                    description={`Ajustez les quantités en stock. Les ${labels.productNamePlural} avec stock > 0 sont automatiquement disponibles.`}
                />

                <StocksList stocks={stocks}/>
            </div>
        </>
    )
}