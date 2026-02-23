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
import {Card, CardContent} from "@/components/ui/card"

import {Plus} from "lucide-react"

import {CategoriesList} from "./categories-list"
import {CreateCategoryDialog} from "./create-category-dialog"
import {QuotaGuard} from "@/components/subscription/QuotaGuard"
import {getQuotaStatus} from "@/lib/services/subscription-checker"

export default async function CategoriesPage() {
    const supabase = await createClient()

    const {
        data: {user},
    } = await supabase.auth.getUser()

    if (!user) redirect("/login")

    await getUserRole()

    const restaurantUser = await prisma.restaurantUser.findFirst({
        where: {userId: user.id},
    })

    if (!restaurantUser) redirect("/onboarding")

    const restaurantId = restaurantUser.restaurantId

    const categoriesQuota = await getQuotaStatus(
        restaurantId,
        "max_categories"
    )

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
            {/* ================= HEADER ================= */}
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1"/>
                <Separator orientation="vertical" className="mr-2 h-4"/>

                <div className="flex w-full items-center justify-between">
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/dashboard">
                                    Menu
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator/>
                            <BreadcrumbItem>
                                <BreadcrumbPage>
                                    Catégories
                                </BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header>

            {/* ================= CONTENT ================= */}
            <div className="flex flex-1 flex-col gap-6 p-6">

                {/* ===== Titre + bouton ===== */}
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">

                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold tracking-tight">
                                Catégories
                            </h1>

                            <Badge
                                variant={
                                    categoriesQuota.isAtLimit
                                        ? "destructive"
                                        : categoriesQuota.isNearLimit
                                            ? "secondary"
                                            : "outline"
                                }
                            >
                                {categoriesQuota.used}/
                                {categoriesQuota.limit === "unlimited"
                                    ? "∞"
                                    : categoriesQuota.limit}
                            </Badge>
                        </div>

                        <p className="mt-2 text-muted-foreground">
                            Organisez votre menu en catégories
                            (Plats, Boissons, Desserts...)
                        </p>
                    </div>

                    {/* Bouton protégé */}
                    <div className="shrink-0">
                        <QuotaGuard
                            status={categoriesQuota}
                            quotaName="catégories"
                            disableWhenAtLimit={true}
                            showProgress={false}
                        >
                            <CreateCategoryDialog>
                                <Button>
                                    <Plus className="mr-2 h-4 w-4"/>
                                    Nouvelle catégorie
                                </Button>
                            </CreateCategoryDialog>
                        </QuotaGuard>
                    </div>
                </div>

                {/* ===== Carte Quota Premium ===== */}
                {categoriesQuota.limit !== "unlimited" && (
                    <Card>
                        <CardContent className="p-6 space-y-4">

                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold">
                                        Utilisation des catégories
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        {categoriesQuota.used} sur{" "}
                                        {categoriesQuota.limit} catégories utilisées
                                    </p>
                                </div>

                                <Badge
                                    variant={
                                        categoriesQuota.isAtLimit
                                            ? "destructive"
                                            : categoriesQuota.isNearLimit
                                                ? "secondary"
                                                : "outline"
                                    }
                                >
                                    {Math.round(categoriesQuota.percentage)}%
                                </Badge>
                            </div>

                            {/* Barre moderne */}
                            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                                <div
                                    className={`
                    h-full transition-all duration-500
                    ${
                                        categoriesQuota.isAtLimit
                                            ? "bg-destructive"
                                            : categoriesQuota.isNearLimit
                                                ? "bg-amber-500"
                                                : "bg-primary"
                                    }
                  `}
                                    style={{
                                        width: `${categoriesQuota.percentage}%`,
                                    }}
                                />
                            </div>

                            {/* Upgrade discret */}
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
                    </Card>
                )}

                {/* ===== Liste ===== */}
                <CategoriesList categories={categories}/>
            </div>
        </>
    )
}