// lib/hooks/use-restaurant.tsx
'use client'

import {createContext, useContext, useState, useEffect, useCallback, ReactNode} from 'react'
import {getUserRestaurants} from '@/lib/actions/restaurant'
import {isSuperAdmin as checkIsSuperAdmin} from '@/lib/actions/auth'
import type {RestaurantWithRole, SystemRole} from '@/types/auth'

interface RestaurantContextType {
    restaurants: RestaurantWithRole[]
    currentRestaurant: RestaurantWithRole | null
    loading: boolean
    setCurrentRestaurant: (restaurant: RestaurantWithRole) => void
    currentRole: SystemRole | null
    isAdmin: boolean
    isKitchen: boolean
    isSuperAdmin: boolean
    refreshRestaurants: () => Promise<void>
    hasMultipleRestaurants: boolean
    restaurantCount: number
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined)

export function RestaurantProvider({children}: { children: ReactNode }) {
    const [restaurants, setRestaurants]                  = useState<RestaurantWithRole[]>([])
    const [currentRestaurant, setCurrentRestaurantState] = useState<RestaurantWithRole | null>(null)
    const [loading, setLoading]                          = useState(true)
    const [superAdmin, setSuperAdmin]                    = useState(false)

    useEffect(() => {
        loadRestaurants()
        checkSuperAdmin()
    }, [])

    const loadRestaurants = useCallback(async () => {
        setLoading(true)
        try {
            const data = await getUserRestaurants()
            setRestaurants(data)

            if (data.length > 0) {
                const savedId = typeof window !== 'undefined'
                    ? localStorage.getItem('akom_current_restaurant_id')
                    : null

                setCurrentRestaurantState(prev => {
                    if (prev) {
                        // ✅ Après un refresh (ex: post-création d'une nouvelle structure),
                        // on met à jour les données du restaurant courant sans le changer.
                        // Cela évite de switcher involontairement vers data[0].
                        const updated = data.find(r => r.id === prev.id)
                        return updated ?? prev
                    }
                    // Premier chargement : priorité au cookie/localStorage
                    const saved = savedId ? data.find(r => r.id === savedId) : null
                    return saved ?? data[0]
                })
            }
        } catch (error) {
            console.error('Erreur chargement restaurants:', error)
        } finally {
            setLoading(false)
        }
    }, [])

    async function checkSuperAdmin() {
        const result = await checkIsSuperAdmin()
        setSuperAdmin(result)
    }

    function setCurrentRestaurant(restaurant: RestaurantWithRole) {
        setCurrentRestaurantState(restaurant)
        if (typeof window !== 'undefined') {
            localStorage.setItem('akom_current_restaurant_id', restaurant.id)
            // ✅ Sync cookie pour le middleware (lecture server-side)
            document.cookie = `akom_current_restaurant_id=${restaurant.id}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`
        }
    }

    const effectiveRole: SystemRole | null = superAdmin
        ? 'superadmin'
        : (currentRestaurant?.role as SystemRole ?? null)

    return (
        <RestaurantContext.Provider value={{
            restaurants,
            currentRestaurant,
            loading,
            setCurrentRestaurant,
            currentRole: effectiveRole,
            isAdmin: effectiveRole === 'admin' || effectiveRole === 'superadmin',
            isKitchen: effectiveRole === 'kitchen',
            isSuperAdmin: superAdmin,
            refreshRestaurants: loadRestaurants,
            hasMultipleRestaurants: restaurants.length > 1,
            restaurantCount: restaurants.length,
        }}>
            {children}
        </RestaurantContext.Provider>
    )
}

export function useRestaurant() {
    const context = useContext(RestaurantContext)
    if (!context) throw new Error('useRestaurant must be used within RestaurantProvider')
    return context
}