// lib/actions/roles.ts
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { getUserRoleInRestaurant } from './restaurant'

interface CreateRoleData {
    name: string
    description?: string
    permissionIds: string[]
}

interface UpdateRoleData {
    name?: string
    description?: string
    permissionIds?: string[]
    isActive?: boolean
}

// ============================================================
// Vérifier si l'utilisateur a une permission spécifique
// ============================================================

export async function hasPermission(
    restaurantId: string,
    resource: string,
    action: string
): Promise<boolean> {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) return false

    // Récupérer l'utilisateur du restaurant avec son rôle
    const restaurantUser = await prisma.restaurantUser.findUnique({
        where: {
            userId_restaurantId: {
                userId: user.id,
                restaurantId: restaurantId,
            },
        },
        include: {
            customRole: {
                include: {
                    permissions: {
                        include: {
                            permission: true,
                        },
                    },
                },
            },
        },
    })

    if (!restaurantUser?.customRole) return false

    // Vérifier si le rôle a la permission demandée
    const hasDirectPermission = restaurantUser.customRole.permissions.some(
        (rp) =>
            rp.permission.resource === resource &&
            (rp.permission.action === action || rp.permission.action === 'manage')
    )

    return hasDirectPermission
}

// ============================================================
// Récupérer toutes les permissions disponibles
// ============================================================

let permissionsCache: any = null
let cacheTimestamp: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export async function getAllPermissions() {
    try {
        // Vérifier le cache
        const now = Date.now()
        if (permissionsCache && (now - cacheTimestamp) < CACHE_DURATION) {
            return { success: true, permissions: permissionsCache }
        }

        const permissions = await prisma.permission.findMany({
            select: {
                id: true,
                resource: true,
                action: true,
                name: true,
                description: true,
                category: true,
            },
            orderBy: [{ category: 'asc' }, { name: 'asc' }],
        })

        // Regrouper par catégorie
        const grouped = permissions.reduce((acc, perm) => {
            if (!acc[perm.category]) {
                acc[perm.category] = []
            }
            acc[perm.category].push(perm)
            return acc
        }, {} as Record<string, typeof permissions>)

        // Mettre en cache
        permissionsCache = grouped
        cacheTimestamp = now

        return { success: true, permissions: grouped }
    } catch (error) {
        console.error('Erreur récupération permissions:', error)
        return { error: 'Erreur lors de la récupération des permissions' }
    }
}

// ============================================================
// Récupérer les rôles d'un restaurant
// ============================================================

