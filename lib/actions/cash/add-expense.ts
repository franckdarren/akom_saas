// lib/actions/cash/add-expense.ts
'use server'

import prisma from '@/lib/prisma'
import {getCurrentUserAndRestaurant} from '@/lib/auth/session'
import {revalidatePath} from 'next/cache'
import {PaymentMethod, ExpenseCategory} from '@prisma/client'

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

    // Validation des enums avant d'entrer dans la transaction.
    // Si la valeur reçue n'existe pas dans l'enum, on lève une erreur
    // claire plutôt qu'une PrismaClientValidationError cryptique.
    const paymentMethod = input.paymentMethod as PaymentMethod
    if (!Object.values(PaymentMethod).includes(paymentMethod)) {
        throw new Error(`Mode de paiement invalide : ${input.paymentMethod}`)
    }

    const category = input.category as ExpenseCategory
    if (!Object.values(ExpenseCategory).includes(category)) {
        throw new Error(`Catégorie invalide : ${input.category}`)
    }

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
                    userId,
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
                category,        // ← enum typé, plus de cast as any
                paymentMethod,   // ← enum typé, plus de cast as any
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