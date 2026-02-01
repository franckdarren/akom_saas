// components/roles/RolesList.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRestaurant } from '@/lib/hooks/use-restaurant'
import { getRestaurantRoles } from '@/lib/actions/roles'
import { RoleCard } from './RoleCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ShieldAlert } from 'lucide-react'

interface Role {
    id: string
    name: string
    description: string | null
    isSystem: boolean
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
    const [roles, setRoles] = useState<Role[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function loadRoles() {
            if (!currentRestaurant) return

            setLoading(true)
            setError(null)

            const result = await getRestaurantRoles(currentRestaurant.id)

            if (result.error) {
                setError(result.error)
            } else if (result.roles) {
                setRoles(result.roles)
            }

            setLoading(false)
        }

        loadRoles()
    }, [currentRestaurant])

    if (loading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                    <Card key={i}>
                        <CardHeader>
                            <div className="h-6 w-32 bg-muted animate-pulse rounded" />
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="h-4 w-full bg-muted animate-pulse rounded" />
                                <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        )
    }

    if (error) {
        return (
            <Card className="border-destructive">
                <CardContent className="flex items-center gap-4 p-6">
                    <ShieldAlert className="h-8 w-8 text-destructive" />
                    <div>
                        <h3 className="font-semibold text-destructive">
                            Erreur de chargement
                        </h3>
                        <p className="text-sm text-muted-foreground">{error}</p>
                    </div>
                </CardContent>
            </Card>
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

    // Séparer les rôles système des rôles personnalisés
    const systemRoles = roles.filter((r) => r.isSystem)
    const customRoles = roles.filter((r) => !r.isSystem)

    return (
        <div className="space-y-8">
            {/* Rôles système */}
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

            {/* Rôles personnalisés */}
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