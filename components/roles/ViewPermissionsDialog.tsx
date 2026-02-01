// components/roles/ViewPermissionsDialog.tsx
'use client'

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CheckCircle2 } from 'lucide-react'

interface Permission {
    id: string
    name: string
    category: string
    description?: string | null
}

interface ViewPermissionsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    role: {
        name: string
        description: string | null
    }
    permissionsByCategory: Record<string, Permission[]>
}

export function ViewPermissionsDialog({
    open,
    onOpenChange,
    role,
    permissionsByCategory,
}: ViewPermissionsDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Permissions du rôle : {role.name}</DialogTitle>
                    <DialogDescription>
                        {role.description || 'Détails des autorisations accordées à ce rôle'}
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="max-h-[60vh] pr-4">
                    <div className="space-y-6">
                        {Object.entries(permissionsByCategory).map(
                            ([category, permissions]) => (
                                <div key={category} className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="secondary">{category}</Badge>
                                        <span className="text-sm text-muted-foreground">
                                            {permissions.length} permission
                                            {permissions.length > 1 ? 's' : ''}
                                        </span>
                                    </div>

                                    <div className="space-y-2 ml-4">
                                        {permissions.map((permission) => (
                                            <div
                                                key={permission.id}
                                                className="flex items-start gap-2 p-2 rounded-lg bg-muted/50"
                                            >
                                                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium">
                                                        {permission.name}
                                                    </p>
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
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}