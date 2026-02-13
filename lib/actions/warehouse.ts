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
    storageUnit: string // 'casier', 'carton', etc.
    unitsPerStorage: number
    category?: string
    imageUrl?: string
    linkedProductId?: string // ID du produit menu
    conversionRatio?: number
    initialQuantity?: number
    unitCost?: number
}) {
    try {
        const { restaurantId, userId } = await getCurrentUserAndRestaurant()

        // Si un produit menu est lié, vérifier qu'il appartient au restaurant
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

        // Créer le produit d'entrepôt et son stock initial en transaction
        const warehouseProduct = await prisma.$transaction(async (tx) => {
            // Créer le produit
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

            // Créer l'entrée de stock
            await tx.warehouseStock.create({
                data: {
                    restaurantId,
                    warehouseProductId: product.id,
                    quantity: data.initialQuantity || 0,
                    unitCost: data.unitCost,
                    alertThreshold: 10, // Valeur par défaut
                },
            })

            // Si quantité initiale > 0, créer un mouvement d'entrée
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
            // Récupérer le stock actuel
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

            // ✅ Convertir Decimal en number pour les calculs
            const previousQty = Number(currentStock.quantity)
            const newQty = previousQty + data.quantity

            // Mettre à jour le stock
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

            // Créer le mouvement
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
            // 1. Vérifier le produit d'entrepôt et son stock
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

            // ✅ Convertir Decimal en number
            const warehouseStockQty = Number(warehouseStock.quantity)

            if (warehouseStockQty < data.warehouseQuantity) {
                throw new Error('Stock entrepôt insuffisant')
            }

            // 2. Vérifier le produit opérationnel de destination
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

            // ✅ Vérifier que le stock existe (gérer le cas null)
            const opsStock = opsProduct.stock

            if (!opsStock) {
                throw new Error('Stock opérationnel introuvable')
            }


            // 3. Calculer la quantité avec conversion
            // ✅ Convertir conversionRatio en number
            const conversionRatio = Number(warehouseProduct.conversionRatio) || 1
            const opsQuantityToAdd = data.warehouseQuantity * conversionRatio

            // ✅ Convertir les quantités en number
            const opsStockQty = Number(opsStock.quantity)

            // 4. Décrémenter le stock entrepôt
            const newWarehouseQty = warehouseStockQty - data.warehouseQuantity
            await tx.warehouseStock.update({
                where: { id: warehouseStock.id },
                data: {
                    quantity: newWarehouseQty,
                    updatedAt: new Date(),
                },
            })

            // 5. Incrémenter le stock opérationnel
            const newOpsQty = opsStockQty + opsQuantityToAdd
            await tx.stock.update({
                where: { id: opsStock.id },
                data: {
                    quantity: newOpsQty,
                    updatedAt: new Date(),
                },
            })

            // 6. Créer le mouvement dans l'entrepôt (sortie)
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

            // 7. Créer le mouvement dans le stock opérationnel (entrée)
            // ✅ Ajouter le champ userId qui est requis dans votre schéma
            await tx.stockMovement.create({
                data: {
                    restaurantId,
                    productId: data.opsProductId,
                    type: 'adjustment',
                    quantity: opsQuantityToAdd,
                    previousQty: opsStockQty,
                    newQty: newOpsQty,
                    reason: `Transfert depuis magasin (${warehouseProduct.name})`,
                    userId, // ✅ Champ manquant ajouté
                },
            })

            // 8. Créer l'enregistrement de transfert
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

            // 9. Rendre le produit ops disponible
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

            // ✅ Convertir Decimal en number
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

        // Récupérer tous les produits avec leur stock
        const products = await prisma.warehouseProduct.findMany({
            where: {
                restaurantId,
                isActive: true,
            },
            include: {
                stock: true,
            },
        })

        // Calculer les statistiques
        const stats = {
            totalProducts: products.length,
            totalValue: products.reduce((sum, product) => {
                const stock = product.stock[0]
                if (!stock || !stock.unitCost) return sum
                // Convertir les Decimal en number pour le calcul
                return sum + (Number(stock.quantity) * Number(stock.unitCost))
            }, 0),
            lowStockCount: products.filter(product => {
                const stock = product.stock[0]
                if (!stock) return false
                // Convertir les Decimal en number pour la comparaison
                return Number(stock.quantity) < Number(stock.alertThreshold)
            }).length,
            averageStockValue: 0, // Sera calculé après
            lastInventoryDate: products.reduce((latest, product) => {
                const stock = product.stock[0]
                if (!stock?.lastInventoryDate) return latest
                if (!latest || stock.lastInventoryDate > latest) {
                    return stock.lastInventoryDate
                }
                return latest
            }, null as Date | null),
        }

        // Calculer la valeur moyenne par produit
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

        // Construire les conditions de filtrage dynamiquement
        // Cette approche permet d'avoir une requête optimisée par Prisma
        const whereConditions: any = {
            restaurantId,
            isActive: true,
        }

        // Filtre par catégorie si spécifié
        if (filters?.category) {
            whereConditions.category = filters.category
        }

        // Filtre par unité de stockage si spécifié
        if (filters?.storageUnit) {
            whereConditions.storageUnit = filters.storageUnit
        }

        // Filtre pour les produits liés à un produit menu uniquement
        if (filters?.linkedOnly) {
            whereConditions.linkedProductId = {
                not: null,
            }
        }

        // Filtre par recherche textuelle (nom ou SKU)
        if (filters?.search) {
            whereConditions.OR = [
                {
                    name: {
                        contains: filters.search,
                        mode: 'insensitive', // Recherche insensible à la casse
                    },
                },
                {
                    sku: {
                        contains: filters.search,
                        mode: 'insensitive',
                    },
                },
            ]
        }

        // Récupérer les produits avec toutes leurs relations
        const products = await prisma.warehouseProduct.findMany({
            where: whereConditions,
            include: {
                stock: true,
                linkedProduct: {
                    include: {
                        stock: true, // Pour connaître le stock actuel du produit menu
                    },
                },
            },
            orderBy: {
                name: 'asc', // Tri alphabétique par défaut
            },
        })

        // Transformer les données pour l'interface
        // Cette étape est importante car elle permet de calculer des propriétés
        // dérivées et de formater les données pour le frontend
        const transformedProducts = products.map(product => {
            const stock = product.stock[0]

            return {
                ...product,
                stock,
                // Propriété calculée pour savoir si le stock est bas
                isLowStock: stock ? Number(stock.quantity) < Number(stock.alertThreshold) : false,
                // Informations sur le produit menu lié si présent
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

        // Filtre post-requête pour le stock bas
        // On fait ce filtre après la requête car il nécessite un calcul
        // qui n'est pas directement exprimable en SQL de manière simple
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

export async function getWarehouseProductById(productId: string) {
    try {
        const { restaurantId } = await getCurrentUserAndRestaurant()

        // Récupérer le produit avec toutes ses données associées
        const product = await prisma.warehouseProduct.findUnique({
            where: {
                id: productId,
                restaurantId, // Sécurité : vérifier que le produit appartient au restaurant
            },
            include: {
                stock: true,
                linkedProduct: {
                    include: {
                        stock: true,
                    },
                },
                movements: {
                    orderBy: {
                        createdAt: 'desc',
                    },
                    take: 50, // Limiter à 50 derniers mouvements pour les performances
                },
            },
        })

        if (!product) {
            return { error: 'Produit introuvable' }
        }

        // Transformer les données pour l'interface
        const stock = product.stock[0]

        const transformedProduct = {
            ...product,
            stock,
            isLowStock: stock ? Number(stock.quantity) < Number(stock.alertThreshold) : false,
            linkedProduct: product.linkedProduct
                ? {
                    id: product.linkedProduct.id,
                    name: product.linkedProduct.name,
                    imageUrl: product.linkedProduct.imageUrl,
                    currentStock: Number(product.linkedProduct.stock?.quantity ?? 0),
                }
                : undefined,

        }

        return { success: true, data: transformedProduct }
    } catch (error) {
        console.error('Erreur récupération produit:', error)
        return { error: 'Erreur lors de la récupération du produit' }
    }
}

// ============================================================
// Action 8 : Récupérer les produits menu disponibles pour liaison
// ============================================================

export async function getAvailableProductsForLinking() {
    try {
        const { restaurantId } = await getCurrentUserAndRestaurant()

        // Récupérer tous les produits actifs du menu
        // Ces produits pourront être liés à des produits d'entrepôt
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

        // Récupérer toutes les catégories uniques
        // Cette requête est optimisée car elle ne récupère que le champ category
        const products = await prisma.warehouseProduct.findMany({
            where: {
                restaurantId,
                isActive: true,
                category: {
                    not: null, // Exclure les produits sans catégorie
                },
            },
            select: {
                category: true,
            },
            distinct: ['category'],
        })

        // Extraire les catégories uniques et filtrer les nulls
        const categories = products
            .map(p => p.category)
            .filter((category): category is string => category !== null)
            .sort() // Tri alphabétique

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

        // Vérifier que le produit existe et appartient bien au restaurant
        // Cette étape est cruciale pour la sécurité multi-tenant
        const existingProduct = await prisma.warehouseProduct.findUnique({
            where: { id: data.id },
        })

        if (!existingProduct) {
            return { error: 'Produit introuvable' }
        }

        if (existingProduct.restaurantId !== restaurantId) {
            return { error: 'Accès non autorisé à ce produit' }
        }

        // Si un nouveau produit menu est lié, vérifier qu'il appartient au restaurant
        // Cela évite qu'un utilisateur malveillant ne lie un produit d'un autre restaurant
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

        // Effectuer la mise à jour dans une transaction pour garantir la cohérence
        // Si on modifie le seuil d'alerte, on doit aussi mettre à jour le stock
        const updatedProduct = await prisma.$transaction(async (tx) => {
            // Mettre à jour le produit
            const product = await tx.warehouseProduct.update({
                where: { id: data.id },
                data: {
                    // On ne met à jour que les champs fournis (undefined ne modifie pas)
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

            // Si le seuil d'alerte a changé, mettre à jour le stock également
            // Cela permet de garder la cohérence entre le produit et son stock
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

        // Revalider les caches Next.js pour que les changements soient visibles immédiatement
        revalidatePath('/dashboard/warehouse')
        revalidatePath(`/dashboard/warehouse/products/${data.id}`)
        
        return { success: true, product: updatedProduct }
    } catch (error) {
        console.error('Erreur mise à jour produit entrepôt:', error)
        return { error: 'Erreur lors de la mise à jour du produit' }
    }
}