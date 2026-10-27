// app/(dashboard)/dashboard/pos/_actions/mark-order-paid.ts
'use server'

import prisma from '@/lib/prisma'
import {requireCashAccess} from '@/lib/auth/session'
import {revalidatePath} from 'next/cache'
import {PaymentStatus, PaymentMethod} from '@prisma/client'
import {createChangeDue} from '@/lib/change-due/create'
import {normalizeChangeDueCode} from '@/lib/change-due/code'
import {todayBusinessDate} from '@/lib/change-due/business-date'
import type {POSChangeDueResult} from '../_types'

interface MarkOrderPaidOptions {
    // Espèces uniquement : montant physiquement remis par le client.
    amountTendered?: number
    // Monnaie que le commerçant ne peut pas rendre, faute de petite monnaie.
    changeDue?: {
        amount: number
        customerName?: string
        customerPhone?: string
    }
    // Code de retrait d'une monnaie due déduite de cet encaissement.
    appliedChangeDueCode?: string
}

export async function markOrderPaid(
    orderId: string,
    method: PaymentMethod,
    options: MarkOrderPaidOptions = {},
): Promise<{error: string} | {success: true; changeDue: POSChangeDueResult | null}> {
    // Encaissement : admin ou cashier uniquement (même règle que la caisse)
    let userId: string
    let restaurantId: string
    try {
        ({userId, restaurantId} = await requireCashAccess())
    } catch {
        return {error: 'Non autorisé'}
    }

    // Vérifier que la commande appartient bien à ce restaurant
    const order = await prisma.order.findUnique({
        where: {id: orderId},
        select: {
            id: true,
            restaurantId: true,
            totalAmount: true,
            payments: {select: {id: true, status: true}},
        },
    })

    if (!order || order.restaurantId !== restaurantId) {
        return {error: 'Commande introuvable'}
    }

    const isCash = method === PaymentMethod.cash

    // ── Monnaie due déduite de cet encaissement ──────────────────────
    // Espèces uniquement : la cohérence de la balance de caisse en dépend
    // (voir lib/change-due/totals.ts).
    let appliedChangeDue: {id: string; amount: number} | null = null

    if (options.appliedChangeDueCode) {
        if (!isCash) {
            return {error: 'Une monnaie due ne peut être déduite que d\'un paiement en espèces'}
        }

        const code = normalizeChangeDueCode(options.appliedChangeDueCode)
        const found = await prisma.changeDue.findUnique({
            where: {restaurantId_code: {restaurantId, code}},
            select: {id: true, amount: true, status: true},
        })

        if (!found || found.status !== 'outstanding') {
            return {error: `Code ${code} invalide ou déjà utilisé`}
        }
        if (found.amount > order.totalAmount) {
            return {
                error: `La monnaie due (${found.amount} FCFA) dépasse le total de la commande — rendez-la en espèces`,
            }
        }

        appliedChangeDue = {id: found.id, amount: found.amount}
    }

    // ── Validation de l'encaissement en espèces ──────────────────────
    const cashToCollect = order.totalAmount - (appliedChangeDue?.amount ?? 0)
    let amountTendered: number | null = null
    let changeReturned: number | null = null
    const newChangeDueAmount = options.changeDue?.amount ?? 0

    if (isCash && options.amountTendered != null) {
        if (!Number.isInteger(options.amountTendered) || options.amountTendered < cashToCollect) {
            return {error: 'Montant reçu insuffisant'}
        }
        amountTendered = options.amountTendered
        changeReturned = options.amountTendered - cashToCollect
    }

    if (newChangeDueAmount > 0) {
        if (!isCash) {
            return {error: 'Une monnaie due ne peut naître que d\'un paiement en espèces'}
        }
        if (amountTendered == null) {
            return {error: 'Saisissez le montant reçu du client'}
        }
        if (!Number.isInteger(newChangeDueAmount) || newChangeDueAmount <= 0) {
            return {error: 'Montant de monnaie due invalide'}
        }
        if (newChangeDueAmount > changeReturned!) {
            return {error: 'La monnaie enregistrée dépasse la monnaie à rendre'}
        }
        changeReturned = changeReturned! - newChangeDueAmount
    }

    // Chercher un paiement en attente existant
    const pendingPayment = order.payments.find(p => p.status === PaymentStatus.pending)

    const result = await prisma.$transaction(async (tx) => {
        const payment = pendingPayment
            // Mettre à jour le paiement existant
            ? await tx.payment.update({
                where: {id: pendingPayment.id},
                data: {
                    status: PaymentStatus.paid,
                    method,
                    amountTendered,
                    changeReturned,
                },
            })
            // Aucun paiement n'existe encore → en créer un
            : await tx.payment.create({
                data: {
                    orderId,
                    restaurantId,
                    amount: order.totalAmount,
                    method,
                    status: PaymentStatus.paid,
                    timing: 'after_meal',
                    amountTendered,
                    changeReturned,
                },
            })

        let changeDue: POSChangeDueResult | null = null
        if (newChangeDueAmount > 0) {
            const created = await createChangeDue(tx, {
                restaurantId,
                userId,
                amount: newChangeDueAmount,
                orderId,
                paymentId: payment.id,
                customerName: options.changeDue?.customerName,
                customerPhone: options.changeDue?.customerPhone,
            })
            changeDue = {code: created.code, amount: created.amount}
        }

        // Statut dans le WHERE : si la dette vient d'être soldée ailleurs,
        // count = 0 et tout l'encaissement est annulé plutôt que d'accorder
        // deux fois la même déduction.
        if (appliedChangeDue) {
            const settled = await tx.changeDue.updateMany({
                where: {id: appliedChangeDue.id, restaurantId, status: 'outstanding'},
                data: {
                    status: 'settled',
                    settlementMethod: 'order_deduction',
                    settledOrderId: orderId,
                    settledDate: todayBusinessDate(),
                    settledAt: new Date(),
                    settledBy: userId,
                },
            })

            if (settled.count === 0) {
                throw new Error(
                    'La monnaie due vient d\'être soldée ailleurs — reprenez l\'encaissement',
                )
            }
        }

        return {changeDue}
    })

    revalidatePath('/dashboard/pos/orders')
    if (newChangeDueAmount > 0 || appliedChangeDue) {
        revalidatePath('/dashboard/pos/monnaie-due')
        revalidatePath('/dashboard/caisse')
    }

    return {success: true, changeDue: result.changeDue}
}
