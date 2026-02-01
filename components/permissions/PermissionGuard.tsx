// components/permissions/PermissionGuard.tsx
'use client'

import { ReactNode, useEffect, useState } from 'react'
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
    const [hasAccess, setHasAccess] = useState<boolean | null>(null)

    useEffect(() => {
        async function checkAccess() {
            let result = false

            switch (action) {
                case 'create':
                    result = await permissions.canCreate(resource)
                    break
                case 'read':
                    result = await permissions.canRead(resource)
                    break
                case 'update':
                    result = await permissions.canUpdate(resource)
                    break
                case 'delete':
                    result = await permissions.canDelete(resource)
                    break
                case 'manage':
                    result = await permissions.canManage(resource)
                    break
            }

            setHasAccess(result)
        }

        checkAccess()
    }, [resource, action, permissions])

    // Pendant le chargement
    if (hasAccess === null) {
        if (showLoading) {
            return (
                <div className="flex items-center justify-center p-4">
                    <div className="text-sm text-muted-foreground">Chargement...</div>
                </div>
            )
        }
        return null
    }

    // Si pas d'accès
    if (!hasAccess) {
        return <>{fallback}</>
    }

    // Si accès autorisé
    return <>{children}</>
}