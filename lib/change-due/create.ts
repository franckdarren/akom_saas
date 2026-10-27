// lib/change-due/create.ts
import type {Prisma} from '@prisma/client'
import {generateChangeDueCode} from './code'
import {todayBusinessDate} from './business-date'

const MAX_CODE_ATTEMPTS = 5

interface CreateChangeDueInput {
    restaurantId: string
    userId: string
    amount: number
    orderId: string
    paymentId: string
    customerName?: string
    customerPhone?: string
    notes?: string
}

/**
 * Cree une ligne de monnaie due a l'interieur d'une transaction existante.
 *
 * Prend le client de transaction en parametre : la dette doit naitre dans la
 * meme transaction que la vente et son paiement, sinon un echec partiel
 * laisserait une vente encaissee sans trace de la monnaie conservee.
 *
 * Le code de retrait est tire au hasard ; l'unicite est garantie par l'index
 * unique (restaurant_id, code). En cas de collision on retente, l'espace de
 * codes (30^6, soit ~729 millions) rendant plus de une collision improbable.
 */
export async function createChangeDue(
    tx: Prisma.TransactionClient,
    input: CreateChangeDueInput,
) {
    if (!Number.isInteger(input.amount) || input.amount <= 0) {
        throw new Error('Montant de monnaie due invalide')
    }

    for (let attempt = 1; attempt <= MAX_CODE_ATTEMPTS; attempt++) {
        const code = generateChangeDueCode()

        const existing = await tx.changeDue.findUnique({
            where: {restaurantId_code: {restaurantId: input.restaurantId, code}},
            select: {id: true},
        })
        if (existing) continue

        return tx.changeDue.create({
            data: {
                restaurantId: input.restaurantId,
                code,
                amount: input.amount,
                customerName: input.customerName?.trim() || null,
                customerPhone: input.customerPhone?.trim() || null,
                orderId: input.orderId,
                paymentId: input.paymentId,
                dueDate: todayBusinessDate(),
                notes: input.notes?.trim() || null,
                createdBy: input.userId,
            },
        })
    }

    throw new Error(
        'Impossible de generer un code de retrait unique — reessayez',
    )
}
