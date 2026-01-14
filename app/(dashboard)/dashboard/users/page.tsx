// app/(dashboard)/dashboard/users/page.tsx
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { getTeamMembers } from '@/lib/actions/user'
import { CreateUserDialog } from '@/components/dashboard/CreateUserDialog'
import { UsersList } from '@/components/dashboard/UsersList'
import { RoleGuard } from '@/components/dashboard/RoleGuard'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import {
    Breadcrumb,
    BreadcrumbList,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbSeparator,
    BreadcrumbPage,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import { Users } from 'lucide-react'
import { getUserRole } from "@/lib/actions/auth"


export default async function UsersPage() {

    const userRole = await getUserRole()

    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Récupérer le restaurant actuel
    const restaurantUser = await prisma.restaurantUser.findFirst({
        where: { userId: user.id },
        select: { restaurantId: true },
    })

    if (!restaurantUser) {
        redirect('/dashboard')
    }

    return (
        <RoleGuard allowedRoles={['admin', 'superadmin']}>
            <>
                <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <div className="flex justify-between w-full">
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbLink href="/dashboard">Configuration</BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>
                                    <BreadcrumbPage>Utilisateurs</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                    <div className="border-black text-right leading-tight text-sm">
                        {
                            userRole === "admin" && <p className="truncate font-medium">Administrateur</p>
                        }
                        {
                            userRole === "kitchen" && <p className="truncate font-medium">Cuisine</p>
                        }
                        <p className="text-muted-foreground truncate text-xs">{user.email}</p>
                    </div>
                </header>
                <div className="flex flex-1 flex-col gap-4 p-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Paramètres des utilisateurs</h1>
                            <p className="text-muted-foreground mt-2">
                                Gérez les membres de votre restaurant
                            </p>
                        </div>
                        <CreateUserDialog />
                    </div>

                    {/* Liste des membres */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Membres de l'équipe
                            </CardTitle>
                            <CardDescription>
                                Invitez des membres, gérez leurs rôles et retirez
                                l'accès si nécessaire
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Suspense fallback={<UsersListSkeleton />}>
                                <UsersListWrapper
                                    restaurantId={restaurantUser.restaurantId}
                                    currentUserId={user.id}
                                />
                            </Suspense>
                        </CardContent>
                    </Card>

                    {/* Info sur les rôles */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Rôles et permissions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h4 className="font-medium mb-1">
                                    🔑 Administrateur
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                    Accès complet : menus, commandes, stocks,
                                    équipe, statistiques et paramètres
                                </p>
                            </div>
                            <div>
                                <h4 className="font-medium mb-1">👨‍🍳 Cuisine</h4>
                                <p className="text-sm text-muted-foreground">
                                    Gestion des commandes uniquement (réception,
                                    changement de statut)
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </>
        </RoleGuard>
    )
}

async function UsersListWrapper({
    restaurantId,
    currentUserId,
}: {
    restaurantId: string
    currentUserId: string
}) {
    const members = await getTeamMembers(restaurantId)

    return (
        <UsersList
            members={members}
            currentUserId={currentUserId}
            restaurantId={restaurantId}
        />
    )
}

function UsersListSkeleton() {
    return (
        <div className="space-y-4">
            {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-12 flex-1" />
                    <Skeleton className="h-12 w-24" />
                    <Skeleton className="h-12 w-32" />
                </div>
            ))}
        </div>
    )
}