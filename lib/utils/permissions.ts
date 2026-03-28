import type {SystemRole} from '@/types/auth'


/*************************************************************
 * Liste des emails SuperAdmin (TOI)
 ************************************************************/
export const SUPERADMIN_EMAILS = [
    'franck@superadmin.com',
]

/************************************************************
 * Vérifie si un email est SuperAdmin
 ************************************************************/
export function isSuperAdminEmail(email: string): boolean {
    return SUPERADMIN_EMAILS.includes(email.toLowerCase())
}

/*************************************************************
 * Vérifie si un utilisateur est admin (ou superadmin)
 ************************************************************/
export function isAdmin(role: string | null): boolean {
    if (!role) return false
    return role === 'admin' || role === 'superadmin'
}

/*************************************************************
 * Vérifie si un utilisateur est kitchen
 ************************************************************/
export function isKitchen(role: string | null): boolean {
    if (!role) return false
    return role === 'kitchen'
}

/*************************************************************
 * Vérifie si un utilisateur est superadmin
 ************************************************************/
export function isSuperAdmin(role: string | null): boolean {
    if (!role) return false
    return role === 'superadmin'
}

/*************************************************************
 * Vérifie si un rôle peut accéder à une route
 * Utilise les slugs système (admin, kitchen, cashier, superadmin)
 ************************************************************/
export function canAccessRoute(role: string | null, path: string): boolean {
    if (!role) return false

    // Routes accessibles à tous les rôles authentifiés
    const publicAuthRoutes = ['/dashboard']
    if (publicAuthRoutes.includes(path)) {
        return true
    }

    // Routes SuperAdmin uniquement - VÉRIFIER EN PREMIER
    const superAdminRoutes = ['/superadmin']
    if (superAdminRoutes.some((route) => path.startsWith(route))) {
        return role === 'superadmin'
    }

    // SuperAdmin a accès à tout le reste
    if (role === 'superadmin') {
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
        '/dashboard/users',
        '/dashboard/caisse',
        '/dashboard/warehouse',
        '/dashboard/subscription',
    ]
    if (adminRoutes.some((route) => path.startsWith(route))) {
        return role === 'admin'
    }

    // Routes accessibles aux kitchen et admin
    const kitchenRoutes = ['/dashboard/orders']
    if (kitchenRoutes.some((route) => path.startsWith(route))) {
        return role === 'kitchen' || role === 'admin'
    }

    // Routes caissière + admin
    const cashierRoutes = ['/dashboard/pos']
    if (cashierRoutes.some((route) => path.startsWith(route))) {
        return role === 'cashier' || role === 'admin'
    }

    return false
}

/*************************************************************
 * Badge de rôle (pour affichage UI)
 * Accepte un slug de rôle (string) — compatible ancien et nouveau système
 ************************************************************/
export function getRoleBadge(role: string | SystemRole): {
    label: string
    color: string
} {
    switch (role) {
        case 'superadmin':
            return {
                label: 'Super Admin',
                color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
            }
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
        case 'cashier':
            return {
                label: 'Caissière',
                color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
            }
        default:
            // Rôle personnalisé
            return {
                label: role,
                color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
            }
    }
}
