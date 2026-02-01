// components/permissions/PermissionGuard.tsx
'use client'

import { ReactNode } from 'react'
import { usePermissions } from '@/lib/hooks/use-permissions'

interface PermissionGuardProps {
    children: ReactNode
    resource: string
    action: 'create' | 'read' | 'update' | 'delete' | 'manage'
    fallback?: ReactNode
    showLoading?: boolean
}

export function PermissionGuard({
    children,
    resource,
    action,
    fallback = null,
    showLoading = false,
}: PermissionGuardProps) {
    const permissions = usePermissions()

    // Pendant le chargement
    if (permissions.loading) {
        if (showLoading) {
            return (
                <div className="flex items-center justify-center p-4">
                    <div className="text-sm text-muted-foreground">Chargement...</div>
                </div>
            )
        }
        return null
    }

    // Vérification de permission (maintenant instantanée)
    let hasAccess = false
    switch (action) {
        case 'create':
            hasAccess = permissions.canCreate(resource)
            break
        case 'read':
            hasAccess = permissions.canRead(resource)
            break
        case 'update':
            hasAccess = permissions.canUpdate(resource)
            break
        case 'delete':
            hasAccess = permissions.canDelete(resource)
            break
        case 'manage':
            hasAccess = permissions.canManage(resource)
            break
    }

    if (!hasAccess) {
        return <>{fallback}</>
    }

    return <>{children}</>
}