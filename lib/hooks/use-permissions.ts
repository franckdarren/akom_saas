// lib/hooks/use-permissions.ts
'use client'

import { useRestaurant } from '@/lib/hooks/use-restaurant'
import { useState, useEffect, useCallback } from 'react'
import { getUserPermissions } from '@/lib/actions/roles'

interface PermissionsCache {
    [key: string]: boolean
}

interface UsePermissionsReturn {
    canCreate: (resource: string) => boolean
    canRead: (resource: string) => boolean
    canUpdate: (resource: string) => boolean
    canDelete: (resource: string) => boolean
    canManage: (resource: string) => boolean
    loading: boolean
    isAdmin: boolean
    permissions: string[] // Liste de toutes les permissions
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
        canCreate: (resource: string) => checkPermission(resource, 'create'),
        canRead: (resource: string) => checkPermission(resource, 'read'),
        canUpdate: (resource: string) => checkPermission(resource, 'update'),
        canDelete: (resource: string) => checkPermission(resource, 'delete'),
        canManage: (resource: string) => checkPermission(resource, 'manage'),
        loading,
        isAdmin: isSuperAdmin || permissionsCache['users:manage'] || false,
        permissions,
    }
}