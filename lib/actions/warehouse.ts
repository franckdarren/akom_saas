'use server'

import { getCurrentUserAndRestaurant } from '@/lib/auth/session'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// ============================================================
// Action 1 : Créer un produit d'entrepôt
// ============================================================

export async function createWarehouseProduct(data: {
    name: string
    sku?: string
    description?: string
    storageUnit: string
    unitsPerStorage: number
    category?: string
    imageUrl?: string
    linkedProductId?: string
    conversionRatio?: number
    initialQuantity?: number
    alertThreshold?: number
    unitCost?: number
}) {
    try {
        const { restaurantId, userId } = await getCurrentUserAndRestaurant()

        if (data.linkedProductId) {
            const linkedProduct = await prisma.product.findFirst({
                where: {
                    id: data.linkedProductId,
                    restaurantId,
                },
            })

            if (!linkedProduct) {
                return { error: 'Produit menu introuvable ou non autorisé' }
            }
        }

        const warehouseProduct = await prisma.$transaction(async (tx) => {
            const product = await tx.warehouseProduct.create({
                data: {
                    restaurantId,
                    name: data.name,
                    sku: data.sku,
                    description: data.description,
                    storageUnit: data.storageUnit,
                    unitsPerStorage: data.unitsPerStorage,
                    category: data.category,
                    imageUrl: data.imageUrl,
                    linkedProductId: data.linkedProductId,
                    conversionRatio: data.conversionRatio || 1,
                },
            })

            await tx.warehouseStock.create({
                data: {
                    restaurantId,
                    warehouseProductId: product.id,
                    quantity: data.initialQuantity || 0,
                    unitCost: data.unitCost,
                    alertThreshold: data.alertThreshold ?? 10,
                },
            })

            if (data.initialQuantity && data.initialQuantity > 0) {
                await tx.warehouseMovement.create({
                    data: {
                        restaurantId,
                        warehouseProductId: product.id,
                        movementType: 'entry',
                        quantity: data.initialQuantity,
                        previousQty: 0,
                        newQty: data.initialQuantity,
                        performedBy: userId,
                        reason: 'Stock initial',
                    },
                })
            }

            return product
        })

        revalidatePath('/dashboard/warehouse')
        return { success: true, product: warehouseProduct }
    } catch (error) {
        console.error('Erreur création produit entrepôt:', error)
        return { error: 'Erreur lors de la création du produit' }
    }
}

// ============================================================
// Action 2 : Entrée de stock (réception fournisseur)
// ============================================================

export async function warehouseStockEntry(data: {
    warehouseProductId: string
    quantity: number
    supplierName?: string
    invoiceReference?: string
    unitCost?: number
    notes?: string
}) {
    try {
        const { restaurantId, userId } = await getCurrentUserAndRestaurant()

        if (data.quantity <= 0) {
            return { error: 'La quantité doit être positive' }
        }

        await prisma.$transaction(async (tx) => {
            const currentStock = await tx.warehouseStock.findUnique({
                where: {
                    restaurantId_warehouseProductId: {
                        restaurantId,
                        warehouseProductId: data.warehouseProductId,
                    },
                },
            })

            if (!currentStock) {
                throw new Error('Stock introuvable')
            }

            const previousQty = Number(currentStock.quantity)
            const newQty = previousQty + data.quantity

            await tx.warehouseStock.update({
                where: {
                    id: currentStock.id,
                },
                data: {
                    quantity: newQty,
                    unitCost: data.unitCost ?? currentStock.unitCost,
                    updatedAt: new Date(),
                },
            })

            await tx.warehouseMovement.create({
                data: {
                    restaurantId,
                    warehouseProductId: data.warehouseProductId,
                    movementType: 'entry',
                    quantity: data.quantity,
                    previousQty,
                    newQty,
                    supplierName: data.supplierName,
                    invoiceReference: data.invoiceReference,
                    performedBy: userId,
                    notes: data.notes,
                },
            })
        })

        revalidatePath('/dashboard/warehouse')
        return { success: true }
    } catch (error) {
        console.error('Erreur entrée stock:', error)
        return { error: 'Erreur lors de l\'entrée de stock' }
    }
}

