// lib/permissions/init-system-roles.ts
// Fonction réutilisable pour créer les rôles système d'un restaurant.
// Appelée à la création d'un restaurant et par le script d'init global.

import type {PrismaClient} from '@prisma/client'
import type {PermissionResource, PermissionAction} from '@prisma/client'

// ============================================================
// TYPES
// ============================================================

interface PermissionDef {
    resource: PermissionResource
    action: PermissionAction
    name: string
    description: string
    category: string
}

interface SystemRoleDef {
    name: string
    slug: string
    description: string
    color: string
    isProtected: boolean
    permissionFilter: (p: {resource: PermissionResource; action: PermissionAction}) => boolean
}

// ============================================================
// PERMISSIONS SYSTEME
// ============================================================

export const SYSTEM_PERMISSIONS: PermissionDef[] = [
    // Restaurant
    {resource: 'restaurants', action: 'read', name: 'Voir les informations du restaurant', description: 'Permet de consulter les informations du restaurant', category: 'Restaurant'},
    {resource: 'restaurants', action: 'update', name: 'Modifier le restaurant', description: 'Permet de modifier les informations du restaurant (nom, adresse, logo)', category: 'Restaurant'},
    {resource: 'restaurants', action: 'manage', name: 'Gérer complètement le restaurant', description: 'Accès total à la gestion du restaurant', category: 'Restaurant'},

    // Équipe
    {resource: 'users', action: 'read', name: 'Voir les utilisateurs', description: 'Permet de consulter la liste des employés', category: 'Équipe'},
    {resource: 'users', action: 'create', name: 'Inviter des utilisateurs', description: "Permet d'inviter de nouveaux employés", category: 'Équipe'},
    {resource: 'users', action: 'update', name: 'Modifier les utilisateurs', description: 'Permet de modifier les rôles et informations des employés', category: 'Équipe'},
    {resource: 'users', action: 'delete', name: 'Retirer des utilisateurs', description: 'Permet de retirer des employés du restaurant', category: 'Équipe'},

    // Menu
    {resource: 'menu', action: 'read', name: 'Consulter le menu', description: 'Permet de voir les catégories et produits', category: 'Menu'},
    {resource: 'categories', action: 'create', name: 'Créer des catégories', description: 'Permet de créer de nouvelles catégories de produits', category: 'Menu'},
    {resource: 'categories', action: 'update', name: 'Modifier des catégories', description: 'Permet de modifier les catégories existantes', category: 'Menu'},
    {resource: 'categories', action: 'delete', name: 'Supprimer des catégories', description: 'Permet de supprimer des catégories', category: 'Menu'},
    {resource: 'products', action: 'create', name: 'Créer des produits', description: "Permet d'ajouter de nouveaux produits au menu", category: 'Menu'},
    {resource: 'products', action: 'update', name: 'Modifier des produits', description: 'Permet de modifier les produits (prix, description, disponibilité)', category: 'Menu'},
    {resource: 'products', action: 'delete', name: 'Supprimer des produits', description: 'Permet de supprimer des produits du menu', category: 'Menu'},

    // Tables
    {resource: 'tables', action: 'read', name: 'Voir les tables', description: 'Permet de consulter la liste des tables et leurs QR codes', category: 'Tables'},
    {resource: 'tables', action: 'create', name: 'Créer des tables', description: "Permet d'ajouter de nouvelles tables", category: 'Tables'},
    {resource: 'tables', action: 'update', name: 'Modifier des tables', description: 'Permet de modifier les tables (activer/désactiver)', category: 'Tables'},
    {resource: 'tables', action: 'delete', name: 'Supprimer des tables', description: 'Permet de supprimer des tables', category: 'Tables'},

    // Commandes
    {resource: 'orders', action: 'read', name: 'Voir les commandes', description: 'Permet de consulter les commandes', category: 'Commandes'},
    {resource: 'orders', action: 'update', name: 'Gérer les commandes', description: 'Permet de changer le statut des commandes (préparer, servir)', category: 'Commandes'},
    {resource: 'orders', action: 'delete', name: 'Annuler des commandes', description: "Permet d'annuler des commandes", category: 'Commandes'},

    // Stocks
    {resource: 'stocks', action: 'read', name: 'Consulter les stocks', description: 'Permet de voir les quantités en stock', category: 'Stocks'},
    {resource: 'stocks', action: 'update', name: 'Ajuster les stocks', description: 'Permet de modifier les quantités en stock', category: 'Stocks'},
    {resource: 'stocks', action: 'manage', name: 'Gérer complètement les stocks', description: 'Accès total à la gestion des stocks', category: 'Stocks'},

    // Paiements
    {resource: 'payments', action: 'read', name: 'Consulter les paiements', description: "Permet de voir l'historique des paiements", category: 'Paiements'},
    {resource: 'payments', action: 'manage', name: 'Gérer les paiements', description: 'Accès total aux paiements et remboursements', category: 'Paiements'},

    // Statistiques
    {resource: 'stats', action: 'read', name: 'Voir les statistiques', description: 'Permet de consulter les statistiques et rapports', category: 'Statistiques'},

    // Rôles
    {resource: 'roles', action: 'read', name: 'Voir les rôles', description: 'Permet de consulter les rôles existants', category: 'Rôles'},
    {resource: 'roles', action: 'create', name: 'Créer des rôles', description: 'Permet de créer de nouveaux rôles personnalisés', category: 'Rôles'},
    {resource: 'roles', action: 'update', name: 'Modifier des rôles', description: 'Permet de modifier les permissions des rôles personnalisés', category: 'Rôles'},
    {resource: 'roles', action: 'delete', name: 'Supprimer des rôles', description: 'Permet de supprimer des rôles personnalisés', category: 'Rôles'},
]

