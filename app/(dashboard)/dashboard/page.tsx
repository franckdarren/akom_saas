// app/(dashboard)/dashboard/page.tsx
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getUserRole } from "@/lib/actions/auth"
import {
    Breadcrumb,
    BreadcrumbList,
    BreadcrumbItem,
    BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import prisma from "@/lib/prisma"
import { formatPrice } from "@/lib/utils/format"

export default async function DashboardPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect("/login")
    }

    const userRole = await getUserRole()

    // Si SuperAdmin, rediriger vers /superadmin
    if (userRole === "superadmin") {
        redirect("/superadmin")
    }

    // Récupérer les statistiques selon le rôle
    let stats: {
        totalOrders?: number
        totalRevenue?: number
        pendingOrders?: number
        deliveredOrders?: number
    } = {}

    if (userRole === "admin") {
        // Stats pour admin
        const restaurantUser = await prisma.restaurantUser.findFirst({
            where: { userId: user.id },
        })

        if (restaurantUser) {
            const [orders, revenue, pending, delivered] = await Promise.all([
                prisma.order.count({
                    where: { restaurantId: restaurantUser.restaurantId },
                }),
                prisma.order.aggregate({
                    _sum: { totalAmount: true },
                    where: {
                        restaurantId: restaurantUser.restaurantId,
                        status: "delivered",
                    },
                }),
                prisma.order.count({
                    where: {
                        restaurantId: restaurantUser.restaurantId,
                        status: "pending",
                    },
                }),
                prisma.order.count({
                    where: {
                        restaurantId: restaurantUser.restaurantId,
                        status: "delivered",
                    },
                }),
            ])

            stats = {
                totalOrders: orders,
                totalRevenue: revenue._sum.totalAmount || 0,
                pendingOrders: pending,
                deliveredOrders: delivered,
            }
        }
    } else if (userRole === "kitchen") {
        // Stats pour cuisine
        const restaurantUser = await prisma.restaurantUser.findFirst({
            where: { userId: user.id },
        })

        if (restaurantUser) {
            const [pending, preparing] = await Promise.all([
                prisma.order.count({
                    where: {
                        restaurantId: restaurantUser.restaurantId,
                        status: "pending",
                    },
                }),
                prisma.order.count({
                    where: {
                        restaurantId: restaurantUser.restaurantId,
                        status: "preparing",
                    },
                }),
            ])

            stats = {
                pendingOrders: pending,
                deliveredOrders: preparing,
            }
        }
    }

    return (
        <>
            {/* Header avec breadcrumb */}
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <div className="flex justify-between w-full">
                    <h1 className="text-sm font-medium my-auto">Tableau de bord</h1>
                    <div className="border-black text-right leading-tight text-sm">
                        {
                            userRole === "admin" && <p className="truncate font-medium">Administrateur</p>
                        }
                        {
                            userRole === "kitchen" && <p className="truncate font-medium">Cuisine</p>
                        }
                        <p className="text-muted-foreground truncate text-xs">{user.email}</p>
                    </div>
                </div>

            </header >

            {/* Contenu */}
            < div className="flex flex-1 flex-col gap-4 p-4" >
                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    {userRole === "admin" && (
                        <>
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardDescription>Commandes totales</CardDescription>
                                    <CardTitle className="text-4xl">{stats.totalOrders || 0}</CardTitle>
                                </CardHeader>
                            </Card>

                            <Card>
                                <CardHeader className="pb-3">
                                    <CardDescription>Chiffre d'affaires</CardDescription>
                                    <CardTitle className="text-4xl">
                                        {formatPrice(stats.totalRevenue || 0)}
                                    </CardTitle>
                                </CardHeader>
                            </Card>

                            <Card>
                                <CardHeader className="pb-3">
                                    <CardDescription>Commandes en attente</CardDescription>
                                    <CardTitle className="text-4xl">{stats.pendingOrders || 0}</CardTitle>
                                </CardHeader>
                            </Card>
                        </>
                    )}

                    {userRole === "kitchen" && (
                        <>
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardDescription>Commandes en attente</CardDescription>
                                    <CardTitle className="text-4xl">{stats.pendingOrders || 0}</CardTitle>
                                </CardHeader>
                            </Card>

                            <Card>
                                <CardHeader className="pb-3">
                                    <CardDescription>En préparation</CardDescription>
                                    <CardTitle className="text-4xl">{stats.deliveredOrders || 0}</CardTitle>
                                </CardHeader>
                            </Card>
                        </>
                    )}
                </div>

                <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min" />
            </div>
        </>
    )
}