// ============================================================
// Action 3 : TRANSFERT VERS STOCK OPÉRATIONNEL (action clé)
// ============================================================

export async function transferWarehouseToOps(data: {
    warehouseProductId: string
    warehouseQuantity: number
    opsProductId: string
    notes?: string
}) {
    try {
        const { restaurantId, userId } = await getCurrentUserAndRestaurant()

        if (data.warehouseQuantity <= 0) {
            return { error: 'La quantité doit être positive' }
        }

        const result = await prisma.$transaction(async (tx) => {
            const warehouseProduct = await tx.warehouseProduct.findUnique({
                where: { id: data.warehouseProductId },
                include: {
                    stock: {
                        where: { restaurantId },
                    },
                },
            })

            if (!warehouseProduct || warehouseProduct.restaurantId !== restaurantId) {
                throw new Error('Produit entrepôt introuvable')
            }

            const warehouseStock = warehouseProduct.stock[0]
            if (!warehouseStock) {
                throw new Error('Stock entrepôt introuvable')
            }

            const warehouseStockQty = Number(warehouseStock.quantity)

            if (warehouseStockQty < data.warehouseQuantity) {
                throw new Error('Stock entrepôt insuffisant')
            }

            const opsProduct = await tx.product.findUnique({
                where: { id: data.opsProductId },
                include: {
                    stock: {
                        where: { restaurantId },
                    },
                },
            })

            if (!opsProduct || opsProduct.restaurantId !== restaurantId) {
                throw new Error('Produit opérationnel introuvable')
            }

            const opsStock = opsProduct.stock

            if (!opsStock) {
                throw new Error('Stock opérationnel introuvable')
            }

            const conversionRatio = Number(warehouseProduct.conversionRatio) || 1
            const opsQuantityToAdd = data.warehouseQuantity * conversionRatio
            const opsStockQty = Number(opsStock.quantity)

            const newWarehouseQty = warehouseStockQty - data.warehouseQuantity
            await tx.warehouseStock.update({
                where: { id: warehouseStock.id },
                data: {
                    quantity: newWarehouseQty,
                    updatedAt: new Date(),
                },
            })

            const newOpsQty = opsStockQty + opsQuantityToAdd
            await tx.stock.update({
                where: { id: opsStock.id },
                data: {
                    quantity: newOpsQty,
                    updatedAt: new Date(),
                },
            })

            await tx.warehouseMovement.create({
                data: {
                    restaurantId,
                    warehouseProductId: data.warehouseProductId,
                    movementType: 'transfer_to_ops',
                    quantity: -data.warehouseQuantity,
                    previousQty: warehouseStockQty,
                    newQty: newWarehouseQty,
                    destination: `Stock opérationnel (${opsProduct.name})`,
                    performedBy: userId,
                    notes: data.notes,
                },
            })

            await tx.stockMovement.create({
                data: {
                    restaurantId,
                    productId: data.opsProductId,
                    type: 'adjustment',
                    quantity: opsQuantityToAdd,
                    previousQty: opsStockQty,
                    newQty: newOpsQty,
                    reason: `Transfert depuis magasin (${warehouseProduct.name})`,
                    userId,
                },
            })

            await tx.warehouseToOpsTransfer.create({
                data: {
                    restaurantId,
                    warehouseProductId: data.warehouseProductId,
                    warehouseQuantity: data.warehouseQuantity,
                    opsProductId: data.opsProductId,
                    opsQuantity: opsQuantityToAdd,
                    conversionRatio,
                    transferredBy: userId,
                    notes: data.notes,
                },
            })

            if (!opsProduct.isAvailable && newOpsQty > 0) {
                await tx.product.update({
                    where: { id: data.opsProductId },
                    data: { isAvailable: true },
                })
            }

            return {
                warehouseProduct: warehouseProduct.name,
                opsProduct: opsProduct.name,
                warehouseQty: data.warehouseQuantity,
                opsQty: opsQuantityToAdd,
                conversionRatio,
            }
        })

        revalidatePath('/dashboard/warehouse')
        revalidatePath('/dashboard/stocks')
        revalidatePath('/dashboard/menu/products')

        return { success: true, transfer: result }
    } catch (error) {
        console.error('Erreur transfert:', error)
        return {
            error: error instanceof Error ? error.message : 'Erreur lors du transfert'
        }
    }
}

