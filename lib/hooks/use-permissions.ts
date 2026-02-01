// lib/hooks/use-permissions.ts
'use client'

import { useRestaurant } from '@/lib/hooks/use-restaurant'
import { useState, useEffect } from 'react'
import { hasPermission } from '@/lib/actions/roles'

interface UsePermissionsReturn {
    canCreate: (resource: string) => Promise<boolean>
    canRead: (resource: string) => Promise<boolean>
    canUpdate: (resource: string) => Promise<boolean>
    canDelete: (resource: string) => Promise<boolean>
    canManage: (resource: string) => Promise<boolean>
    loading: boolean
    // Helpers pour les cas courants
    isAdmin: boolean
}

export function usePermissions(): UsePermissionsReturn {
    const { currentRestaurant, isSuperAdmin } = useRestaurant()
    const [loading, setLoading] = useState(true)

    // Le SuperAdmin a tous les droits
    const isSuperAdminUser = isSuperAdmin

    useEffect(() => {
        // Une fois que le restaurant est chargé, on n'est plus en loading
        if (currentRestaurant || isSuperAdminUser) {
            setLoading(false)
        }
    }, [currentRestaurant, isSuperAdminUser])

    async function checkPermission(
        resource: string,
        action: string
    ): Promise<boolean> {
        // SuperAdmin a tous les droits
        if (isSuperAdminUser) return true

        // Si pas de restaurant sélectionné, pas de permissions
        if (!currentRestaurant) return false

        try {
            return await hasPermission(currentRestaurant.id, resource, action)
        } catch (error) {
            console.error('Erreur vérification permission:', error)
            return false
        }
    }

    return {
        canCreate: (resource: string) => checkPermission(resource, 'create'),
        canRead: (resource: string) => checkPermission(resource, 'read'),
        canUpdate: (resource: string) => checkPermission(resource, 'update'),
        canDelete: (resource: string) => checkPermission(resource, 'delete'),
        canManage: (resource: string) => checkPermission(resource, 'manage'),
        loading,
        isAdmin: isSuperAdminUser || currentRestaurant?.role === 'admin',
    }
}