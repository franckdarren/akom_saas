import { getAllUsers } from '@/lib/actions/superadmin'
import { formatDate, formatNumber } from '@/lib/utils/format'
import { getRoleBadge } from '@/lib/utils/permissions'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import {
    Breadcrumb,
    BreadcrumbList,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbSeparator,
    BreadcrumbPage,
} from '@/components/ui/breadcrumb'
import { Suspense } from 'react'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'


export default async function UsersManagementPage() {
    const users = await getAllUsers()

    return (
        <>
            {/* Header */}
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <div className="flex justify-between w-full">
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/superadmin">Administration</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Utilisateurs</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header>
            <div className="flex flex-col gap-6 p-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Utilisateurs</h1>
                        <p className="text-muted-foreground mt-2">
                            Tous les utilisateurs de la plateforme
                        </p>
                    </div>
                    <div className="text-sm text-zinc-600 dark:text-zinc-400">
                        Total : {formatNumber(users.length)}
                    </div>
                </div>
                {/* Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Liste complète</CardTitle>
                        <CardDescription>
                            Vue d'ensemble de tous les utilisateurs
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User ID</TableHead>
                                    <TableHead>Restaurant</TableHead>
                                    <TableHead>Rôle</TableHead>
                                    <TableHead>Ajouté le</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={4}
                                            className="text-center text-zinc-600 dark:text-zinc-400"
                                        >
                                            Aucun utilisateur
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    users.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-mono text-sm">
                                                {user.userId.slice(0, 12)}...
                                            </TableCell>
                                            <TableCell>
                                                <Link
                                                    href={`/superadmin/restaurants/${user.restaurant.id}`}
                                                    className="hover:underline"
                                                >
                                                    {user.restaurant.name}
                                                </Link>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    className={
                                                        getRoleBadge(
                                                            user.role as 'admin' | 'kitchen'
                                                        ).color
                                                    }
                                                >
                                                    {
                                                        getRoleBadge(
                                                            user.role as 'admin' | 'kitchen'
                                                        ).label
                                                    }
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-zinc-600 dark:text-zinc-400">
                                                {formatDate(user.createdAt)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>


        </>
    )
}