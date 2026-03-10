// lib/actions/cash/add-revenue.ts
'use server'

import prisma from '@/lib/prisma'
import {getCurrentUserAndRestaurant} from '@/lib/auth/session'
import {revalidatePath} from 'next/cache'
import {PaymentMethod, RevenueType} from '@prisma/client'

interface AddRevenueInput {
    sessionId: string
    description: string
    quantity: number
    unitAmount: number
    paymentMethod: string
    revenueType: 'good' | 'service'
    productId?: string
    notes?: string
}

export async function addManualRevenue(input: AddRevenueInput) {
    const {userId, restaurantId} = await getCurrentUserAndRestaurant()
    if (!userId || !restaurantId) throw new Error('Non autorisé')

    const paymentMethod = input.paymentMethod as PaymentMethod
    if (!Object.values(PaymentMethod).includes(paymentMethod)) {
        throw new Error(`Mode de paiement invalide : ${input.paymentMethod}. Valeurs acceptées : ${Object.values(PaymentMethod).join(', ')}`)
    }

    const revenueType = input.revenueType as RevenueType
    if (!Object.values(RevenueType).includes(revenueType)) {
        throw new Error(`Type de recette invalide : ${input.revenueType}`)
    }

    const totalAmount = input.quantity * input.unitAmount

    const revenue = await prisma.$transaction(async (tx) => {
        // ✅ On récupère la session pour obtenir sa sessionDate (date métier).
        // C'est cette date qui doit dater la recette, pas now().
        // Pour une saisie historique du 3 janvier, revenueDate sera le 3 janvier.
        const session = await tx.cashSession.findUnique({
            where: {id: input.sessionId},
            select: {sessionDate: true},
        })
        if (!session) throw new Error('Session introuvable')

        let stockMovementId: string | undefined

        if (revenueType === RevenueType.good && input.productId) {
            const currentStock = await tx.stock.findFirst({
                where: {productId: input.productId, restaurantId},
            })

            if (!currentStock) throw new Error('Produit introuvable dans le stock')

            const newQty = Math.max(0, currentStock.quantity - input.quantity)

            await tx.stock.update({
                where: {id: currentStock.id},
                data: {quantity: newQty},
            })

            const movement = await tx.stockMovement.create({
                data: {
                    restaurantId,
                    productId: input.productId,
                    userId,
                    type: 'sale_manual',
                    quantity: -input.quantity,
                    previousQty: currentStock.quantity,
                    newQty,
                    reason: `Vente manuelle : ${input.description}`,
                },
            })

            stockMovementId = movement.id
        }

        return tx.manualRevenue.create({
            data: {
                restaurantId,
                sessionId: input.sessionId,
                description: input.description,
                quantity: input.quantity,
                unitAmount: input.unitAmount,
                totalAmount,
                paymentMethod,
                revenueType,
                productId: input.productId,
                notes: input.notes,
                stockMovementId,
                // ✅ Date métier = date de la session, jamais now()
                revenueDate: session.sessionDate,
            },
        })
    })

    revalidatePath('/dashboard/caisse')
    return {success: true, revenue}
}