// app/(dashboard)/superadmin/page.tsx
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
import { Badge } from "@/components/ui/badge"

export default async function SuperAdminPage() {
    // Statistiques globales de la plateforme
    const [totalRestaurants, totalOrders, totalRevenue, restaurantUsers] =
        await Promise.all([
            prisma.restaurant.count(),
            prisma.order.count(),
            prisma.order.aggregate({
                _sum: {
                    totalAmount: true,
                },
                where: {
                    status: "delivered",
                },
            }),
            prisma.restaurantUser.findMany({
                select: {
                    userId: true,
                },
                distinct: ["userId"],
            }),
        ])

    const activeUsers = restaurantUsers.length

    return (
        <>
            {/* Header avec breadcrumb */}
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbPage className="flex items-center gap-2">
                                Vue d'ensemble
                                <Badge variant="destructive">Super Admin</Badge>
                            </BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </header>

            {/* Contenu */}
            <div className="flex flex-1 flex-col gap-4 p-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Statistiques de la plateforme</h1>
                    <p className="text-muted-foreground mt-2">
                        Vue d'ensemble de tous les restaurants Akôm
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardDescription>Restaurants</CardDescription>
                            <CardTitle className="text-4xl">{totalRestaurants}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-muted-foreground">
                                Total de restaurants actifs
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardDescription>Commandes totales</CardDescription>
                            <CardTitle className="text-4xl">{totalOrders}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-muted-foreground">
                                Toutes les commandes de la plateforme
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardDescription>Chiffre d'affaires</CardDescription>
                            <CardTitle className="text-4xl">
                                {formatPrice(totalRevenue._sum.totalAmount || 0)}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-muted-foreground">
                                Commandes livrées uniquement
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardDescription>Utilisateurs actifs</CardDescription>
                            <CardTitle className="text-4xl">{activeUsers}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-muted-foreground">
                                Utilisateurs avec au moins un restaurant
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Activité récente</CardTitle>
                        <CardDescription>
                            Derniers restaurants et commandes de la plateforme
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="min-h-[300px] flex items-center justify-center text-muted-foreground">
                            Liste détaillée à venir...
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    )
}