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
import {PaginationControls} from "@/components/ui/pagination-controls"
import {computeStockValuation} from "@/lib/stock/costing"

const PAGE_SIZE = 50

export default async function StocksPage({
    searchParams,
}: {
    searchParams: Promise<{q?: string; page?: string}>
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

    const {q, page: pageParam} = await searchParams
    const page = Math.max(1, Number(pageParam) || 1)
    const labels = getLabels(restaurantUser.restaurant.activityType)

    const stocksWhere = {
        restaurantId: restaurantUser.restaurantId,
        ...(q ? {product: {name: {contains: q, mode: 'insensitive' as const}}} : {}),
    }

    const [stocks, totalStocks, valuationRows] = await Promise.all([
        prisma.stock.findMany({
            where: stocksWhere,
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        isAvailable: true,
                        price: true,
                        purchasePrice: true,
                        category: {
                            select: {name: true},
                        },
                    },
                },
            },
            orderBy: {
                product: {name: 'asc'},
            },
            skip: (page - 1) * PAGE_SIZE,
            take: PAGE_SIZE,
        }),
        prisma.stock.count({where: stocksWhere}),
        // Les KPI portent sur la totalite du stock, pas sur la page affichee :
        // une valeur immobilisee calculee sur 50 lignes n'aurait aucun sens.
        prisma.stock.findMany({
            where: stocksWhere,
            select: {
                quantity: true,
                avgCost: true,
                product: {select: {price: true}},
            },
        }),
    ])

    const totalPages = Math.max(1, Math.ceil(totalStocks / PAGE_SIZE))

    const valuation = computeStockValuation(
        valuationRows.map((row) => ({
            quantity: row.quantity,
            avgCost: row.avgCost,
            sellingPrice: row.product.price,
        }))
    )

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

                <StocksList stocks={stocks} valuation={valuation}/>

                <PaginationControls
                    page={page}
                    totalPages={totalPages}
                    basePath="/dashboard/stocks"
                    searchParams={{q}}
                />
            </div>
        </>
    )
}