// lib/actions/roles.ts
'use server'

import {revalidatePath} from 'next/cache'
import prisma from '@/lib/prisma'
import {requirePermissionForRestaurant, requireMembershipForRestaurant} from '@/lib/permissions/check'

interface CreateRoleData {
    name: string
    description?: string
    color?: string
    permissionIds: string[]
}

interface UpdateRoleData {
    name?: string
    description?: string
    color?: string
    permissionIds?: string[]
    isActive?: boolean
}

// ============================================================
// Récupérer toutes les permissions disponibles
// ============================================================

export async function getAllPermissions() {
    try {
        const permissions = await prisma.permission.findMany({
            select: {
                id: true,
                resource: true,
                action: true,
                name: true,
                description: true,
                category: true,
            },
            orderBy: [{category: 'asc'}, {name: 'asc'}],
        })

        const grouped = permissions.reduce((acc, perm) => {
            if (!acc[perm.category]) {
                acc[perm.category] = []
            }
            acc[perm.category].push(perm)
            return acc
        }, {} as Record<string, typeof permissions>)

        return {success: true, permissions: grouped}
    } catch (error) {
        console.error('Erreur récupération permissions:', error)
        return {error: 'Erreur lors de la récupération des permissions'}
    }
}

// ============================================================
// Récupérer les rôles d'un restaurant
// ============================================================

