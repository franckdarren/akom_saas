// components/users/UsersList.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRestaurant } from '@/lib/hooks/use-restaurant'
import { getRestaurantUsers } from '@/lib/actions/user'
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { UserRoleSelector } from './UserRoleSelector'
import { PermissionGuard } from '@/components/permissions/PermissionGuard'
import { removeUserFromRestaurant } from '@/lib/actions/restaurant'
import { MoreVertical, Trash2, Mail, Shield } from 'lucide-react'
import { toast } from 'sonner'

interface RestaurantUser {
    id: string
    userId: string
    email: string
    roleId: string | null
    roleName: string
    createdAt: string
}

export function UsersList() {
    const { currentRestaurant } = useRestaurant()
    const [users, setUsers] = useState<RestaurantUser[]>([])
    const [loading, setLoading] = useState(true)
    const [userToDelete, setUserToDelete] = useState<RestaurantUser | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    useEffect(() => {
        async function loadUsers() {
            if (!currentRestaurant) return

            setLoading(true)
            const result = await getRestaurantUsers(currentRestaurant.id)

            if (result.error) {
                toast.error(result.error)
            } else if (result.users) {
                setUsers(result.users)
            }

            setLoading(false)
        }

        loadUsers()
    }, [currentRestaurant])

    async function handleDeleteUser() {
        if (!userToDelete || !currentRestaurant) return

        setIsDeleting(true)

        const result = await removeUserFromRestaurant(
            currentRestaurant.id,
            userToDelete.userId
        )

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Utilisateur retiré avec succès')
            setUsers(users.filter((u) => u.id !== userToDelete.id))
            setUserToDelete(null)
        }

        setIsDeleting(false)
    }

    function getInitials(email: string) {
        const parts = email.split('@')[0].split('.')
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase()
        }
        return email.substring(0, 2).toUpperCase()
    }

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <div className="h-6 w-48 bg-muted animate-pulse rounded" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center gap-4">
                                <div className="h-10 w-10 bg-muted animate-pulse rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-48 bg-muted animate-pulse rounded" />
                                    <div className="h-3 w-32 bg-muted animate-pulse rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (users.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center p-12">
                    <Shield className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="font-semibold text-lg mb-2">Aucun membre</h3>
                    <p className="text-sm text-muted-foreground text-center max-w-md">
                        Commencez par inviter des membres à rejoindre votre équipe
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Membres de l'équipe</CardTitle>
                    <CardDescription>
                        {users.length} membre{users.length > 1 ? 's' : ''} dans votre
                        restaurant
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Utilisateur</TableHead>
                                <TableHead>Rôle</TableHead>
                                <TableHead>Membre depuis</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarFallback className="bg-primary/10 text-primary">
                                                    {getInitials(user.email)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="font-medium">{user.email}</div>
                                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                    <Mail className="h-3 w-3" />
                                                    {user.email}
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <PermissionGuard
                                            resource="users"
                                            action="update"
                                            fallback={
                                                <Badge variant="secondary" className="gap-1">
                                                    <Shield className="h-3 w-3" />
                                                    {user.roleName}
                                                </Badge>
                                            }
                                        >
                                            <UserRoleSelector
                                                userId={user.userId}
                                                currentRoleId={user.roleId}
                                                currentRoleName={user.roleName}
                                            />
                                        </PermissionGuard>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {new Date(user.createdAt).toLocaleDateString('fr-FR', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric',
                                        })}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <PermissionGuard resource="users" action="delete">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon-sm">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        variant="destructive"
                                                        onClick={() => setUserToDelete(user)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                        Retirer de l'équipe
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </PermissionGuard>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Dialog de confirmation de suppression */}
            <AlertDialog
                open={!!userToDelete}
                onOpenChange={(open) => !open && setUserToDelete(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Retirer cet utilisateur ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Êtes-vous sûr de vouloir retirer{' '}
                            <span className="font-medium">{userToDelete?.email}</span> de
                            votre équipe ? Cette personne n'aura plus accès au restaurant.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>
                            Annuler
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteUser}
                            disabled={isDeleting}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            {isDeleting ? 'Suppression...' : 'Retirer'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}