// ============================================================
// Action 4 : Ajustement inventaire entrepôt
// ============================================================

export async function adjustWarehouseStock(data: {
    warehouseProductId: string
    newQuantity: number
    reason: string
}) {
    try {
        const { restaurantId, userId } = await getCurrentUserAndRestaurant()

        if (data.newQuantity < 0) {
            return { error: 'La quantité ne peut pas être négative' }
        }

        await prisma.$transaction(async (tx) => {
            const currentStock = await tx.warehouseStock.findUnique({
                where: {
                    restaurantId_warehouseProductId: {
                        restaurantId,
                        warehouseProductId: data.warehouseProductId,
                    },
                },
            })

            if (!currentStock) {
                throw new Error('Stock introuvable')
            }

            const previousQty = Number(currentStock.quantity)
            const difference = data.newQuantity - previousQty

            await tx.warehouseStock.update({
                where: { id: currentStock.id },
                data: {
                    quantity: data.newQuantity,
                    lastInventoryDate: new Date(),
                    updatedAt: new Date(),
                },
            })

            await tx.warehouseMovement.create({
                data: {
                    restaurantId,
                    warehouseProductId: data.warehouseProductId,
                    movementType: 'adjustment',
                    quantity: difference,
                    previousQty,
                    newQty: data.newQuantity,
                    reason: data.reason,
                    performedBy: userId,
                },
            })
        })

        revalidatePath('/dashboard/warehouse')
        return { success: true }
    } catch (error) {
        console.error('Erreur ajustement:', error)
        return { error: 'Erreur lors de l\'ajustement' }
    }
}

// ============================================================
// Action 5 : Récupérer les statistiques globales du warehouse
// ============================================================

export async function getWarehouseStats() {
    try {
        const { restaurantId } = await getCurrentUserAndRestaurant()

        const products = await prisma.warehouseProduct.findMany({
            where: {
                restaurantId,
                isActive: true,
            },
            include: {
                stock: true,
            },
        })

        const stats = {
            totalProducts: products.length,
            totalValue: products.reduce((sum, product) => {
                const stock = product.stock[0]
                if (!stock || !stock.unitCost) return sum
                return sum + (Number(stock.quantity) * Number(stock.unitCost))
            }, 0),
            lowStockCount: products.filter(product => {
                const stock = product.stock[0]
                if (!stock) return false
                return Number(stock.quantity) < Number(stock.alertThreshold)
            }).length,
            averageStockValue: 0,
            lastInventoryDate: products.reduce((latest, product) => {
                const stock = product.stock[0]
                if (!stock?.lastInventoryDate) return latest
                if (!latest || stock.lastInventoryDate > latest) {
                    return stock.lastInventoryDate
                }
                return latest
            }, null as Date | null),
        }

        stats.averageStockValue = stats.totalProducts > 0
            ? stats.totalValue / stats.totalProducts
            : 0

        return { success: true, data: stats }
    } catch (error) {
        console.error('Erreur récupération stats:', error)
        return { error: 'Erreur lors de la récupération des statistiques' }
    }
}

// ============================================================
// Action 6 : Récupérer la liste des produits avec filtres
// ============================================================

