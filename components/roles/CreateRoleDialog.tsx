// components/roles/CreateRoleDialog.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRestaurant } from '@/lib/hooks/use-restaurant'
import { createCustomRole, getAllPermissions } from '@/lib/actions/roles'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Loader2, Info } from 'lucide-react'
import type { RoleTemplate } from '@/lib/constants/role-templates'

interface Permission {
    id: string
    resource: string
    action: string
    name: string
    description: string | null
    category: string
}

interface CreateRoleDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    template?: RoleTemplate | null
}

export function CreateRoleDialog({
    open,
    onOpenChange,
    template,
}: CreateRoleDialogProps) {
    const { currentRestaurant } = useRestaurant()
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
    const [permissionsByCategory, setPermissionsByCategory] = useState<Record<string, Permission[]>>({})
    const [loading, setLoading] = useState(false)
    const [loadingPermissions, setLoadingPermissions] = useState(true)

    // Charger les permissions disponibles au montage du composant
    useEffect(() => {
        async function loadPermissions() {
            setLoadingPermissions(true)
            const result = await getAllPermissions()

            if (result.error) {
                toast.error(result.error)
            } else if (result.permissions) {
                setPermissionsByCategory(result.permissions)

                // Si un template est fourni, pré-sélectionner ses permissions
                if (template) {
                    const templatePermissionIds: string[] = []

                    Object.values(result.permissions).forEach((categoryPerms) => {
                        (categoryPerms as Permission[]).forEach((perm) => {
                            const matchesTemplate = template.permissions.some(
                                (tp) => tp.resource === perm.resource && tp.action === perm.action
                            )
                            if (matchesTemplate) {
                                templatePermissionIds.push(perm.id)
                            }
                        })
                    })

                    setSelectedPermissions(templatePermissionIds)
                    setName(template.name)
                    setDescription(template.description)
                }
            }

            setLoadingPermissions(false)
        }

        if (open) {
            loadPermissions()
        }
    }, [open, template])

    // Réinitialiser le formulaire à la fermeture
    useEffect(() => {
        if (!open) {
            setName('')
            setDescription('')
            setSelectedPermissions([])
        }
    }, [open])

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

        const result = await createCustomRole(currentRestaurant.id, {
            name: name.trim(),
            description: description.trim() || undefined,
            permissionIds: selectedPermissions,
        })

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Rôle créé avec succès')
            onOpenChange(false)
        }

        setLoading(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {/* 
                Utilisation d'un DialogContent sans max-height fixe 
                Le contenu scrollera naturellement avec overflow-y-auto
            */}
            <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Créer un nouveau rôle</DialogTitle>
                    <DialogDescription>
                        Définissez un rôle personnalisé avec les permissions adaptées à votre organisation
                    </DialogDescription>
                </DialogHeader>

                {/* Form avec scroll naturel */}
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                    {/* Contenu scrollable - le navigateur gère le scroll naturellement */}
                    <div className="flex-1 overflow-y-auto px-1 -mx-1">
                        <div className="space-y-6 py-4">
                            {/* Informations de base */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">
                                        Nom du rôle <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Ex: Serveur, Gérant de salle, Chef de cuisine..."
                                        required
                                        disabled={loading}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Choisissez un nom descriptif qui reflète la fonction de ce rôle
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Description (optionnel)</Label>
                                    <Textarea
                                        id="description"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Décrivez les responsabilités de ce rôle..."
                                        rows={3}
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            {/* Sélection des permissions */}
                            <div className="space-y-4">
                                <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                                    <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                                    <div className="text-sm text-blue-900 dark:text-blue-100">
                                        <p className="font-medium mb-1">Sélectionnez les permissions</p>
                                        <p className="text-blue-700 dark:text-blue-300">
                                            Les permissions déterminent ce que les utilisateurs avec ce rôle peuvent faire dans le restaurant.
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
                                                    {/* Header de catégorie */}
                                                    <div className="flex items-center gap-3">
                                                        <Checkbox
                                                            checked={isCategorySelected(category)}
                                                            onCheckedChange={() => toggleCategory(category)}
                                                            disabled={loading}
                                                        />
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <Badge variant="secondary">{category}</Badge>
                                                                <span className="text-sm text-muted-foreground">
                                                                    {permissions.filter((p) => selectedPermissions.includes(p.id)).length} / {permissions.length}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Liste des permissions */}
                                                    <div className="space-y-2 ml-8">
                                                        {permissions.map((permission) => (
                                                            <div
                                                                key={permission.id}
                                                                className="flex items-start gap-3 p-2 rounded hover:bg-muted/50 transition-colors"
                                                            >
                                                                <Checkbox
                                                                    id={`perm-${permission.id}`}
                                                                    checked={selectedPermissions.includes(permission.id)}
                                                                    onCheckedChange={() => togglePermission(permission.id)}
                                                                    disabled={loading}
                                                                    className="mt-0.5"
                                                                />
                                                                <label
                                                                    htmlFor={`perm-${permission.id}`}
                                                                    className="flex-1 min-w-0 cursor-pointer"
                                                                >
                                                                    <div className="text-sm font-medium">
                                                                        {permission.name}
                                                                    </div>
                                                                    {permission.description && (
                                                                        <p className="text-xs text-muted-foreground mt-1">
                                                                            {permission.description}
                                                                        </p>
                                                                    )}
                                                                </label>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Résumé */}
                            {selectedPermissions.length > 0 && (
                                <div className="p-4 bg-muted/50 rounded-lg border">
                                    <p className="text-sm font-medium mb-2">
                                        Résumé : {selectedPermissions.length} permission{selectedPermissions.length > 1 ? 's' : ''} sélectionnée{selectedPermissions.length > 1 ? 's' : ''}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {Object.entries(permissionsByCategory).map(([category, permissions]) => {
                                            const count = permissions.filter((p) => selectedPermissions.includes(p.id)).length
                                            if (count === 0) return null
                                            return (
                                                <Badge key={category} variant="outline">
                                                    {category}: {count}
                                                </Badge>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer fixe */}
                    <DialogFooter className="mt-4">
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
                                    Création...
                                </>
                            ) : (
                                'Créer le rôle'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}