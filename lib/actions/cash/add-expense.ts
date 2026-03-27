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

    const paymentMethod = input.paymentMethod as PaymentMethod
    if (!Object.values(PaymentMethod).includes(paymentMethod)) {
        throw new Error(`Mode de paiement invalide : ${input.paymentMethod}`)
    }

    const category = input.category as ExpenseCategory
    if (!Object.values(ExpenseCategory).includes(category)) {
        throw new Error(`Catégorie invalide : ${input.category}`)
    }

    const expense = await prisma.$transaction(async (tx) => {
        // ✅ Même logique que add-revenue : la dépense appartient à la date
        // de la session, pas à aujourd'hui. Critique pour les saisies historiques.
        const session = await tx.cashSession.findUnique({
            where: {id: input.sessionId},
            select: {sessionDate: true},
        })
        if (!session) throw new Error('Session introuvable')

        let stockMovementId: string | undefined

        if (
            input.category === 'stock_purchase' &&
            input.productId &&
            input.quantityAdded
        ) {
            const currentStock = await tx.stock.findUnique({
                where: {restaurantId_productId: {restaurantId, productId: input.productId}},
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
                category,
                paymentMethod,
                productId: input.productId,
                quantityAdded: input.quantityAdded,
                notes: input.notes,
                stockMovementId,
                // ✅ Date métier = date de la session, jamais now()
                expenseDate: session.sessionDate,
            },
        })
    })

    revalidatePath('/dashboard/caisse')
    return {success: true, expense}
}