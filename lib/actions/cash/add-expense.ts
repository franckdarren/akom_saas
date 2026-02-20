// lib/actions/cash/add-expense.ts
'use server'

import prisma from '@/lib/prisma'
import {getCurrentUserAndRestaurant} from '@/lib/auth/session'
import {revalidatePath} from 'next/cache'

interface AddExpenseInput {
    sessionId: string
    description: string
    amount: number
    category: string
    paymentMethod: string
    productId?: string
    quantityAdded?: number
    notes?: string
}

export async function addExpense(input: AddExpenseInput) {
    const {userId, restaurantId} = await getCurrentUserAndRestaurant()
    if (!userId || !restaurantId) throw new Error('Non autorisé')

    const expense = await prisma.$transaction(async (tx) => {
        let stockMovementId: string | undefined

        if (
            input.category === 'stock_purchase' &&
            input.productId &&
            input.quantityAdded
        ) {
            const currentStock = await tx.stock.findFirst({
                where: {
                    productId: input.productId,
                    restaurantId,
                },
            })

            if (!currentStock) throw new Error('Produit introuvable dans le stock')

            const newQty = currentStock.quantity + input.quantityAdded

            await tx.stock.update({
                where: {id: currentStock.id},
                data: {quantity: newQty},
            })

            const movement = await tx.stockMovement.create({
                data: {
                    restaurantId,
                    productId: input.productId,
                    userId,           // ← userId directement, pas user.id
                    type: 'purchase',
                    quantity: input.quantityAdded,
                    previousQty: currentStock.quantity,
                    newQty,
                    reason: `Achat fournisseur : ${input.description}`,
                },
            })

            stockMovementId = movement.id
        }

        return tx.expense.create({
            data: {
                restaurantId,
                sessionId: input.sessionId,
                description: input.description,
                amount: input.amount,
                category: input.category as any,
                paymentMethod: input.paymentMethod as any,
                productId: input.productId,
                quantityAdded: input.quantityAdded,
                notes: input.notes,
                stockMovementId,
            },
        })
    })

    revalidatePath('/dashboard/caisse')
    return {success: true, expense}
}