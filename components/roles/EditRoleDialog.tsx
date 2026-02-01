// components/roles/EditRoleDialog.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRestaurant } from '@/lib/hooks/use-restaurant'
import { updateCustomRole, getAllPermissions } from '@/lib/actions/roles'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { Loader2, Info } from 'lucide-react'

interface Permission {
    id: string
    resource: string
    action: string
    name: string
    description: string | null
    category: string
}

interface EditRoleDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    role: {
        id: string
        name: string
        description: string | null
        isActive: boolean
        permissions: {
            permission: {
                id: string
                name: string
                category: string
            }
        }[]
    }
}

export function EditRoleDialog({
    open,
    onOpenChange,
    role,
}: EditRoleDialogProps) {
    const { currentRestaurant } = useRestaurant()
    const [name, setName] = useState(role.name)
    const [description, setDescription] = useState(role.description || '')
    const [isActive, setIsActive] = useState(role.isActive)
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>(
        role.permissions.map((rp) => rp.permission.id)
    )
    const [permissionsByCategory, setPermissionsByCategory] = useState<Record<string, Permission[]>>({})
    const [loading, setLoading] = useState(false)
    const [loadingPermissions, setLoadingPermissions] = useState(true)

    // Charger les permissions disponibles
    useEffect(() => {
        async function loadPermissions() {
            setLoadingPermissions(true)
            const result = await getAllPermissions()

            if (result.error) {
                toast.error(result.error)
            } else if (result.permissions) {
                setPermissionsByCategory(result.permissions)
            }

            setLoadingPermissions(false)
        }

        if (open) {
            loadPermissions()
        }
    }, [open])

    // Réinitialiser les valeurs quand le rôle change
    useEffect(() => {
        setName(role.name)
        setDescription(role.description || '')
        setIsActive(role.isActive)
        setSelectedPermissions(role.permissions.map((rp) => rp.permission.id))
    }, [role])

    function togglePermission(permissionId: string) {
        setSelectedPermissions((prev) =>
            prev.includes(permissionId)
                ? prev.filter((id) => id !== permissionId)
                : [...prev, permissionId]
        )
    }

    function toggleCategory(category: string) {
        const categoryPermissions = permissionsByCategory[category] || []
        const categoryPermissionIds = categoryPermissions.map((p) => p.id)

        const allSelected = categoryPermissionIds.every((id) =>
            selectedPermissions.includes(id)
        )

        if (allSelected) {
            setSelectedPermissions((prev) =>
                prev.filter((id) => !categoryPermissionIds.includes(id))
            )
        } else {
            setSelectedPermissions((prev) => [
                ...prev.filter((id) => !categoryPermissionIds.includes(id)),
                ...categoryPermissionIds,
            ])
        }
    }

    function isCategorySelected(category: string) {
        const categoryPermissions = permissionsByCategory[category] || []
        const categoryPermissionIds = categoryPermissions.map((p) => p.id)
        return categoryPermissionIds.every((id) => selectedPermissions.includes(id))
    }

    function isCategoryPartiallySelected(category: string) {
        const categoryPermissions = permissionsByCategory[category] || []
        const categoryPermissionIds = categoryPermissions.map((p) => p.id)
        const selectedCount = categoryPermissionIds.filter((id) =>
            selectedPermissions.includes(id)
        ).length
        return selectedCount > 0 && selectedCount < categoryPermissionIds.length
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        if (!currentRestaurant) {
            toast.error('Aucun restaurant sélectionné')
            return
        }

        if (!name.trim()) {
            toast.error('Le nom du rôle est obligatoire')
            return
        }

        if (selectedPermissions.length === 0) {
            toast.error('Vous devez sélectionner au moins une permission')
            return
        }

        setLoading(true)

        const result = await updateCustomRole(role.id, currentRestaurant.id, {
            name: name.trim(),
            description: description.trim() || undefined,
            isActive,
            permissionIds: selectedPermissions,
        })

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Rôle modifié avec succès')
            onOpenChange(false)
        }

        setLoading(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>Modifier le rôle : {role.name}</DialogTitle>
                    <DialogDescription>
                        Modifiez les informations et permissions de ce rôle
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <ScrollArea className="max-h-[calc(90vh-200px)] pr-4">
                        <div className="space-y-6">
                            {/* Informations de base */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-name">
                                        Nom du rôle <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="edit-name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="edit-description">Description (optionnel)</Label>
                                    <Textarea
                                        id="edit-description"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        rows={3}
                                    />
                                </div>

                                <div className="flex items-center justify-between p-4 rounded-lg border">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="edit-active">Statut du rôle</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Les rôles inactifs ne peuvent pas être assignés aux
                                            utilisateurs
                                        </p>
                                    </div>
                                    <Switch
                                        id="edit-active"
                                        checked={isActive}
                                        onCheckedChange={setIsActive}
                                    />
                                </div>
                            </div>

                            {/* Sélection des permissions */}
                            <div className="space-y-4">
                                <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                                    <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                                    <div className="text-sm text-blue-900 dark:text-blue-100">
                                        <p className="font-medium mb-1">Modifier les permissions</p>
                                        <p className="text-blue-700 dark:text-blue-300">
                                            Ajustez les permissions de ce rôle selon les besoins de
                                            votre organisation
                                        </p>
                                    </div>
                                </div>

                                {loadingPermissions ? (
                                    <div className="flex items-center justify-center p-8">
                                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {Object.entries(permissionsByCategory).map(
                                            ([category, permissions]) => (
                                                <div
                                                    key={category}
                                                    className="space-y-3 p-4 rounded-lg border bg-card"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Checkbox
                                                            checked={isCategorySelected(category)}
                                                            onCheckedChange={() => toggleCategory(category)}
                                                            className={
                                                                isCategoryPartiallySelected(category)
                                                                    ? 'data-[state=checked]:bg-primary/50'
                                                                    : ''
                                                            }
                                                        />
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <Badge variant="secondary">{category}</Badge>
                                                                <span className="text-sm text-muted-foreground">
                                                                    {
                                                                        permissions.filter((p) =>
                                                                            selectedPermissions.includes(p.id)
                                                                        ).length
                                                                    }{' '}
                                                                    / {permissions.length}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2 ml-8">
                                                        {permissions.map((permission) => (
                                                            <div
                                                                key={permission.id}
                                                                className="flex items-start gap-3 p-2 rounded hover:bg-muted/50 transition-colors"
                                                            >
                                                                <Checkbox
                                                                    checked={selectedPermissions.includes(
                                                                        permission.id
                                                                    )}
                                                                    onCheckedChange={() =>
                                                                        togglePermission(permission.id)
                                                                    }
                                                                    className="mt-0.5"
                                                                />
                                                                <div className="flex-1 min-w-0">
                                                                    <Label className="text-sm font-medium cursor-pointer">
                                                                        {permission.name}
                                                                    </Label>
                                                                    {permission.description && (
                                                                        <p className="text-xs text-muted-foreground mt-1">
                                                                            {permission.description}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </ScrollArea>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            Annuler
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Modification...
                                </>
                            ) : (
                                'Enregistrer'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}