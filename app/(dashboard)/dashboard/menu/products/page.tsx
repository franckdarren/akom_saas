// app/(dashboard)/dashboard/menu/products/page.tsx
import {redirect} from "next/navigation"
import Link from "next/link"
import {createClient} from "@/lib/supabase/server"
import prisma from "@/lib/prisma"
import {
    Breadcrumb,
    BreadcrumbList,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbSeparator,
    BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import {Button} from "@/components/ui/button"
import {AppInsetHeader} from "@/components/layout/AppInsetHeader"
import {Badge} from "@/components/ui/badge"
import {AppCard, CardContent} from "@/components/ui/app-card"
import {Plus} from "lucide-react"
import {ProductsList} from "./products-list"
import {getUserRole} from "@/lib/actions/auth"
import {QuotaGuard} from "@/components/subscription/QuotaGuard"
import {getQuotaStatus} from "@/lib/services/subscription-checker"
import {getLabels} from "@/lib/config/activity-labels" // ← NOUVEAU
import {PageHeader} from "@/components/ui/page-header"
import {PaginationControls} from "@/components/ui/pagination-controls"

const PAGE_SIZE = 50

export default async function ProductsPage({
    searchParams,
}: {
    searchParams: Promise<{q?: string; page?: string}>
}) {
    const supabase = await createClient()
    const {data: {user}} = await supabase.auth.getUser()

    if (!user) redirect("/login")

    await getUserRole()

    const restaurantUser = await prisma.restaurantUser.findFirst({
        where: {userId: user.id},
        include: {
            restaurant: {
                select: {activityType: true}, // ← NOUVEAU
            },
        },
    })

    if (!restaurantUser) redirect("/onboarding")

    const restaurantId = restaurantUser.restaurantId

    // ← Calcul des labels
    const labels = getLabels(restaurantUser.restaurant.activityType)

    const {q, page: pageParam} = await searchParams
    const page = Math.max(1, Number(pageParam) || 1)
    const productsWhere = {
        restaurantId,
        ...(q ? {name: {contains: q, mode: 'insensitive' as const}} : {}),
    }

    // Indépendants → en parallèle
    const [productsQuota, products, totalProducts, categories] = await Promise.all([
        getQuotaStatus(restaurantId, "max_products"),
        prisma.product.findMany({
            where: productsWhere,
            include: {
                category: {select: {name: true}},
                family: {select: {name: true}},
                stock: {select: {quantity: true}},
            },
            orderBy: {createdAt: "desc"},
            skip: (page - 1) * PAGE_SIZE,
            take: PAGE_SIZE,
        }),
        prisma.product.count({where: productsWhere}),
        prisma.category.findMany({
            where: {restaurantId, isActive: true},
            orderBy: {position: "asc"},
        }),
    ])

    const totalPages = Math.max(1, Math.ceil(totalProducts / PAGE_SIZE))

    return (
        <>
            <AppInsetHeader>
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            {/* ← Label dynamique */}
                            <BreadcrumbLink href="/dashboard">{labels.catalogNameCapital}</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator/>
                        <BreadcrumbItem>
                            <BreadcrumbPage>{labels.productNameCapital}s</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </AppInsetHeader>

            <div className="layout-page">
                <PageHeader
                    title={`${labels.productNameCapital}s`}
                    description={`Gérez tous vos ${labels.productNamePlural}`}
                    titleBadge={
                        <Badge
                            variant={
                                productsQuota.isAtLimit ? "destructive"
                                    : productsQuota.isNearLimit ? "secondary"
                                        : "outline"
                            }
                        >
                            {productsQuota.used}/
                            {productsQuota.limit === "unlimited" ? "∞" : productsQuota.limit}
                        </Badge>
                    }
                    action={
                        <QuotaGuard
                            status={productsQuota}
                            quotaName={labels.productNamePlural}
                            disableWhenAtLimit={true}
                            showProgress={false}
                        >
                            <Link href="/dashboard/menu/products/new">
                                <Button>
                                    <Plus className="mr-2 h-4 w-4"/>
                                    {labels.newProductLabel}
                                </Button>
                            </Link>
                        </QuotaGuard>
                    }
                />

                {productsQuota.limit !== "unlimited" && (
                    <AppCard>
                        <CardContent className="layout-card-body">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold">
                                        Utilisation des {labels.productNamePlural}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        {productsQuota.used} sur {productsQuota.limit}{" "}
                                        {labels.productNamePlural} utilisés
                                    </p>
                                </div>
                                <Badge
                                    variant={
                                        productsQuota.isAtLimit ? "destructive"
                                            : productsQuota.isNearLimit ? "secondary"
                                                : "outline"
                                    }
                                >
                                    {Math.round(productsQuota.percentage)}%
                                </Badge>
                            </div>

                            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-500 ${
                                        productsQuota.isAtLimit ? "bg-destructive"
                                            : productsQuota.isNearLimit ? "bg-warning"
                                                : "bg-primary"
                                    }`}
                                    style={{width: `${productsQuota.percentage}%`}}
                                />
                            </div>

                            {productsQuota.isAtLimit && (
                                <div className="pt-2">
                                    <Button asChild size="sm">
                                        <Link href="/dashboard/subscription/choose-plan">
                                            Passer à un plan supérieur
                                        </Link>
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </AppCard>
                )}

                <ProductsList products={products}/>

                <PaginationControls
                    page={page}
                    totalPages={totalPages}
                    basePath="/dashboard/menu/products"
                    searchParams={{q}}
                />
            </div>
        </>
    )
}