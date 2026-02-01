// scripts/init-permissions.ts
import prisma from '@/lib/prisma'

interface PermissionData {
    resource: string
    action: string
    name: string
    description: string
    category: string
}

// Définition de toutes les permissions du système
const SYSTEM_PERMISSIONS: PermissionData[] = [
    // Gestion du restaurant
    {
        resource: 'restaurants',
        action: 'read',
        name: 'Voir les informations du restaurant',
        description: 'Permet de consulter les informations du restaurant',
        category: 'Restaurant',
    },
    {
        resource: 'restaurants',
        action: 'update',
        name: 'Modifier le restaurant',
        description: 'Permet de modifier les informations du restaurant (nom, adresse, logo)',
        category: 'Restaurant',
    },
    {
        resource: 'restaurants',
        action: 'manage',
        name: 'Gérer complètement le restaurant',
        description: 'Accès total à la gestion du restaurant',
        category: 'Restaurant',
    },

    // Gestion des utilisateurs
    {
        resource: 'users',
        action: 'read',
        name: 'Voir les utilisateurs',
        description: 'Permet de consulter la liste des employés',
        category: 'Équipe',
    },
    {
        resource: 'users',
        action: 'create',
        name: 'Inviter des utilisateurs',
        description: 'Permet d\'inviter de nouveaux employés',
        category: 'Équipe',
    },
    {
        resource: 'users',
        action: 'update',
        name: 'Modifier les utilisateurs',
        description: 'Permet de modifier les rôles et informations des employés',
        category: 'Équipe',
    },
    {
        resource: 'users',
        action: 'delete',
        name: 'Retirer des utilisateurs',
        description: 'Permet de retirer des employés du restaurant',
        category: 'Équipe',
    },

    // Gestion du menu
    {
        resource: 'menu',
        action: 'read',
        name: 'Consulter le menu',
        description: 'Permet de voir les catégories et produits',
        category: 'Menu',
    },
    {
        resource: 'categories',
        action: 'create',
        name: 'Créer des catégories',
        description: 'Permet de créer de nouvelles catégories de produits',
        category: 'Menu',
    },
    {
        resource: 'categories',
        action: 'update',
        name: 'Modifier des catégories',
        description: 'Permet de modifier les catégories existantes',
        category: 'Menu',
    },
    {
        resource: 'categories',
        action: 'delete',
        name: 'Supprimer des catégories',
        description: 'Permet de supprimer des catégories',
        category: 'Menu',
    },
    {
        resource: 'products',
        action: 'create',
        name: 'Créer des produits',
        description: 'Permet d\'ajouter de nouveaux produits au menu',
        category: 'Menu',
    },
    {
        resource: 'products',
        action: 'update',
        name: 'Modifier des produits',
        description: 'Permet de modifier les produits (prix, description, disponibilité)',
        category: 'Menu',
    },
    {
        resource: 'products',
        action: 'delete',
        name: 'Supprimer des produits',
        description: 'Permet de supprimer des produits du menu',
        category: 'Menu',
    },

    // Gestion des tables
    {
        resource: 'tables',
        action: 'read',
        name: 'Voir les tables',
        description: 'Permet de consulter la liste des tables et leurs QR codes',
        category: 'Tables',
    },
    {
        resource: 'tables',
        action: 'create',
        name: 'Créer des tables',
        description: 'Permet d\'ajouter de nouvelles tables',
        category: 'Tables',
    },
    {
        resource: 'tables',
        action: 'update',
        name: 'Modifier des tables',
        description: 'Permet de modifier les tables (activer/désactiver)',
        category: 'Tables',
    },
    {
        resource: 'tables',
        action: 'delete',
        name: 'Supprimer des tables',
        description: 'Permet de supprimer des tables',
        category: 'Tables',
    },

    // Gestion des commandes
    {
        resource: 'orders',
        action: 'read',
        name: 'Voir les commandes',
        description: 'Permet de consulter les commandes',
        category: 'Commandes',
    },
    {
        resource: 'orders',
        action: 'update',
        name: 'Gérer les commandes',
        description: 'Permet de changer le statut des commandes (préparer, servir)',
        category: 'Commandes',
    },
    {
        resource: 'orders',
        action: 'delete',
        name: 'Annuler des commandes',
        description: 'Permet d\'annuler des commandes',
        category: 'Commandes',
    },

    // Gestion des stocks
    {
        resource: 'stocks',
        action: 'read',
        name: 'Consulter les stocks',
        description: 'Permet de voir les quantités en stock',
        category: 'Stocks',
    },
    {
        resource: 'stocks',
        action: 'update',
        name: 'Ajuster les stocks',
        description: 'Permet de modifier les quantités en stock',
        category: 'Stocks',
    },
    {
        resource: 'stocks',
        action: 'manage',
        name: 'Gérer complètement les stocks',
        description: 'Accès total à la gestion des stocks',
        category: 'Stocks',
    },

    // Gestion des paiements
    {
        resource: 'payments',
        action: 'read',
        name: 'Consulter les paiements',
        description: 'Permet de voir l\'historique des paiements',
        category: 'Paiements',
    },
    {
        resource: 'payments',
        action: 'manage',
        name: 'Gérer les paiements',
        description: 'Accès total aux paiements et remboursements',
        category: 'Paiements',
    },

    // Statistiques
    {
        resource: 'stats',
        action: 'read',
        name: 'Voir les statistiques',
        description: 'Permet de consulter les statistiques et rapports',
        category: 'Statistiques',
    },

    // Gestion des rôles
    {
        resource: 'roles',
        action: 'read',
        name: 'Voir les rôles',
        description: 'Permet de consulter les rôles existants',
        category: 'Rôles',
    },
    {
        resource: 'roles',
        action: 'create',
        name: 'Créer des rôles',
        description: 'Permet de créer de nouveaux rôles personnalisés',
        category: 'Rôles',
    },
    {
        resource: 'roles',
        action: 'update',
        name: 'Modifier des rôles',
        description: 'Permet de modifier les permissions des rôles personnalisés',
        category: 'Rôles',
    },
    {
        resource: 'roles',
        action: 'delete',
        name: 'Supprimer des rôles',
        description: 'Permet de supprimer des rôles personnalisés',
        category: 'Rôles',
    },
]

