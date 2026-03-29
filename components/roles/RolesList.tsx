// components/roles/RolesList.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRestaurant } from '@/lib/hooks/use-restaurant'
import { getRestaurantRoles } from '@/lib/actions/roles'
import { RoleCard } from './RoleCard'
import { Card, CardContent } from '@/components/ui/card'
import { ShieldAlert } from 'lucide-react'

export interface RoleItem {
    id: string
    name: string
    slug: string | null
    description: string | null
    color: string | null
    isSystem: boolean
    isProtected: boolean
    isActive: boolean
    permissions: {
        permission: {
            id: string
            name: string
            category: string
            resource: string
            action: string
        }
    }[]
    _count: {
        restaurantUsers: number
    }
}

export function RolesList() {
    const { currentRestaurant } = useRestaurant()
    const [roles, setRoles] = useState<RoleItem[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadRoles() {
            if (!currentRestaurant) return

            setLoading(true)
            const result = await getRestaurantRoles(currentRestaurant.id)

            if (result.success && result.roles) {
                setRoles(result.roles)
            }

            setLoading(false)
        }

        loadRoles()
    }, [currentRestaurant])

    if (loading) {
        return (
            <div className="space-y-4">
                <div>
                    <div className="h-6 w-40 bg-muted animate-pulse rounded" />
                    <div className="h-4 w-64 bg-muted animate-pulse rounded mt-2" />
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <Card key={i}>
                            <CardContent className="p-6 space-y-4">
                                <div className="flex items-center gap-2">
                                    <div className="h-5 w-5 bg-muted animate-pulse rounded" />
                                    <div className="h-5 w-32 bg-muted animate-pulse rounded" />
                                </div>
                                <div className="h-4 w-full bg-muted animate-pulse rounded" />
                                <div className="flex gap-2">
                                    <div className="h-5 w-20 bg-muted animate-pulse rounded-full" />
                                    <div className="h-5 w-20 bg-muted animate-pulse rounded-full" />
                                </div>
                                <div className="h-9 w-full bg-muted animate-pulse rounded" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        )
    }

    if (roles.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center p-12">
                    <ShieldAlert className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="font-semibold text-lg mb-2">Aucun rôle trouvé</h3>
                    <p className="text-sm text-muted-foreground text-center max-w-md">
                        Commencez par créer un rôle personnalisé pour votre équipe
                    </p>
                </CardContent>
            </Card>
        )
    }

    const systemRoles = roles.filter((r) => r.isSystem)
    const customRoles = roles.filter((r) => !r.isSystem)

    return (
        <div className="space-y-8">
            {systemRoles.length > 0 && (
                <div className="space-y-4">
                    <div>
                        <h2 className="text-lg font-semibold">Rôles par défaut</h2>
                        <p className="text-sm text-muted-foreground">
                            Ces rôles sont prédéfinis et ne peuvent pas être supprimés
                        </p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {systemRoles.map((role) => (
                            <RoleCard key={role.id} role={role} />
                        ))}
                    </div>
                </div>
            )}

            {customRoles.length > 0 && (
                <div className="space-y-4">
                    <div>
                        <h2 className="text-lg font-semibold">Rôles personnalisés</h2>
                        <p className="text-sm text-muted-foreground">
                            Rôles créés spécifiquement pour votre restaurant
                        </p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {customRoles.map((role) => (
                            <RoleCard key={role.id} role={role} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
