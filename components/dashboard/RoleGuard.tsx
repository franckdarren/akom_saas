'use client'

import { ReactNode } from 'react'
import { useRestaurant } from '@/lib/hooks/use-restaurant'
import type { SystemRole } from '@/types/auth'

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
                <div className="text-zinc-600 dark:text-zinc-400">Chargement...</div>
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
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
                    Accès refusé
                </h3>
                <p className="text-sm text-red-800 dark:text-red-200">
                    Vous n'avez pas les permissions nécessaires pour accéder à cette
                    section. Contactez un administrateur si vous pensez qu'il s'agit
                    d'une erreur.
                </p>
            </div>
        )
    }

    return <>{children}</>
}