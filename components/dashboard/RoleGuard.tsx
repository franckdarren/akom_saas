'use client'

import { ReactNode } from 'react'
import { useRestaurant } from '@/lib/hooks/use-restaurant'
import type { SystemRole } from '@/types/auth'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'

interface RoleGuardProps {
    children: ReactNode
    allowedRoles: SystemRole[]
    fallback?: ReactNode
}

export function RoleGuard({ children, allowedRoles, fallback }: RoleGuardProps) {
    const { currentRole, loading } = useRestaurant()

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="text-muted-foreground">Chargement...</div>
            </div>
        )
    }

    // SuperAdmin a toujours accès
    if (currentRole === 'superadmin') {
        return <>{children}</>
    }

    if (!currentRole || !allowedRoles.includes(currentRole)) {
        if (fallback) {
            return <>{fallback}</>
        }

        return (
            <Alert variant="destructive">
                <AlertTitle>Accès refusé</AlertTitle>
                <AlertDescription>
                    Vous n&apos;avez pas les permissions nécessaires pour accéder à cette
                    section. Contactez un administrateur si vous pensez qu&apos;il s&apos;agit
                    d&apos;une erreur.
                </AlertDescription>
            </Alert>
        )
    }

    return <>{children}</>
}