export async function getWarehouseProducts(filters?: {
    category?: string
    storageUnit?: string
    lowStockOnly?: boolean
    linkedOnly?: boolean
    search?: string
}) {
    try {
        const { restaurantId } = await getCurrentUserAndRestaurant()

        const whereConditions: any = {
            restaurantId,
            isActive: true,
        }

        if (filters?.category) whereConditions.category = filters.category
        if (filters?.storageUnit) whereConditions.storageUnit = filters.storageUnit
        if (filters?.linkedOnly) whereConditions.linkedProductId = { not: null }
        if (filters?.search) {
            whereConditions.OR = [
                { name: { contains: filters.search, mode: 'insensitive' } },
                { sku: { contains: filters.search, mode: 'insensitive' } },
            ]
        }

        const products = await prisma.warehouseProduct.findMany({
            where: whereConditions,
            include: {
                stock: true,
                linkedProduct: { include: { stock: true } },
            },
            orderBy: { name: 'asc' },
        })

        const transformedProducts = products.map(product => {
            const stock = product.stock[0]

            return {
                ...product,
                stock: stock
                    ? {
                        ...stock,
                        quantity: Number(stock.quantity),
                        alertThreshold: Number(stock.alertThreshold),
                        unitCost: stock.unitCost !== null ? Number(stock.unitCost) : null,
                    }
                    : undefined,
                isLowStock: stock ? Number(stock.quantity) < Number(stock.alertThreshold) : false,
                linkedProduct: product.linkedProduct
                    ? {
                        id: product.linkedProduct.id,
                        name: product.linkedProduct.name,
                        imageUrl: product.linkedProduct.imageUrl,
                        currentStock: product.linkedProduct.stock
                            ? Number(product.linkedProduct.stock.quantity)
                            : 0,
                    }
                    : undefined,
            }
        })

        const finalProducts = filters?.lowStockOnly
            ? transformedProducts.filter(p => p.isLowStock)
            : transformedProducts

        return { success: true, data: finalProducts }
    } catch (error) {
        console.error('Erreur récupération produits:', error)
        return { error: 'Erreur lors de la récupération des produits' }
    }
}

// ============================================================
// Action 7 : Récupérer un produit spécifique avec son historique
// ============================================================

/**
 * Interface définissant exactement la structure des données retournées par getWarehouseProductById.
 * Cette interface garantit la cohérence entre ce que la fonction retourne et ce que les composants attendent.
 * Tous les types Decimal de Prisma sont convertis en number, et toutes les dates en ISO strings.
 */
interface WarehouseProductDetail {
    id: string
    restaurantId: string
    name: string
    sku: string | null
    description: string | null
    storageUnit: string
    unitsPerStorage: number
    category: string | null
    imageUrl: string | null
    linkedProductId: string | null
    conversionRatio: number
    notes: string | null
    isActive: boolean
    createdAt: string | null
    updatedAt: string | null
    stock?: {
        id: string
        restaurantId: string
        warehouseProductId: string
        quantity: number
        alertThreshold: number
        unitCost: number | null
        lastInventoryDate: string | null
        updatedAt: string
    }
    isLowStock: boolean
    linkedProduct?: {
        id: string
        name: string
        imageUrl: string | null
        currentStock: number
        stock?: Array<{
            quantity: number
            alertThreshold: number
            unitCost: number | null
            lastInventoryDate: string | null
            updatedAt: string
        }>
    }
    movements: Array<{
        id: string
        restaurantId: string
        warehouseProductId: string
        movementType: 'entry' | 'exit' | 'transfer_to_ops' | 'adjustment' | 'loss'
        quantity: number
        previousQty: number
        newQty: number
        supplierName: string | null
        invoiceReference: string | null
        destination: string | null
        reason: string | null
        performedBy: string | null
        notes: string | null
        createdAt: string | null
    }>
}

