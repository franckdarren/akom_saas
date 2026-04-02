// app/(dashboard)/dashboard/menu/categories/page.tsx
import {redirect} from "next/navigation"
import {createClient} from "@/lib/supabase/server"
import {getUserRole} from "@/lib/actions/auth"
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
import {AppCard, CardContent} from "@/components/ui/app-card"
import {Plus} from "lucide-react"
import {CategoriesList} from "./categories-list"
import {CreateCategoryDialog} from "./create-category-dialog"
import {QuotaGuard} from "@/components/subscription/QuotaGuard"
import {getQuotaStatus} from "@/lib/services/subscription-checker"
import {getLabels} from "@/lib/config/activity-labels" // ← NOUVEAU
import {PageHeader} from "@/components/ui/page-header"

export default async function CategoriesPage() {
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

    const categoriesQuota = await getQuotaStatus(restaurantId, "max_categories")

    const categories = await prisma.category.findMany({
        where: {restaurantId},
        orderBy: {position: "asc"},
        include: {
            _count: {
                select: {
                    products: true,
                    families: true,
                },
            },
        },
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
                                <BreadcrumbPage>{labels.categoryNameCapital}s</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header>

            <div className="layout-page">
                <PageHeader
                    title={`${labels.categoryNameCapital}s`}
                    description={`Organisez votre ${labels.catalogName} en ${labels.categoryName}s`}
                    titleBadge={
                        <Badge
                            variant={
                                categoriesQuota.isAtLimit ? "destructive"
                                    : categoriesQuota.isNearLimit ? "secondary"
                                        : "outline"
                            }
                        >
                            {categoriesQuota.used}/
                            {categoriesQuota.limit === "unlimited" ? "∞" : categoriesQuota.limit}
                        </Badge>
                    }
                    action={
                        <QuotaGuard
                            status={categoriesQuota}
                            quotaName={labels.categoryName + 's'}
                            disableWhenAtLimit={true}
                            showProgress={false}
                        >
                            <CreateCategoryDialog>
                                <Button>
                                    <Plus className="mr-2 h-4 w-4"/>
                                    Nouvelle {labels.categoryName}
                                </Button>
                            </CreateCategoryDialog>
                        </QuotaGuard>
                    }
                />

                {categoriesQuota.limit !== "unlimited" && (
                    <AppCard>
                        <CardContent className="layout-card-body">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold">
                                        Utilisation des {labels.categoryName}s
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        {categoriesQuota.used} sur {categoriesQuota.limit}{" "}
                                        {labels.categoryName}s utilisées
                                    </p>
                                </div>
                                <Badge
                                    variant={
                                        categoriesQuota.isAtLimit ? "destructive"
                                            : categoriesQuota.isNearLimit ? "secondary"
                                                : "outline"
                                    }
                                >
                                    {Math.round(categoriesQuota.percentage)}%
                                </Badge>
                            </div>

                            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-500 ${
                                        categoriesQuota.isAtLimit ? "bg-destructive"
                                            : categoriesQuota.isNearLimit ? "bg-amber-500"
                                                : "bg-primary"
                                    }`}
                                    style={{width: `${categoriesQuota.percentage}%`}}
                                />
                            </div>

                            {categoriesQuota.isAtLimit && (
                                <div className="pt-2">
                                    <Button asChild size="sm">
                                        <a href="/dashboard/subscription/choose-plan">
                                            Passer à un plan supérieur
                                        </a>
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </AppCard>
                )}

                <CategoriesList categories={categories}/>
            </div>
        </>
    )
}