export async function getRestaurantRoles(restaurantId: string) {
    try {
        await requirePermissionForRestaurant(restaurantId, 'roles', 'read')

        const roles = await prisma.role.findMany({
            where: {
                restaurantId,
                isActive: true,
            },
            select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                color: true,
                isSystem: true,
                isProtected: true,
                isActive: true,
                permissions: {
                    select: {
                        permission: {
                            select: {
                                id: true,
                                name: true,
                                category: true,
                                resource: true,
                                action: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        restaurantUsers: true,
                    },
                },
            },
            orderBy: [{isSystem: 'desc'}, {name: 'asc'}],
        })

        return {success: true, roles}
    } catch (error) {
        const message = error instanceof Error ? error.message : ''
        if (message === 'Non authentifié' || message === 'Accès refusé' || message === 'Permission refusée') {
            return {error: message}
        }
        console.error('Erreur récupération rôles:', error)
        return {error: 'Erreur lors de la récupération des rôles'}
    }
}

// ============================================================
// Créer un rôle personnalisé
// ============================================================

export async function createCustomRole(
    restaurantId: string,
    data: CreateRoleData
) {
    try {
        await requirePermissionForRestaurant(restaurantId, 'roles', 'create')

        if (!data.name || data.name.trim().length === 0) {
            return {error: 'Le nom du rôle est obligatoire'}
        }

        if (data.permissionIds.length === 0) {
            return {error: 'Vous devez sélectionner au moins une permission'}
        }

        const existingRole = await prisma.role.findUnique({
            where: {
                restaurantId_name: {
                    restaurantId,
                    name: data.name.trim(),
                },
            },
        })

        if (existingRole) {
            return {error: 'Un rôle avec ce nom existe déjà'}
        }

        const role = await prisma.$transaction(async (tx) => {
            const newRole = await tx.role.create({
                data: {
                    restaurantId,
                    name: data.name.trim(),
                    description: data.description?.trim() || null,
                    color: data.color?.trim() || null,
                    isSystem: false,
                    isActive: true,
                },
            })

            await tx.rolePermission.createMany({
                data: data.permissionIds.map((permissionId) => ({
                    roleId: newRole.id,
                    permissionId,
                })),
            })

            return newRole
        })

        revalidatePath('/dashboard/users')
        return {success: true, role}
    } catch (error) {
        const message = error instanceof Error ? error.message : ''
        if (message === 'Permission refusée') {
            return {error: "Vous n'avez pas la permission de créer des rôles"}
        }
        console.error('Erreur création rôle:', error)
        return {error: 'Erreur lors de la création du rôle'}
    }
}

// ============================================================
// Modifier un rôle personnalisé
// ============================================================

export async function updateCustomRole(
    roleId: string,
    restaurantId: string,
    data: UpdateRoleData
) {
    try {
        await requirePermissionForRestaurant(restaurantId, 'roles', 'update')

        const existingRole = await prisma.role.findUnique({
            where: {id: roleId, restaurantId},
        })

        if (!existingRole) {
            return {error: 'Rôle introuvable'}
        }

        if (existingRole.isProtected) {
            return {error: 'Ce rôle protégé ne peut pas être modifié'}
        }

        if (existingRole.isSystem) {
            // Les rôles système non-protégés : on peut modifier couleur et description
            // mais pas le nom ni les permissions
            const role = await prisma.role.update({
                where: {id: roleId},
                data: {
                    description: data.description?.trim(),
                    color: data.color?.trim(),
                },
            })

            revalidatePath('/dashboard/users')
            return {success: true, role}
        }

        const role = await prisma.$transaction(async (tx) => {
            const updatedRole = await tx.role.update({
                where: {id: roleId},
                data: {
                    name: data.name?.trim(),
                    description: data.description?.trim(),
                    color: data.color?.trim(),
                    isActive: data.isActive,
                },
            })

            if (data.permissionIds) {
                await tx.rolePermission.deleteMany({
                    where: {roleId},
                })

                await tx.rolePermission.createMany({
                    data: data.permissionIds.map((permissionId) => ({
                        roleId,
                        permissionId,
                    })),
                })
            }

            return updatedRole
        })

        revalidatePath('/dashboard/users')
        return {success: true, role}
    } catch (error) {
        const message = error instanceof Error ? error.message : ''
        if (message === 'Permission refusée') {
            return {error: "Vous n'avez pas la permission de modifier des rôles"}
        }
        console.error('Erreur modification rôle:', error)
        return {error: 'Erreur lors de la modification du rôle'}
    }
}

// ============================================================
// Supprimer un rôle personnalisé
// ============================================================

export async function deleteCustomRole(roleId: string, restaurantId: string) {
    try {
        await requirePermissionForRestaurant(restaurantId, 'roles', 'delete')

        const existingRole = await prisma.role.findUnique({
            where: {id: roleId, restaurantId},
            include: {
                _count: {
                    select: {restaurantUsers: true},
                },
            },
        })

        if (!existingRole) {
            return {error: 'Rôle introuvable'}
        }

        if (existingRole.isSystem) {
            return {error: 'Les rôles système ne peuvent pas être supprimés'}
        }

        if (existingRole._count.restaurantUsers > 0) {
            return {
                error: `Ce rôle est utilisé par ${existingRole._count.restaurantUsers} utilisateur(s). Veuillez d'abord réassigner ces utilisateurs.`,
            }
        }

        await prisma.role.delete({
            where: {id: roleId},
        })

        revalidatePath('/dashboard/users')
        return {success: true}
    } catch (error) {
        const message = error instanceof Error ? error.message : ''
        if (message === 'Permission refusée') {
            return {error: "Vous n'avez pas la permission de supprimer des rôles"}
        }
        console.error('Erreur suppression rôle:', error)
        return {error: 'Erreur lors de la suppression du rôle'}
    }
}

// ============================================================
// Assigner un rôle à un utilisateur
// ============================================================

export async function assignRoleToUser(
    restaurantId: string,
    userId: string,
    roleId: string
) {
    try {
        await requirePermissionForRestaurant(restaurantId, 'users', 'update')

        const role = await prisma.role.findUnique({
            where: {id: roleId, restaurantId},
            select: {id: true, slug: true},
        })

        if (!role) {
            return {error: 'Rôle introuvable'}
        }

        const restaurantUser = await prisma.restaurantUser.findUnique({
            where: {
                userId_restaurantId: {
                    userId,
                    restaurantId,
                },
            },
        })

        if (!restaurantUser) {
            return {error: 'Utilisateur introuvable dans ce restaurant'}
        }

        // Sync legacy role field
        const legacyRole = (['admin', 'kitchen', 'cashier'] as const).find(r => r === role.slug)

        await prisma.restaurantUser.update({
            where: {id: restaurantUser.id},
            data: {
                roleId,
                ...(legacyRole ? {role: legacyRole} : {}),
            },
        })

        revalidatePath('/dashboard/users')
        return {success: true}
    } catch (error) {
        const message = error instanceof Error ? error.message : ''
        if (message === 'Permission refusée') {
            return {error: "Vous n'avez pas la permission de modifier les utilisateurs"}
        }
        console.error('Erreur assignation rôle:', error)
        return {error: "Erreur lors de l'assignation du rôle"}
    }
}

// ============================================================
// Récupérer toutes les permissions d'un utilisateur
// ============================================================

export async function getUserPermissions(restaurantId: string) {
    try {
        // Cette fonction est appelée par le hook use-permissions côté client.
        // Tout membre du restaurant peut lire ses propres permissions.
        const {userId} = await requireMembershipForRestaurant(restaurantId)

        const restaurantUser = await prisma.restaurantUser.findUnique({
            where: {
                userId_restaurantId: {
                    userId,
                    restaurantId,
                },
            },
            include: {
                customRole: {
                    include: {
                        permissions: {
                            include: {
                                permission: {
                                    select: {
                                        resource: true,
                                        action: true,
                                        name: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        })

        if (!restaurantUser?.customRole) {
            return {permissions: []}
        }

        const permissions = restaurantUser.customRole.permissions.map((rp) => ({
            resource: rp.permission.resource,
            action: rp.permission.action,
            name: rp.permission.name,
        }))

        return {success: true, permissions}
    } catch {
        return {permissions: []}
    }
}
