// scripts/init-permissions.ts
// Script de migration : initialise les permissions et rôles système pour
// tous les restaurants existants, et migre les utilisateurs legacy (enum role → roleId).

import 'dotenv/config'
import prisma from '@/lib/prisma'
import {initSystemRolesForRestaurant, ensureSystemPermissions} from '@/lib/permissions/init-system-roles'

async function initializePermissions() {
    console.log('🔐 Initialisation du système de permissions...')

    // 1. Créer / mettre à jour toutes les permissions système
    await ensureSystemPermissions(prisma)
    console.log('✅ Permissions système créées')

    // 2. Créer les rôles système pour chaque restaurant
    const restaurants = await prisma.restaurant.findMany()

    for (const restaurant of restaurants) {
        console.log(`\n📍 Configuration : ${restaurant.name}`)

        const {adminRoleId, kitchenRoleId, cashierRoleId} =
            await initSystemRolesForRestaurant(prisma, restaurant.id)

        // 3. Migrer les utilisateurs existants (enum legacy → roleId)
        const restaurantUsers = await prisma.restaurantUser.findMany({
            where: {restaurantId: restaurant.id},
        })

        let migrated = 0
        for (const ru of restaurantUsers) {
            // Ne pas écraser un roleId déjà assigné
            if (ru.roleId) continue

            let targetRoleId: string
            switch (ru.role) {
                case 'admin':
                    targetRoleId = adminRoleId
                    break
                case 'kitchen':
                    targetRoleId = kitchenRoleId
                    break
                case 'cashier':
                    targetRoleId = cashierRoleId
                    break
                default:
                    // Pas de rôle legacy → assigner Kitchen par défaut
                    targetRoleId = kitchenRoleId
                    break
            }

            await prisma.restaurantUser.update({
                where: {id: ru.id},
                data: {roleId: targetRoleId},
            })
            migrated++
        }

        console.log(`  ✅ Rôles Admin/Cuisine/Caissier créés`)
        console.log(`  ✅ ${migrated}/${restaurantUsers.length} utilisateurs migrés`)
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
