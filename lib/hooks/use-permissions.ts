// lib/hooks/use-permissions.ts
'use client'

import { useRestaurant } from '@/lib/hooks/use-restaurant'
import { useState, useEffect, useCallback } from 'react'
import { getUserPermissions } from '@/lib/actions/roles'
import type { PermissionResource, PermissionAction } from '@prisma/client'

interface PermissionsCache {
    [key: string]: boolean
}

interface UsePermissionsReturn {
    hasPermission: (resource: PermissionResource, action: PermissionAction) => boolean
    canCreate: (resource: PermissionResource) => boolean
    canRead: (resource: PermissionResource) => boolean
    canUpdate: (resource: PermissionResource) => boolean
    canDelete: (resource: PermissionResource) => boolean
    canManage: (resource: PermissionResource) => boolean
    loading: boolean
    isAdmin: boolean
    permissions: string[]
}

export function usePermissions(): UsePermissionsReturn {
    const { currentRestaurant, isSuperAdmin } = useRestaurant()
    const [loading, setLoading] = useState(true)
    const [permissionsCache, setPermissionsCache] = useState<PermissionsCache>({})
    const [permissions, setPermissions] = useState<string[]>([])

    // Charger toutes les permissions une seule fois
    useEffect(() => {
        async function loadPermissions() {
            if (!currentRestaurant) {
                setLoading(false)
                return
            }

            // SuperAdmin a tous les droits
            if (isSuperAdmin) {
                setPermissionsCache({ '*': true })
                setLoading(false)
                return
            }

            setLoading(true)

            try {
                const result = await getUserPermissions(currentRestaurant.id)

                if (result.permissions) {
                    // Créer un cache de permissions pour un accès O(1)
                    const cache: PermissionsCache = {}
                    const permList: string[] = []

                    result.permissions.forEach((perm) => {
                        const key = `${perm.resource}:${perm.action}`
                        cache[key] = true
                        permList.push(key)

                        // Si la permission est "manage", elle donne accès à toutes les actions
                        if (perm.action === 'manage') {
                            cache[`${perm.resource}:create`] = true
                            cache[`${perm.resource}:read`] = true
                            cache[`${perm.resource}:update`] = true
                            cache[`${perm.resource}:delete`] = true
                        }
                    })

                    setPermissionsCache(cache)
                    setPermissions(permList)
                }
            } catch (error) {
                console.error('Erreur chargement permissions:', error)
            } finally {
                setLoading(false)
            }
        }

        loadPermissions()
    }, [currentRestaurant, isSuperAdmin])

    // Fonction helper pour vérifier une permission
    const checkPermission = useCallback((resource: string, action: string): boolean => {
        // SuperAdmin a tous les droits
        if (isSuperAdmin || permissionsCache['*']) return true

        // Vérifier la permission exacte ou manage
        return permissionsCache[`${resource}:${action}`] ||
            permissionsCache[`${resource}:manage`] ||
            false
    }, [isSuperAdmin, permissionsCache])

    return {
        hasPermission: (resource: PermissionResource, action: PermissionAction) => checkPermission(resource, action),
        canCreate: (resource: PermissionResource) => checkPermission(resource, 'create'),
        canRead: (resource: PermissionResource) => checkPermission(resource, 'read'),
        canUpdate: (resource: PermissionResource) => checkPermission(resource, 'update'),
        canDelete: (resource: PermissionResource) => checkPermission(resource, 'delete'),
        canManage: (resource: PermissionResource) => checkPermission(resource, 'manage'),
        loading,
        isAdmin: isSuperAdmin || permissionsCache['restaurants:manage'] || false,
        permissions,
    }
}
