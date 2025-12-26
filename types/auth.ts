import type { User } from '@supabase/supabase-js'

// Rôles utilisateur
export type UserRole = 'admin' | 'kitchen'

// Utilisateur avec ses restaurants
export interface UserWithRestaurants extends User {
    restaurants?: RestaurantWithRole[]
}

// Restaurant avec le rôle de l'utilisateur
export interface RestaurantWithRole {
    id: string
    name: string
    slug: string
    role: UserRole
    isActive: boolean
}

// Context du restaurant actuel
export interface RestaurantContext {
    restaurantId: string
    role: UserRole
    userId: string
}

// Permissions par rôle
export const PERMISSIONS = {
    admin: [
        'manage_restaurant',
        'manage_menu',
        'manage_tables',
        'manage_stocks',
        'manage_orders',
        'view_stats',
        'manage_users',
        'manage_payments',
    ],
    kitchen: [
        'manage_orders', // Uniquement les commandes
        'view_menu',     // Consulter le menu (lecture seule)
    ],
} as const

export type Permission = typeof PERMISSIONS[UserRole][number]