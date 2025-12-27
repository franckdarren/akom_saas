import type { User } from '@supabase/supabase-js'

// Rôles utilisateur
export type UserRole = 'admin' | 'kitchen'
export type SystemRole = 'superadmin' | UserRole

// Utilisateur avec ses restaurants
export interface UserWithRestaurants extends User {
    restaurants?: RestaurantWithRole[]
    isSuperAdmin?: boolean
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
    superadmin: [
        'view_all_restaurants',
        'view_platform_stats',
        'manage_all_restaurants',
        'view_all_orders',
        'access_support_tools',
    ] as const,
    admin: [
        'manage_restaurant',
        'manage_menu',
        'manage_tables',
        'manage_stocks',
        'manage_orders',
        'view_stats',
        'manage_users',
        'manage_payments',
    ] as const,
    kitchen: [
        'manage_orders',
        'view_menu',
    ] as const,
}

// Type pour les permissions individuelles
export type SuperAdminPermission = typeof PERMISSIONS.superadmin[number]
export type AdminPermission = typeof PERMISSIONS.admin[number]
export type KitchenPermission = typeof PERMISSIONS.kitchen[number]

// Union de toutes les permissions possibles
export type Permission = SuperAdminPermission | AdminPermission | KitchenPermission