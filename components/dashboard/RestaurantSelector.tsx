'use client'

import { useRestaurant } from '@/lib/hooks/use-restaurant'
import { getRoleBadge } from '@/lib/utils/permissions'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

export function RestaurantSelector() {
    const { restaurants, currentRestaurant, setCurrentRestaurant, loading } =
        useRestaurant()

    if (loading) {
        return (
            <div className="w-64 h-10 bg-zinc-200 dark:bg-zinc-700 animate-pulse rounded-md" />
        )
    }

    if (restaurants.length === 0) {
        return (
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
                Aucun restaurant
            </div>
        )
    }

    return (
        <div className="flex items-center gap-3">
            <Select
                value={currentRestaurant?.id}
                onValueChange={(value) => {
                    const restaurant = restaurants.find((r) => r.id === value)
                    if (restaurant) {
                        setCurrentRestaurant(restaurant)
                    }
                }}
            >
                <SelectTrigger className="w-64">
                    <SelectValue placeholder="Sélectionner un restaurant" />
                </SelectTrigger>
                <SelectContent>
                    {restaurants.map((restaurant) => (
                        <SelectItem key={restaurant.id} value={restaurant.id}>
                            <div className="flex items-center justify-between gap-3">
                                <span>{restaurant.name}</span>
                                <span
                                    className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadge(restaurant.role).color
                                        }`}
                                >
                                    {getRoleBadge(restaurant.role).label}
                                </span>
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {currentRestaurant && (
                <span
                    className={`text-xs px-2 py-1 rounded-full ${getRoleBadge(currentRestaurant.role).color
                        }`}
                >
                    {getRoleBadge(currentRestaurant.role).label}
                </span>
            )}
        </div>
    )
}