/**
 * Fonction qui récupère un produit d'entrepôt complet avec son stock, ses mouvements,
 * et son produit menu lié le cas échéant. Cette fonction effectue plusieurs transformations
 * importantes pour rendre les données compatibles avec le frontend :
 *
 * 1. Conversion des types Decimal de PostgreSQL en nombres JavaScript standards
 * 2. Sérialisation des dates en ISO strings pour la transmission client-serveur
 * 3. Typage correct du movementType comme union littérale plutôt que string générique
 * 4. Gestion de la relation un-à-un entre Product et Stock
 *
 * Le type de retour est une union discriminée qui permet à TypeScript de vérifier
 * correctement si l'opération a réussi avant d'accéder aux données.
 */
export async function getWarehouseProductById(
    productId: string
): Promise<{ success: true; data: WarehouseProductDetail } | { success: false; error: string }> {
    try {
        const { restaurantId } = await getCurrentUserAndRestaurant()

        const product = await prisma.warehouseProduct.findUnique({
            where: { id: productId, restaurantId },
            include: {
                stock: true,
                linkedProduct: { include: { stock: true } },
                movements: { orderBy: { createdAt: 'desc' }, take: 50 },
            },
        })

        if (!product) return { success: false, error: 'Produit introuvable' }

        const stock = product.stock[0]
        const linkedStock = product.linkedProduct?.stock ? product.linkedProduct.stock[0] : undefined

        const transformedProduct: WarehouseProductDetail = {
            id: product.id,
            restaurantId: product.restaurantId,
            name: product.name,
            sku: product.sku,
            description: product.description,
            storageUnit: product.storageUnit,
            unitsPerStorage: product.unitsPerStorage,
            category: product.category,
            imageUrl: product.imageUrl,
            linkedProductId: product.linkedProductId,
            conversionRatio: Number(product.conversionRatio),
            notes: product.notes,
            isActive: product.isActive,
            createdAt: product.createdAt?.toISOString() ?? null,
            updatedAt: product.updatedAt?.toISOString() ?? null,
            stock: stock
                ? {
                    id: stock.id,
                    restaurantId: stock.restaurantId,
                    warehouseProductId: stock.warehouseProductId,
                    quantity: Number(stock.quantity),
                    alertThreshold: Number(stock.alertThreshold),
                    unitCost: stock.unitCost !== null ? Number(stock.unitCost) : null,
                    lastInventoryDate: stock.lastInventoryDate
                        ? new Date(stock.lastInventoryDate).toISOString()
                        : null,
                    updatedAt: new Date(stock.updatedAt).toISOString(),
                }
                : undefined,
            isLowStock: stock ? Number(stock.quantity) < Number(stock.alertThreshold) : false,
            linkedProduct: product.linkedProduct
                ? {
                    id: product.linkedProduct.id,
                    name: product.linkedProduct.name,
                    imageUrl: product.linkedProduct.imageUrl,
                    currentStock: linkedStock ? Number(linkedStock.quantity) : 0,
                    stock: linkedStock
                        ? [{
                            quantity: Number(linkedStock.quantity),
                            alertThreshold: Number(linkedStock.alertThreshold),
                            unitCost: linkedStock.unitCost !== null
                                ? Number(linkedStock.unitCost)
                                : null,
                            lastInventoryDate: linkedStock.lastInventoryDate
                                ? new Date(linkedStock.lastInventoryDate).toISOString()
                                : null,
                            updatedAt: new Date(linkedStock.updatedAt).toISOString(),
                        }]
                        : undefined,
                }
                : undefined,
            movements: product.movements.map(m => ({
                id: m.id,
                restaurantId: m.restaurantId,
                warehouseProductId: m.warehouseProductId,
                movementType: m.movementType as 'entry' | 'exit' | 'transfer_to_ops' | 'adjustment' | 'loss',
                quantity: Number(m.quantity),
                previousQty: Number(m.previousQty),
                newQty: Number(m.newQty),
                supplierName: m.supplierName,
                invoiceReference: m.invoiceReference,
                destination: m.destination,
                reason: m.reason,
                performedBy: m.performedBy,
                notes: m.notes,
                createdAt: m.createdAt ? new Date(m.createdAt).toISOString() : null,
            })),
        }

        return { success: true, data: transformedProduct }
    } catch (error) {
        console.error('Erreur récupération produit:', error)
        return { success: false, error: 'Erreur lors de la récupération du produit' }
    }
}


