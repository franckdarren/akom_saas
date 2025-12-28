// lib/actions/product.ts
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'

interface ProductData {
    name: string
    description?: string
    price: number
    categoryId?: string
    imageUrl?: string
}

// Récupérer le restaurant de l'utilisateur connecté
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

export async function createProduct(data: ProductData) {
    try {
        const restaurantId = await getCurrentRestaurantId()

        // Validation du prix
        if (data.price < 0) {
            return { error: 'Le prix ne peut pas être négatif' }
        }

        // Créer le produit ET son stock dans une transaction
        const product = await prisma.$transaction(async (tx) => {
            // Créer le produit
            const newProduct = await tx.product.create({
                data: {
                    restaurantId,
                    name: data.name.trim(),
                    description: data.description?.trim() || null,
                    price: Math.floor(data.price), // S'assurer que c'est un entier
                    categoryId: data.categoryId || null,
                    imageUrl: data.imageUrl || null,
                    isAvailable: true,
                },
            })

            // Créer automatiquement le stock pour ce produit
            await tx.stock.create({
                data: {
                    restaurantId,
                    productId: newProduct.id,
                    quantity: 0, // Stock initial à 0
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

export async function updateProduct(id: string, data: ProductData) {
    try {
        const restaurantId = await getCurrentRestaurantId()

        // Validation du prix
        if (data.price < 0) {
            return { error: 'Le prix ne peut pas être négatif' }
        }

        const product = await prisma.product.update({
            where: {
                id,
                restaurantId, // Sécurité RLS
            },
            data: {
                name: data.name.trim(),
                description: data.description?.trim() || null,
                price: Math.floor(data.price),
                categoryId: data.categoryId || null,
                imageUrl: data.imageUrl || null,
            },
        })

        revalidatePath('/dashboard/menu/products')
        return { success: true, product }
    } catch (error) {
        console.error('Erreur mise à jour produit:', error)
        return { error: 'Erreur lors de la mise à jour du produit' }
    }
}

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