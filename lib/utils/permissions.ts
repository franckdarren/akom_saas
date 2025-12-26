import { PERMISSIONS, type UserRole, type Permission } from '@/types/auth'

/**
 * Vérifie si un rôle a une permission spécifique
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
    return PERMISSIONS[role].includes(permission as any)
}

/**
 * Vérifie si un utilisateur est admin
 */
export function isAdmin(role: UserRole): boolean {
    return role === 'admin'
}

/**
 * Vérifie si un utilisateur est kitchen
 */
export function isKitchen(role: UserRole): boolean {
    return role === 'kitchen'
}

/**
 * Retourne toutes les permissions d'un rôle
 */
export function getRolePermissions(role: UserRole): readonly Permission[] {
    return PERMISSIONS[role]
}

/**
 * Vérifie si un rôle peut accéder à une route
 */
export function canAccessRoute(role: UserRole, path: string): boolean {
    // Routes accessibles à tous les rôles authentifiés
    const publicAuthRoutes = ['/dashboard']

    if (publicAuthRoutes.includes(path)) {
        return true
    }

    // Routes réservées aux admins
    const adminRoutes = [
        '/dashboard/restaurants',
        '/dashboard/menu',
        '/dashboard/tables',
        '/dashboard/stocks',
        '/dashboard/stats',
        '/dashboard/payments',
    ]

    if (adminRoutes.some((route) => path.startsWith(route))) {
        return isAdmin(role)
    }

    // Routes accessibles aux kitchen
    const kitchenRoutes = ['/dashboard/orders']

    if (kitchenRoutes.some((route) => path.startsWith(route))) {
        return true // Admin et Kitchen
    }

    // Par défaut, bloquer l'accès
    return false
}

/**
 * Badge de rôle (pour affichage UI)
 */
export function getRoleBadge(role: UserRole): {
    label: string
    color: string
} {
    switch (role) {
        case 'admin':
            return {
                label: 'Administrateur',
                color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
            }
        case 'kitchen':
            return {
                label: 'Cuisine',
                color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
            }
    }
}