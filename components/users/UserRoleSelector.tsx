'use client'

import { useState, useEffect } from 'react'
import { useRestaurant } from '@/lib/hooks/use-restaurant'
import { getRestaurantRoles, assignRoleToUser } from '@/lib/actions/roles'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Shield } from 'lucide-react'

interface UserRoleSelectorProps {
    userId: string
    currentRoleId: string | null
    currentRoleName?: string
    disabled?: boolean
}

interface Role {
    id: string
    name: string
    isSystem: boolean
    isActive?: boolean // ajouté pour éviter les problèmes TS
    _count: {
        restaurantUsers: number
    }
}

interface GetRestaurantRolesResult {
    roles?: Role[]
    error?: string
}

export function UserRoleSelector({
    userId,
    currentRoleId,
    currentRoleName,
    disabled = false,
}: UserRoleSelectorProps) {
    const { currentRestaurant } = useRestaurant()
    const [roles, setRoles] = useState<Role[]>([])
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState(false)

    useEffect(() => {
        async function loadRoles() {
            if (!currentRestaurant) return

            const result: GetRestaurantRolesResult = await getRestaurantRoles(currentRestaurant.id)

            if (result.error) {
                toast.error(result.error)
            } else if (result.roles) {
                // Typage explicite de `r` pour éviter l'erreur TS
                const activeRoles = result.roles.filter((r: Role) => r.isActive)
                setRoles(activeRoles)
            }

            setLoading(false)
        }

        loadRoles()
    }, [currentRestaurant])

    async function handleRoleChange(newRoleId: string) {
        if (!currentRestaurant || updating) return

        setUpdating(true)

        const result = await assignRoleToUser(
            currentRestaurant.id,
            userId,
            newRoleId
        )

        if (result.error) {
            toast.error(result.error)
        } else {
            const newRole = roles.find((r) => r.id === newRoleId)
            toast.success(`Rôle changé en "${newRole?.name}"`)
        }

        setUpdating(false)
    }

    if (loading) {
        return (
            <div className="h-9 w-40 bg-muted animate-pulse rounded-md" />
        )
    }

    if (disabled || roles.length === 0) {
        return (
            <Badge variant="secondary" className="gap-1">
                <Shield className="h-3 w-3" />
                {currentRoleName || 'Rôle inconnu'}
            </Badge>
        )
    }

    return (
        <Select
            value={currentRoleId || undefined}
            onValueChange={handleRoleChange}
            disabled={updating}
        >
            <SelectTrigger className="w-40">
                <SelectValue placeholder="Sélectionner un rôle" />
            </SelectTrigger>
            <SelectContent>
                {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                        <div className="flex items-center gap-2">
                            <Shield className="h-3 w-3" />
                            <span>{role.name}</span>
                            {role.isSystem && (
                                <Badge variant="outline" className="text-xs ml-1">
                                    Défaut
                                </Badge>
                            )}
                        </div>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}