// ============================================================
// ROLES SYSTEME
// ============================================================

export const SYSTEM_ROLES: SystemRoleDef[] = [
    {
        name: 'Administrateur',
        slug: 'admin',
        description: 'Accès complet à toutes les fonctionnalités',
        color: '#3B82F6', // blue-500
        isProtected: true,
        permissionFilter: () => true, // Toutes les permissions
    },
    {
        name: 'Cuisine',
        slug: 'kitchen',
        description: 'Accès à la gestion des commandes en cuisine',
        color: '#22C55E', // green-500
        isProtected: false,
        permissionFilter: (p) =>
            (p.resource === 'orders' && ['read', 'update'].includes(p.action)) ||
            (p.resource === 'menu' && p.action === 'read') ||
            (p.resource === 'tables' && p.action === 'read'),
    },
    {
        name: 'Caissier',
        slug: 'cashier',
        description: 'Accès au comptoir, commandes et paiements',
        color: '#F97316', // orange-500
        isProtected: false,
        permissionFilter: (p) =>
            (p.resource === 'orders' && ['read', 'update'].includes(p.action)) ||
            (p.resource === 'payments' && ['read', 'manage'].includes(p.action)) ||
            (p.resource === 'menu' && p.action === 'read') ||
            (p.resource === 'tables' && p.action === 'read'),
    },
]

// ============================================================
// INITIALISATION DES PERMISSIONS (globale, une seule fois)
// ============================================================

export async function ensureSystemPermissions(
    prisma: PrismaClient
): Promise<void> {
    for (const perm of SYSTEM_PERMISSIONS) {
        await prisma.permission.upsert({
            where: {
                resource_action: {
                    resource: perm.resource,
                    action: perm.action,
                },
            },
            update: {
                name: perm.name,
                description: perm.description,
                category: perm.category,
            },
            create: {
                resource: perm.resource,
                action: perm.action,
                name: perm.name,
                description: perm.description,
                category: perm.category,
                isSystem: true,
            },
        })
    }
}

// ============================================================
// INITIALISATION DES ROLES SYSTEME POUR UN RESTAURANT
// ============================================================

/**
 * Crée les rôles système (Admin, Cuisine, Caissier) pour un restaurant.
 * Idempotent : utilise upsert, peut être appelée plusieurs fois sans risque.
 * Retourne le rôle Admin pour pouvoir l'assigner immédiatement au créateur.
 */
export async function initSystemRolesForRestaurant(
    prisma: PrismaClient,
    restaurantId: string
): Promise<{adminRoleId: string; kitchenRoleId: string; cashierRoleId: string}> {
    // S'assurer que les permissions système existent
    await ensureSystemPermissions(prisma)

    const allPermissions = await prisma.permission.findMany()

    const roleIds: Record<string, string> = {}

    for (const roleDef of SYSTEM_ROLES) {
        const role = await prisma.role.upsert({
            where: {
                restaurantId_name: {
                    restaurantId,
                    name: roleDef.name,
                },
            },
            update: {
                slug: roleDef.slug,
                color: roleDef.color,
                isProtected: roleDef.isProtected,
            },
            create: {
                restaurantId,
                name: roleDef.name,
                slug: roleDef.slug,
                description: roleDef.description,
                color: roleDef.color,
                isSystem: true,
                isProtected: roleDef.isProtected,
                isActive: true,
            },
        })

        roleIds[roleDef.slug] = role.id

        // Assigner les permissions
        const rolePermissions = allPermissions.filter(roleDef.permissionFilter)
        for (const permission of rolePermissions) {
            await prisma.rolePermission.upsert({
                where: {
                    roleId_permissionId: {
                        roleId: role.id,
                        permissionId: permission.id,
                    },
                },
                update: {},
                create: {
                    roleId: role.id,
                    permissionId: permission.id,
                },
            })
        }
    }

    return {
        adminRoleId: roleIds['admin'],
        kitchenRoleId: roleIds['kitchen'],
        cashierRoleId: roleIds['cashier'],
    }
}

/**
 * Récupère le roleId du rôle Admin pour un restaurant.
 * Utile quand on a besoin du roleId sans init complète.
 */
export async function getAdminRoleId(
    prisma: PrismaClient,
    restaurantId: string
): Promise<string | null> {
    const role = await prisma.role.findFirst({
        where: {restaurantId, slug: 'admin', isSystem: true},
        select: {id: true},
    })
    return role?.id ?? null
}
