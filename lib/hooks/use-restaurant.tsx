// lib/hooks/use-restaurant.tsx
'use client'

import {createContext, useContext, useState, useEffect, ReactNode} from 'react'
import {getUserRestaurants} from '@/lib/actions/restaurant'
import {getRestaurantPlan} from '@/lib/services/subscription-checker' // ← NOUVEAU
import {isSuperAdmin as checkIsSuperAdmin} from '@/lib/actions/auth'
import type {RestaurantWithRole, SystemRole} from '@/types/auth'
import type {SubscriptionPlan} from '@/types/subscription' // ← NOUVEAU

interface RestaurantContextType {
    restaurants: RestaurantWithRole[]
    currentRestaurant: RestaurantWithRole | null
    currentPlan: SubscriptionPlan | null // ← NOUVEAU
    loading: boolean
    setCurrentRestaurant: (restaurant: RestaurantWithRole) => void
    currentRole: SystemRole | null
    isAdmin: boolean
    isKitchen: boolean
    isSuperAdmin: boolean
    refreshRestaurants: () => Promise<void>
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(
    undefined
)

export function RestaurantProvider({children}: { children: ReactNode }) {
    const [restaurants, setRestaurants] = useState<RestaurantWithRole[]>([])
    const [currentRestaurant, setCurrentRestaurant] =
        useState<RestaurantWithRole | null>(null)
    const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan | null>(null) // ← NOUVEAU
    const [loading, setLoading] = useState(true)
    const [superAdmin, setSuperAdmin] = useState(false)

    // Charger les restaurants au montage
    useEffect(() => {
        loadRestaurants()
        checkSuperAdmin()
    }, [])

    // ✅ NOUVEAU : Charger le plan quand le restaurant change
    useEffect(() => {
        async function loadPlan() {
            if (!currentRestaurant) {
                setCurrentPlan(null)
                return
            }

            const plan = await getRestaurantPlan(currentRestaurant.id)
            setCurrentPlan(plan)
        }

        loadPlan()
    }, [currentRestaurant])

    async function loadRestaurants() {
        setLoading(true)
        try {
            const data = await getUserRestaurants()
            setRestaurants(data)

            if (data.length > 0 && !currentRestaurant) {
                const savedRestaurantId = localStorage.getItem('currentRestaurantId')
                const restaurant = savedRestaurantId
                    ? data.find((r) => r.id === savedRestaurantId) || data[0]
                    : data[0]
                setCurrentRestaurant(restaurant)
            }
        } catch (error) {
            console.error('Erreur lors du chargement des restaurants:', error)
        } finally {
            setLoading(false)
        }
    }

    async function checkSuperAdmin() {
        const result = await checkIsSuperAdmin()
        setSuperAdmin(result)
    }

    function handleSetCurrentRestaurant(restaurant: RestaurantWithRole) {
        setCurrentRestaurant(restaurant)
        localStorage.setItem('currentRestaurantId', restaurant.id)
    }

    const effectiveRole: SystemRole | null = superAdmin
        ? 'superadmin'
        : currentRestaurant?.role || null

    const value: RestaurantContextType = {
        restaurants,
        currentRestaurant,
        currentPlan, // ← NOUVEAU
        loading,
        setCurrentRestaurant: handleSetCurrentRestaurant,
        currentRole: effectiveRole,
        isAdmin: effectiveRole === 'admin' || effectiveRole === 'superadmin',
        isKitchen: effectiveRole === 'kitchen',
        isSuperAdmin: superAdmin,
        refreshRestaurants: loadRestaurants,
    }

    return (
        <RestaurantContext.Provider value={value}>
            {children}
        </RestaurantContext.Provider>
    )
}

export function useRestaurant() {
    const context = useContext(RestaurantContext)
    if (context === undefined) {
        throw new Error('useRestaurant must be used within a RestaurantProvider')
    }
    return context
}