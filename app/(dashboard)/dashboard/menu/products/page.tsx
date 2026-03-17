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
import {Separator} from "@/components/ui/separator"
import {SidebarTrigger} from "@/components/ui/sidebar"
import {Button} from "@/components/ui/button"
import {Badge} from "@/components/ui/badge"
import {Card, CardContent} from "@/components/ui/card"
import {Plus} from "lucide-react"
import {ProductsList} from "./products-list"
import {getUserRole} from "@/lib/actions/auth"
import {QuotaGuard} from "@/components/subscription/QuotaGuard"
import {getQuotaStatus} from "@/lib/services/subscription-checker"
import {getLabels} from "@/lib/config/activity-labels" // ← NOUVEAU

export default async function ProductsPage() {
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

    const productsQuota = await getQuotaStatus(restaurantId, "max_products")

    const products = await prisma.product.findMany({
        where: {restaurantId},
        include: {
            category: {select: {name: true}},
            family: {select: {name: true}},
            stock: {select: {quantity: true}},
        },
        orderBy: {createdAt: "desc"},
    })

    const categories = await prisma.category.findMany({
        where: {restaurantId, isActive: true},
        orderBy: {position: "asc"},
    })

    return (
        <>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1"/>
                <Separator orientation="vertical" className="mr-2 h-4"/>
                <div className="flex w-full items-center justify-between">
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
                </div>
            </header>

            <div className="flex flex-1 flex-col gap-6 p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            {/* ← Titre dynamique */}
                            <h1 className="text-3xl font-bold tracking-tight">
                                {labels.productNameCapital}s
                            </h1>
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
                        </div>
                        <p className="mt-2 text-muted-foreground">
                            Gérez tous vos {labels.productNamePlural}
                        </p>
                    </div>

                    <div className="shrink-0">
                        <QuotaGuard
                            status={productsQuota}
                            quotaName={labels.productNamePlural}
                            disableWhenAtLimit={true}
                            showProgress={false}
                        >
                            <Link href="/dashboard/menu/products/new">
                                <Button>
                                    <Plus className="mr-2 h-4 w-4"/>
                                    {/* ← Bouton dynamique */}
                                    Nouveau {labels.productName}
                                </Button>
                            </Link>
                        </QuotaGuard>
                    </div>
                </div>

                {productsQuota.limit !== "unlimited" && (
                    <Card>
                        <CardContent className="p-6 space-y-4">
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
                                            : productsQuota.isNearLimit ? "bg-amber-500"
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
                    </Card>
                )}

                <ProductsList products={products}/>
            </div>
        </>
    )
}