export async function getRestaurantRoles(restaurantId: string) {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return { error: 'Non authentifié' }
        }

        // Vérification simple sans charger toutes les permissions
        const hasAccess = await prisma.restaurantUser.findUnique({
            where: {
                userId_restaurantId: {
                    userId: user.id,
                    restaurantId: restaurantId,
                },
            },
            select: { id: true },
        })

        if (!hasAccess) {
            return { error: 'Accès refusé' }
        }

        // Requête optimisée - on charge uniquement ce qui est nécessaire pour l'affichage
        const roles = await prisma.role.findMany({
            where: {
                restaurantId,
                isActive: true,
            },
            select: {
                id: true,
                name: true,
                description: true,
                isSystem: true,
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
            orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
        })

        return { success: true, roles }
    } catch (error) {
        console.error('Erreur récupération rôles:', error)
        return { error: 'Erreur lors de la récupération des rôles' }
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
        // Vérifier la permission de créer des rôles
        const canCreate = await hasPermission(restaurantId, 'roles', 'create')
        if (!canCreate) {
            return { error: 'Vous n\'avez pas la permission de créer des rôles' }
        }

        // Valider les données
        if (!data.name || data.name.trim().length === 0) {
            return { error: 'Le nom du rôle est obligatoire' }
        }

        if (data.permissionIds.length === 0) {
            return { error: 'Vous devez sélectionner au moins une permission' }
        }

        // Vérifier que le nom n'existe pas déjà
        const existingRole = await prisma.role.findUnique({
            where: {
                restaurantId_name: {
                    restaurantId,
                    name: data.name.trim(),
                },
            },
        })

        if (existingRole) {
            return { error: 'Un rôle avec ce nom existe déjà' }
        }

        // Créer le rôle avec ses permissions dans une transaction
        const role = await prisma.$transaction(async (tx) => {
            // Créer le rôle
            const newRole = await tx.role.create({
                data: {
                    restaurantId,
                    name: data.name.trim(),
                    description: data.description?.trim() || null,
                    isSystem: false,
                    isActive: true,
                },
            })

            // Associer les permissions
            await tx.rolePermission.createMany({
                data: data.permissionIds.map((permissionId) => ({
                    roleId: newRole.id,
                    permissionId,
                })),
            })

            return newRole
        })

        revalidatePath('/dashboard/users')
        return { success: true, role }
    } catch (error) {
        console.error('Erreur création rôle:', error)
        return { error: 'Erreur lors de la création du rôle' }
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
        // Vérifier la permission
        const canUpdate = await hasPermission(restaurantId, 'roles', 'update')
        if (!canUpdate) {
            return { error: 'Vous n\'avez pas la permission de modifier des rôles' }
        }

        // Récupérer le rôle
        const existingRole = await prisma.role.findUnique({
            where: { id: roleId, restaurantId },
        })

        if (!existingRole) {
            return { error: 'Rôle introuvable' }
        }

        // Interdire la modification des rôles système
        if (existingRole.isSystem) {
            return { error: 'Les rôles système ne peuvent pas être modifiés' }
        }

        // Mettre à jour dans une transaction
        const role = await prisma.$transaction(async (tx) => {
            // Mettre à jour le rôle
            const updatedRole = await tx.role.update({
                where: { id: roleId },
                data: {
                    name: data.name?.trim(),
                    description: data.description?.trim(),
                    isActive: data.isActive,
                },
            })

            // Si les permissions ont changé
            if (data.permissionIds) {
                // Supprimer les anciennes permissions
                await tx.rolePermission.deleteMany({
                    where: { roleId },
                })

                // Créer les nouvelles
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
        return { success: true, role }
    } catch (error) {
        console.error('Erreur modification rôle:', error)
        return { error: 'Erreur lors de la modification du rôle' }
    }
}

// ============================================================
// Supprimer un rôle personnalisé
// ============================================================

export async function deleteCustomRole(roleId: string, restaurantId: string) {
    try {
        // Vérifier la permission
        const canDelete = await hasPermission(restaurantId, 'roles', 'delete')
        if (!canDelete) {
            return { error: 'Vous n\'avez pas la permission de supprimer des rôles' }
        }

        // Récupérer le rôle
        const existingRole = await prisma.role.findUnique({
            where: { id: roleId, restaurantId },
            include: {
                _count: {
                    select: {
                        restaurantUsers: true,
                    },
                },
            },
        })

        if (!existingRole) {
            return { error: 'Rôle introuvable' }
        }

        // Interdire la suppression des rôles système
        if (existingRole.isSystem) {
            return { error: 'Les rôles système ne peuvent pas être supprimés' }
        }

        // Vérifier qu'aucun utilisateur n'utilise ce rôle
        if (existingRole._count.restaurantUsers > 0) {
            return {
                error: `Ce rôle est utilisé par ${existingRole._count.restaurantUsers} utilisateur(s). Veuillez d'abord réassigner ces utilisateurs.`,
            }
        }

        // Supprimer le rôle (les permissions seront supprimées en cascade)
        await prisma.role.delete({
            where: { id: roleId },
        })

        revalidatePath('/dashboard/users')
        return { success: true }
    } catch (error) {
        console.error('Erreur suppression rôle:', error)
        return { error: 'Erreur lors de la suppression du rôle' }
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
        // Vérifier la permission
        const canUpdate = await hasPermission(restaurantId, 'users', 'update')
        if (!canUpdate) {
            return { error: 'Vous n\'avez pas la permission de modifier les utilisateurs' }
        }

        // Vérifier que le rôle existe et appartient au restaurant
        const role = await prisma.role.findUnique({
            where: { id: roleId, restaurantId },
        })

        if (!role) {
            return { error: 'Rôle introuvable' }
        }

        // Vérifier que l'utilisateur existe dans le restaurant
        const restaurantUser = await prisma.restaurantUser.findUnique({
            where: {
                userId_restaurantId: {
                    userId,
                    restaurantId,
                },
            },
        })

        if (!restaurantUser) {
            return { error: 'Utilisateur introuvable dans ce restaurant' }
        }

        // Mettre à jour le rôle
        await prisma.restaurantUser.update({
            where: { id: restaurantUser.id },
            data: { roleId },
        })

        revalidatePath('/dashboard/users')
        return { success: true }
    } catch (error) {
        console.error('Erreur assignation rôle:', error)
        return { error: 'Erreur lors de l\'assignation du rôle' }
    }
}

// ============================================================
// Récupère TOUTES les permissions en une seule requête
// ============================================================
export async function getUserPermissions(restaurantId: string) {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return { permissions: [] }
        }

        // Une seule requête pour tout récupérer
        const restaurantUser = await prisma.restaurantUser.findUnique({
            where: {
                userId_restaurantId: {
                    userId: user.id,
                    restaurantId: restaurantId,
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
            return { permissions: [] }
        }

        const permissions = restaurantUser.customRole.permissions.map(
            (rp) => ({
                resource: rp.permission.resource,
                action: rp.permission.action,
                name: rp.permission.name,
            })
        )

        return { success: true, permissions }
    } catch (error) {
        console.error('Erreur getUserPermissions:', error)
        return { permissions: [] }
    }
}