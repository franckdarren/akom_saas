// components/roles/RolesList.tsx
'use client'

import { RoleCard } from './RoleCard'
import { Card, CardContent } from '@/components/ui/card'
import { ShieldAlert } from 'lucide-react'

export interface RoleItem {
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

interface RolesListProps {
    roles: RoleItem[]
}

export function RolesList({ roles }: RolesListProps) {
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
