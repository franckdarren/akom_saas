'use client'

import {useEffect, useState} from 'react'
import {Badge} from '@/components/ui/badge'
import {getUnreadTicketsCount} from '@/lib/actions/support'

/**
 * Badge de notification pour le SuperAdmin.
 *
 * Problème corrigé : getUnreadTicketsCount() appelle verifySuperAdmin()
 * qui throw une erreur si l'utilisateur n'est pas SuperAdmin.
 * Le composant était monté dans des layouts accessibles aux admins
 * normaux → crash silencieux → count restait à 0 sans jamais afficher.
 *
 * Fix : le try/catch dans l'action renvoie { success: false, count: 0 }
 * en cas d'erreur. Côté client, on vérifie result.success avant de
 * mettre à jour le state. Si l'utilisateur n'est pas SuperAdmin,
 * le composant reste simplement invisible (count === 0 → null).
 */

export function SuperAdminSupportBadge() {
    const [count, setCount] = useState(0)

    useEffect(() => {
        const loadCount = async () => {
            try {
                const result = await getUnreadTicketsCount()
                // ✅ result.success est false si l'utilisateur n'est pas SuperAdmin
                // Dans ce cas on ne met pas à jour le count → le composant reste null
                if (result.success) {
                    setCount(result.count)
                }
            } catch {
                // Silencieux : l'utilisateur n'est pas SuperAdmin ou erreur réseau
            }
        }

        loadCount()
        const interval = setInterval(loadCount, 30_000)
        return () => clearInterval(interval)
    }, [])

    if (count === 0) return null

    return (
        <Badge className="ml-auto bg-red-500 text-white">
            {count}
        </Badge>
    )
}