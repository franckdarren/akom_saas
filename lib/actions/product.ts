// lib/actions/product.ts
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { capitalizeFirst, formatDescription } from '@/lib/utils/format-text'

interface ProductData {
    name: string
    description?: string
    price: number
    categoryId?: string
    imageUrl?: string
}


// ============================================================
// Récupérer le restaurant de l'utilisateur connecté
// ============================================================

async function getCurrentRestaurantId() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Non authentifié')
    }

    const restaurantUser = await prisma.restaurantUser.findFirst({
        where: { userId: user.id },
        select: { restaurantId: true },
    })

    if (!restaurantUser) {
        throw new Error('Aucun restaurant trouvé')
    }

    return restaurantUser.restaurantId
}


// ============================================================
// Créer un produit
// ============================================================

export async function createProduct(data: ProductData) {
    try {
        const restaurantId = await getCurrentRestaurantId()

        // Validation du prix
        if (data.price < 0) {
            return { error: 'Le prix ne peut pas être négatif' }
        }

        // ✅ Formatage automatique des données
        const formattedData = {
            name: capitalizeFirst(data.name),
            description: data.description 
                ? formatDescription(data.description) 
                : null,
            price: Math.floor(data.price),
            categoryId: data.categoryId || null,
            imageUrl: data.imageUrl || null,
        }

        // Créer le produit ET son stock dans une transaction
        const product = await prisma.$transaction(async (tx) => {
            // Créer le produit (INDISPONIBLE par défaut)
            const newProduct = await tx.product.create({
                data: {
                    restaurantId,
                    ...formattedData, // ✅ Utiliser les données formatées
                    isAvailable: false,
                },
            })

            // Créer automatiquement le stock pour ce produit
            await tx.stock.create({
                data: {
                    restaurantId,
                    productId: newProduct.id,
                    quantity: 0,
                    alertThreshold: 5,
                },
            })

            return newProduct
        })

        revalidatePath('/dashboard/menu/products')
        return { success: true, product }
    } catch (error) {
        console.error('Erreur création produit:', error)
        return { error: 'Erreur lors de la création du produit' }
    }
}


// ============================================================
// Modifier un produit
// ============================================================

export async function updateProduct(id: string, data: ProductData) {
    try {
        const restaurantId = await getCurrentRestaurantId()

        // Validation du prix
        if (data.price < 0) {
            return { error: 'Le prix ne peut pas être négatif' }
        }

        // ✅ Formatage automatique des données
        const formattedData = {
            name: capitalizeFirst(data.name),
            description: data.description 
                ? formatDescription(data.description) 
                : null,
            price: Math.floor(data.price),
            categoryId: data.categoryId || null,
            imageUrl: data.imageUrl || null,
        }

        const product = await prisma.product.update({
            where: {
                id,
                restaurantId,
            },
            data: formattedData, // ✅ Utiliser les données formatées
        })

        revalidatePath('/dashboard/menu/products')
        return { success: true, product }
    } catch (error) {
        console.error('Erreur mise à jour produit:', error)
        return { error: 'Erreur lors de la mise à jour du produit' }
    }
}


// ============================================================
// Changer la disponibilité d'un produit
// ============================================================

export async function toggleProductAvailability(id: string) {
    try {
        const restaurantId = await getCurrentRestaurantId()

        const product = await prisma.product.findUnique({
            where: { id, restaurantId },
            select: { isAvailable: true },
        })

        if (!product) {
            return { error: 'Produit introuvable' }
        }

        await prisma.product.update({
            where: { id },
            data: { isAvailable: !product.isAvailable },
        })

        revalidatePath('/dashboard/menu/products')
        return { success: true }
    } catch (error) {
        console.error('Erreur toggle disponibilité:', error)
        return { error: 'Erreur lors du changement de disponibilité' }
    }
}


// ============================================================
// Supprimer un produit
// ============================================================

export async function deleteProduct(id: string) {
    try {
        const restaurantId = await getCurrentRestaurantId()

        // Le stock sera automatiquement supprimé grâce au onDelete: Cascade
        await prisma.product.delete({
            where: { id, restaurantId },
        })

        revalidatePath('/dashboard/menu/products')
        return { success: true }
    } catch (error) {
        console.error('Erreur suppression produit:', error)
        return { error: 'Erreur lors de la suppression du produit' }
    }
}