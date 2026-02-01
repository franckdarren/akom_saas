// components/roles/RoleCard.tsx
'use client'

import { useState } from 'react'
import { useRestaurant } from '@/lib/hooks/use-restaurant'
import { deleteCustomRole } from '@/lib/actions/roles'
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import { PermissionGuard } from '@/components/permissions/PermissionGuard'
import { EditRoleDialog } from './EditRoleDialog'
import { ViewPermissionsDialog } from './ViewPermissionsDialog'
import { MoreVertical, Users, Shield, Trash2, Edit, Eye } from 'lucide-react'
import { toast } from 'sonner'

interface RoleCardProps {
    role: {
        id: string
        name: string
        description: string | null
        isSystem: boolean
        isActive: boolean
        permissions: {
            permission: {
                id: string
                name: string
                category: string
            }
        }[]
        _count: {
            restaurantUsers: number
        }
    }
}

export function RoleCard({ role }: RoleCardProps) {
    const { currentRestaurant } = useRestaurant()
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [showEditDialog, setShowEditDialog] = useState(false)
    const [showViewDialog, setShowViewDialog] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    async function handleDelete() {
        if (!currentRestaurant) return

        setIsDeleting(true)

        const result = await deleteCustomRole(role.id, currentRestaurant.id)

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Rôle supprimé avec succès')
            setShowDeleteDialog(false)
        }

        setIsDeleting(false)
    }

    // Regrouper les permissions par catégorie
    const permissionsByCategory = role.permissions.reduce((acc, rp) => {
        const category = rp.permission.category
        if (!acc[category]) {
            acc[category] = []
        }
        acc[category].push(rp.permission)
        return acc
    }, {} as Record<string, typeof role.permissions[0]['permission'][]>)

    const categoriesCount = Object.keys(permissionsByCategory).length

    return (
        <>
            <Card className="flex flex-col">
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-primary" />
                            <CardTitle className="text-lg">{role.name}</CardTitle>
                        </div>
                        {!role.isSystem && (
                            <PermissionGuard resource="roles" action="update">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon-sm">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => setShowViewDialog(true)}>
                                            <Eye className="h-4 w-4" />
                                            Voir les permissions
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                                            <Edit className="h-4 w-4" />
                                            Modifier
                                        </DropdownMenuItem>
                                        <PermissionGuard resource="roles" action="delete">
                                            <DropdownMenuItem
                                                variant="destructive"
                                                onClick={() => setShowDeleteDialog(true)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                Supprimer
                                            </DropdownMenuItem>
                                        </PermissionGuard>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </PermissionGuard>
                        )}
                    </div>
                    {role.description && (
                        <CardDescription className="mt-2">
                            {role.description}
                        </CardDescription>
                    )}
                </CardHeader>

                <CardContent className="flex-1">
                    <div className="space-y-4">
                        {/* Badge système */}
                        {role.isSystem && (
                            <Badge variant="secondary">Rôle par défaut</Badge>
                        )}

                        {/* Statistiques */}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                <span>
                                    {role._count.restaurantUsers} utilisateur
                                    {role._count.restaurantUsers > 1 ? 's' : ''}
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Shield className="h-4 w-4" />
                                <span>
                                    {categoriesCount} catégorie
                                    {categoriesCount > 1 ? 's' : ''}
                                </span>
                            </div>
                        </div>

                        {/* Aperçu des catégories de permissions */}
                        <div className="flex flex-wrap gap-2">
                            {Object.keys(permissionsByCategory)
                                .slice(0, 3)
                                .map((category) => (
                                    <Badge key={category} variant="outline" className="text-xs">
                                        {category}
                                    </Badge>
                                ))}
                            {categoriesCount > 3 && (
                                <Badge variant="outline" className="text-xs">
                                    +{categoriesCount - 3}
                                </Badge>
                            )}
                        </div>
                    </div>
                </CardContent>

                <CardFooter>
                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setShowViewDialog(true)}
                    >
                        <Eye className="h-4 w-4" />
                        Voir les permissions
                    </Button>
                </CardFooter>
            </Card>

            {/* Dialog de visualisation des permissions */}
            <ViewPermissionsDialog
                open={showViewDialog}
                onOpenChange={setShowViewDialog}
                role={role}
                permissionsByCategory={permissionsByCategory}
            />

            {/* Dialog d'édition */}
            {showEditDialog && (
                <EditRoleDialog
                    open={showEditDialog}
                    onOpenChange={setShowEditDialog}
                    role={role}
                />
            )}

            {/* Dialog de confirmation de suppression */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer le rôle</AlertDialogTitle>
                        <AlertDialogDescription>
                            Êtes-vous sûr de vouloir supprimer le rôle "{role.name}" ? Cette
                            action est irréversible.
                            {role._count.restaurantUsers > 0 && (
                                <span className="block mt-2 text-destructive font-medium">
                                    Ce rôle est utilisé par {role._count.restaurantUsers}{' '}
                                    utilisateur{role._count.restaurantUsers > 1 ? 's' : ''}. Vous
                                    devez d'abord les réassigner à un autre rôle.
                                </span>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting || role._count.restaurantUsers > 0}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            {isDeleting ? 'Suppression...' : 'Supprimer'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}