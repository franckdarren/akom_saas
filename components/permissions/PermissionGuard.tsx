// components/permissions/PermissionGuard.tsx
'use client'

import { ReactNode } from 'react'
import { usePermissions } from '@/lib/hooks/use-permissions'
import type { PermissionResource, PermissionAction } from '@prisma/client'

interface PermissionGuardProps {
    children: ReactNode
    resource: PermissionResource
    action: PermissionAction
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
    const { hasPermission, loading } = usePermissions()

    if (loading) {
        if (showLoading) {
            return (
                <div className="flex items-center justify-center p-4">
                    <div className="text-sm text-muted-foreground">Chargement...</div>
                </div>
            )
        }
        return null
    }

    if (!hasPermission(resource, action)) {
        return <>{fallback}</>
    }

    return <>{children}</>
}