// ============================================================
// Action 8 : Récupérer les produits menu disponibles pour liaison
// ============================================================

export async function getAvailableProductsForLinking() {
    try {
        const { restaurantId } = await getCurrentUserAndRestaurant()

        const products = await prisma.product.findMany({
            where: {
                restaurantId,
                isActive: true,
            },
            select: {
                id: true,
                name: true,
                imageUrl: true,
            },
            orderBy: {
                name: 'asc',
            },
        })

        return { success: true, data: products }
    } catch (error) {
        console.error('Erreur récupération produits menu:', error)
        return { error: 'Erreur lors de la récupération des produits menu' }
    }
}

// ============================================================
// Action 9 : Récupérer les catégories distinctes du warehouse
// ============================================================

export async function getWarehouseCategories() {
    try {
        const { restaurantId } = await getCurrentUserAndRestaurant()

        const products = await prisma.warehouseProduct.findMany({
            where: {
                restaurantId,
                isActive: true,
                category: {
                    not: null,
                },
            },
            select: {
                category: true,
            },
            distinct: ['category'],
        })

        const categories = products
            .map(p => p.category)
            .filter((category): category is string => category !== null)
            .sort()

        return { success: true, data: categories }
    } catch (error) {
        console.error('Erreur récupération catégories:', error)
        return { error: 'Erreur lors de la récupération des catégories' }
    }
}

// ============================================================
// Action 10 : Mettre à jour un produit d'entrepôt existant
// ============================================================

export async function updateWarehouseProduct(data: {
    id: string
    name?: string
    sku?: string
    description?: string
    storageUnit?: string
    unitsPerStorage?: number
    category?: string
    imageUrl?: string
    linkedProductId?: string
    conversionRatio?: number
    alertThreshold?: number
    isActive?: boolean
    notes?: string
}) {
    try {
        const { restaurantId } = await getCurrentUserAndRestaurant()

        const existingProduct = await prisma.warehouseProduct.findUnique({
            where: { id: data.id },
        })

        if (!existingProduct) {
            return { error: 'Produit introuvable' }
        }

        if (existingProduct.restaurantId !== restaurantId) {
            return { error: 'Accès non autorisé à ce produit' }
        }

        if (data.linkedProductId && data.linkedProductId !== existingProduct.linkedProductId) {
            const linkedProduct = await prisma.product.findFirst({
                where: {
                    id: data.linkedProductId,
                    restaurantId,
                },
            })

            if (!linkedProduct) {
                return { error: 'Produit menu introuvable ou non autorisé' }
            }
        }

        const updatedProduct = await prisma.$transaction(async (tx) => {
            const product = await tx.warehouseProduct.update({
                where: { id: data.id },
                data: {
                    name: data.name,
                    sku: data.sku,
                    description: data.description,
                    storageUnit: data.storageUnit,
                    unitsPerStorage: data.unitsPerStorage,
                    category: data.category,
                    imageUrl: data.imageUrl,
                    linkedProductId: data.linkedProductId,
                    conversionRatio: data.conversionRatio,
                    isActive: data.isActive,
                    notes: data.notes,
                    updatedAt: new Date(),
                },
            })

            if (data.alertThreshold !== undefined) {
                await tx.warehouseStock.updateMany({
                    where: {
                        warehouseProductId: data.id,
                        restaurantId,
                    },
                    data: {
                        alertThreshold: data.alertThreshold,
                    },
                })
            }

            return product
        })

        revalidatePath('/dashboard/warehouse')
        revalidatePath(`/dashboard/warehouse/products/${data.id}`)

        return { success: true, product: updatedProduct }
    } catch (error) {
        console.error('Erreur mise à jour produit entrepôt:', error)
        return { error: 'Erreur lors de la mise à jour du produit' }
    }
}