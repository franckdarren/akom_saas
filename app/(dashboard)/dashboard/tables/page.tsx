// app/(dashboard)/dashboard/tables/page.tsx
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

import {TablesList} from "./tables-list"
import {CreateTableDialog} from "./create-table-dialog"
import {getUserRole} from "@/lib/actions/auth"
import {QuotaGuard} from "@/components/subscription/QuotaGuard"
import {getQuotaStatus} from "@/lib/services/subscription-checker"

export default async function TablesPage() {
    const supabase = await createClient()
    const {data: {user}} = await supabase.auth.getUser()

    if (!user) redirect("/login")

    await getUserRole()

    const restaurantUser = await prisma.restaurantUser.findFirst({
        where: {userId: user.id},
    })
    if (!restaurantUser) redirect("/onboarding")

    const restaurantId = restaurantUser.restaurantId

    // --- Vérifier quota tables si tu veux ---
    const tablesQuota = await getQuotaStatus(restaurantId, "max_tables")

    // --- Récupération des tables ---
    const tables = await prisma.table.findMany({
        where: {restaurantId},
        orderBy: {number: "asc"},
        include: {
            _count: {
                select: {
                    orders: {
                        where: {status: {in: ["pending", "preparing", "ready"]}},
                    },
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
                                    Opérations
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator/>
                            <BreadcrumbItem>
                                <BreadcrumbPage>
                                    Tables
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
                                Tables
                            </h1>

                            <Badge
                                variant={
                                    tablesQuota.isAtLimit
                                        ? "destructive"
                                        : tablesQuota.isNearLimit
                                            ? "secondary"
                                            : "outline"
                                }
                            >
                                {tablesQuota.used}/
                                {tablesQuota.limit === "unlimited"
                                    ? "∞"
                                    : tablesQuota.limit}
                            </Badge>
                        </div>
                        <p className="mt-2 text-muted-foreground">
                            Gérez les tables de votre restaurant et générez les QR codes
                        </p>
                    </div>

                    {/* Bouton protégé */}
                    <div className="shrink-0">
                        <QuotaGuard
                            status={tablesQuota}
                            quotaName="tables"
                            disableWhenAtLimit={true}
                            showProgress={false}
                        >
                            <CreateTableDialog>
                                <Button>
                                    <Plus className="mr-2 h-4 w-4"/>
                                    Nouvelle table
                                </Button>
                            </CreateTableDialog>
                        </QuotaGuard>
                    </div>
                </div>

                {/* ===== Carte Quota Tables ===== */}
                {tablesQuota.limit !== "unlimited" && (
                    <Card>
                        <CardContent className="p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold">
                                        Utilisation des tables
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        {tablesQuota.used} sur {tablesQuota.limit} tables utilisées
                                    </p>
                                </div>

                                <Badge
                                    variant={
                                        tablesQuota.isAtLimit
                                            ? "destructive"
                                            : tablesQuota.isNearLimit
                                                ? "secondary"
                                                : "outline"
                                    }
                                >
                                    {Math.round(tablesQuota.percentage)}%
                                </Badge>
                            </div>

                            {/* Barre moderne */}
                            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                                <div
                                    className={`
                                        h-full transition-all duration-500
                                        ${
                                        tablesQuota.isAtLimit
                                            ? "bg-destructive"
                                            : tablesQuota.isNearLimit
                                                ? "bg-amber-500"
                                                : "bg-primary"
                                    }
                                    `}
                                    style={{width: `${tablesQuota.percentage}%`}}
                                />
                            </div>

                            {/* Upgrade CTA */}
                            {tablesQuota.isAtLimit && (
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

                {/* ===== Liste des tables ===== */}
                <TablesList tables={tables}/>
            </div>
        </>
    )
}