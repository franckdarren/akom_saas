// lib/actions/roles.ts
'use server'

import {revalidatePath} from 'next/cache'
import {createClient} from '@/lib/supabase/server'
import prisma from '@/lib/prisma'

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
        data: {user},
    } = await supabase.auth.getUser()

    if (!user) return false

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

    const hasDirectPermission = restaurantUser.customRole.permissions.some(
        (rp) =>
            rp.permission.resource === resource &&
            (rp.permission.action === action || rp.permission.action === 'manage')
    )

    return hasDirectPermission
}

// ============================================================
// Récupérer toutes les permissions disponibles
// ✅ Cache mémoire module supprimé — incompatible avec Next.js
//    multi-worker. La table permissions est petite et rarement
//    mise à jour : la requête directe est suffisante.
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
        const supabase = await createClient()
        const {
            data: {user},
        } = await supabase.auth.getUser()

        if (!user) {
            return {error: 'Non authentifié'}
        }

        const hasAccess = await prisma.restaurantUser.findUnique({
            where: {
                userId_restaurantId: {
                    userId: user.id,
                    restaurantId: restaurantId,
                },
            },
            select: {id: true},
        })

        if (!hasAccess) {
            return {error: 'Accès refusé'}
        }

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
            orderBy: [{isSystem: 'desc'}, {name: 'asc'}],
        })

        return {success: true, roles}
    } catch (error) {
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
        const canCreate = await hasPermission(restaurantId, 'roles', 'create')
        if (!canCreate) {
            return {error: "Vous n'avez pas la permission de créer des rôles"}
        }

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
        const canUpdate = await hasPermission(restaurantId, 'roles', 'update')
        if (!canUpdate) {
            return {error: "Vous n'avez pas la permission de modifier des rôles"}
        }

        const existingRole = await prisma.role.findUnique({
            where: {id: roleId, restaurantId},
        })

        if (!existingRole) {
            return {error: 'Rôle introuvable'}
        }

        if (existingRole.isSystem) {
            return {error: 'Les rôles système ne peuvent pas être modifiés'}
        }

        const role = await prisma.$transaction(async (tx) => {
            const updatedRole = await tx.role.update({
                where: {id: roleId},
                data: {
                    name: data.name?.trim(),
                    description: data.description?.trim(),
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
        console.error('Erreur modification rôle:', error)
        return {error: 'Erreur lors de la modification du rôle'}
    }
}

// ============================================================
// Supprimer un rôle personnalisé
// ============================================================

export async function deleteCustomRole(roleId: string, restaurantId: string) {
    try {
        const canDelete = await hasPermission(restaurantId, 'roles', 'delete')
        if (!canDelete) {
            return {error: "Vous n'avez pas la permission de supprimer des rôles"}
        }

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
        const canUpdate = await hasPermission(restaurantId, 'users', 'update')
        if (!canUpdate) {
            return {error: "Vous n'avez pas la permission de modifier les utilisateurs"}
        }

        const role = await prisma.role.findUnique({
            where: {id: roleId, restaurantId},
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

        await prisma.restaurantUser.update({
            where: {id: restaurantUser.id},
            data: {roleId},
        })

        revalidatePath('/dashboard/users')
        return {success: true}
    } catch (error) {
        console.error('Erreur assignation rôle:', error)
        return {error: "Erreur lors de l'assignation du rôle"}
    }
}

// ============================================================
// Récupérer toutes les permissions d'un utilisateur
// ============================================================

export async function getUserPermissions(restaurantId: string) {
    try {
        const supabase = await createClient()
        const {
            data: {user},
        } = await supabase.auth.getUser()

        if (!user) {
            return {permissions: []}
        }

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
            return {permissions: []}
        }

        const permissions = restaurantUser.customRole.permissions.map((rp) => ({
            resource: rp.permission.resource,
            action: rp.permission.action,
            name: rp.permission.name,
        }))

        return {success: true, permissions}
    } catch (error) {
        console.error('Erreur getUserPermissions:', error)
        return {permissions: []}
    }
}