async function initializePermissions() {
    console.log('🔐 Initialisation du système de permissions...')

    // Créer toutes les permissions système
    for (const perm of SYSTEM_PERMISSIONS) {
        await prisma.permission.upsert({
            where: {
                resource_action: {
                    resource: perm.resource as any,
                    action: perm.action as any,
                },
            },
            update: {
                name: perm.name,
                description: perm.description,
                category: perm.category,
            },
            create: {
                resource: perm.resource as any,
                action: perm.action as any,
                name: perm.name,
                description: perm.description,
                category: perm.category,
                isSystem: true,
            },
        })
    }

    console.log(`✅ ${SYSTEM_PERMISSIONS.length} permissions créées`)

    // Récupérer toutes les permissions pour les associer aux rôles
    const allPermissions = await prisma.permission.findMany()

    // Permissions pour le rôle Admin
    const adminPermissions = allPermissions.filter(
        (p) =>
            // L'admin a toutes les permissions
            true
    )

    // Permissions pour le rôle Kitchen
    const kitchenPermissions = allPermissions.filter(
        (p) =>
            // Kitchen peut voir et gérer les commandes
            (p.resource === 'orders' && ['read', 'update'].includes(p.action)) ||
            // Kitchen peut voir le menu
            (p.resource === 'menu' && p.action === 'read') ||
            // Kitchen peut voir les tables
            (p.resource === 'tables' && p.action === 'read')
    )

    // Créer les rôles système pour chaque restaurant
    const restaurants = await prisma.restaurant.findMany()

    for (const restaurant of restaurants) {
        console.log(`\n📍 Configuration du restaurant: ${restaurant.name}`)

        // Créer le rôle Admin
        const adminRole = await prisma.role.upsert({
            where: {
                restaurantId_name: {
                    restaurantId: restaurant.id,
                    name: 'Administrateur',
                },
            },
            update: {},
            create: {
                restaurantId: restaurant.id,
                name: 'Administrateur',
                description: 'Accès complet à toutes les fonctionnalités du restaurant',
                isSystem: true,
                isActive: true,
            },
        })

        // Associer toutes les permissions au rôle Admin
        for (const permission of adminPermissions) {
            await prisma.rolePermission.upsert({
                where: {
                    roleId_permissionId: {
                        roleId: adminRole.id,
                        permissionId: permission.id,
                    },
                },
                update: {},
                create: {
                    roleId: adminRole.id,
                    permissionId: permission.id,
                },
            })
        }

        // Créer le rôle Kitchen
        const kitchenRole = await prisma.role.upsert({
            where: {
                restaurantId_name: {
                    restaurantId: restaurant.id,
                    name: 'Cuisine',
                },
            },
            update: {},
            create: {
                restaurantId: restaurant.id,
                name: 'Cuisine',
                description: 'Accès à la gestion des commandes en cuisine',
                isSystem: true,
                isActive: true,
            },
        })

        // Associer les permissions Kitchen
        for (const permission of kitchenPermissions) {
            await prisma.rolePermission.upsert({
                where: {
                    roleId_permissionId: {
                        roleId: kitchenRole.id,
                        permissionId: permission.id,
                    },
                },
                update: {},
                create: {
                    roleId: kitchenRole.id,
                    permissionId: permission.id,
                },
            })
        }

        // Migrer les utilisateurs existants vers le nouveau système
        const restaurantUsers = await prisma.restaurantUser.findMany({
            where: { restaurantId: restaurant.id },
        })

        for (const ru of restaurantUsers) {
            const targetRole = ru.role === 'admin' ? adminRole : kitchenRole
            await prisma.restaurantUser.update({
                where: { id: ru.id },
                data: { roleId: targetRole.id },
            })
        }

        console.log(`  ✅ Rôle Admin créé avec ${adminPermissions.length} permissions`)
        console.log(`  ✅ Rôle Kitchen créé avec ${kitchenPermissions.length} permissions`)
        console.log(`  ✅ ${restaurantUsers.length} utilisateurs migrés`)
    }

    console.log('\n🎉 Initialisation terminée avec succès!')
}

initializePermissions()
    .catch((error) => {
        console.error('❌ Erreur lors de l\'initialisation:', error)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })