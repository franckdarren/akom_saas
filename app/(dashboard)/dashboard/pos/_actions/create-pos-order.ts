// app/(dashboard)/dashboard/pos/_actions/create-pos-order.ts
'use server'

import {z} from 'zod'
import prisma from '@/lib/prisma'
import {requireCashAccess} from '@/lib/auth/session'
import {revalidatePath} from 'next/cache'
import {OrderSource, OrderStatus, PaymentStatus, PaymentTiming, PaymentMethod} from '@prisma/client'
import {createChangeDue} from '@/lib/change-due/create'
import {normalizeChangeDueCode} from '@/lib/change-due/code'
import {todayBusinessDate} from '@/lib/change-due/business-date'
import type {POSOrderPayload, POSPaymentMethod} from '../_types'

const PAYMENT_METHOD_MAP: Record<POSPaymentMethod, PaymentMethod> = {
    cash: PaymentMethod.cash,
    airtel_money: PaymentMethod.airtel_money,
    moov_money: PaymentMethod.moov_money,
}

// Une quantité négative produirait un total négatif et réinjecterait du stock.
const POSItemsSchema = z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().min(1).max(9999),
})).min(1).max(200)

export async function createPOSOrder(payload: POSOrderPayload) {
    // Encaissement : admin ou cashier uniquement (même règle que la caisse)
    let userId: string
    let restaurantId: string
    try {
        ({userId, restaurantId} = await requireCashAccess())
    } catch {
        return {success: false, error: 'Votre rôle ne permet pas d\'encaisser'}
    }

    if (!POSItemsSchema.safeParse(payload.items).success) {
        return {success: false, error: 'Panier invalide'}
    }

    if (payload.mode === 'pay_now' && !payload.paymentMethod) {
        return {success: false, error: 'Méthode de paiement requise'}
    }

    // ── Récupérer produits + stock ───────────────────────────────────
    const productIds = payload.items.map(i => i.productId)
    const products = await prisma.product.findMany({
        where: {id: {in: productIds}, restaurantId},
        include: {stock: {select: {quantity: true}}},
    })
    const productMap = new Map(products.map(p => [p.id, p]))

    // ── Vérification stock ───────────────────────────────────────────
    const errors: string[] = []
    for (const item of payload.items) {
        const p = productMap.get(item.productId)
        if (!p) {
            errors.push(`Produit introuvable`);
            continue
        }
        if (p.price == null) {
            errors.push(`"${p.name}" n'a pas de prix`);
            continue
        }
        if (p.hasStock) {
            const available = p.stock?.quantity ?? 0
            if (item.quantity > available)
                errors.push(`"${p.name}" : stock insuffisant (demandé ${item.quantity}, dispo ${available})`)
        }
    }
    if (errors.length > 0) return {success: false, error: errors.join(' · ')}

    // ── Total de la commande ─────────────────────────────────────────
    // Calculé avant la transaction : les validations d'encaissement en
    // espèces ci-dessous en ont besoin pour pouvoir retourner une erreur
    // métier propre, plutôt que de lever une exception dans la transaction.
    const itemsData = payload.items.map((item) => {
        const p = productMap.get(item.productId)!
        return {
            productId: item.productId,
            productName: p.name,
            quantity: item.quantity,
            unitPrice: p.price as number,
        }
    })
    const totalAmount = itemsData.reduce(
        (sum, item) => sum + item.unitPrice * item.quantity,
        0,
    )

    const isCash = payload.mode === 'pay_now' && payload.paymentMethod === 'cash'

    // ── Monnaie due déduite de cet achat ─────────────────────────────
    // Restreint aux paiements en espèces : la cohérence de la balance de
    // caisse en dépend. La recette est enregistrée au montant plein, et le
    // tiroir encaisse moins — ce qui n'est vrai que si l'encaissement de
    // cette vente passe par le tiroir.
    let appliedChangeDue: {id: string; amount: number} | null = null

    if (payload.appliedChangeDueCode) {
        if (!isCash) {
            return {
                success: false,
                error: 'Une monnaie due ne peut être déduite que d\'un paiement en espèces',
            }
        }

        const code = normalizeChangeDueCode(payload.appliedChangeDueCode)
        const found = await prisma.changeDue.findUnique({
            where: {restaurantId_code: {restaurantId, code}},
            select: {id: true, amount: true, status: true},
        })

        if (!found || found.status !== 'outstanding') {
            return {
                success: false,
                error: `Code ${code} invalide ou déjà utilisé`,
            }
        }
        if (found.amount > totalAmount) {
            return {
                success: false,
                error: `La monnaie due (${found.amount} FCFA) dépasse le total de la commande — rendez-la en espèces`,
            }
        }

        appliedChangeDue = {id: found.id, amount: found.amount}
    }

    // ── Validation de l'encaissement en espèces ──────────────────────
    // Le client ne doit jamais être cru sur ces montants : ils déterminent
    // ce qui est enregistré comme dette envers un client.
    const cashToCollect = totalAmount - (appliedChangeDue?.amount ?? 0)
    let amountTendered: number | null = null
    let changeReturned: number | null = null
    const newChangeDueAmount = payload.changeDue?.amount ?? 0

    if (isCash && payload.amountTendered != null) {
        if (!Number.isInteger(payload.amountTendered) || payload.amountTendered < cashToCollect) {
            return {success: false, error: 'Montant reçu insuffisant'}
        }
        amountTendered = payload.amountTendered
        changeReturned = payload.amountTendered - cashToCollect
    }

    if (newChangeDueAmount > 0) {
        if (!isCash) {
            return {
                success: false,
                error: 'Une monnaie due ne peut naître que d\'un paiement en espèces',
            }
        }
        if (amountTendered == null) {
            return {success: false, error: 'Saisissez le montant reçu du client'}
        }
        if (!Number.isInteger(newChangeDueAmount) || newChangeDueAmount <= 0) {
            return {success: false, error: 'Montant de monnaie due invalide'}
        }
        if (newChangeDueAmount > changeReturned!) {
            return {
                success: false,
                error: 'La monnaie enregistrée dépasse la monnaie à rendre',
            }
        }
        // La part enregistrée comme dette n'est, par définition, pas rendue.
        changeReturned = changeReturned! - newChangeDueAmount
    }

    // ── Générer orderNumber unique ───────────────────────────────────
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const rand = String(Math.floor(Math.random() * 900 + 100))
    const orderNumber = `POS-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}-${rand}`

    const isPayNow = payload.mode === 'pay_now'

    // ── Transaction ──────────────────────────────────────────────────
    const order = await prisma.$transaction(async (tx) => {

        // 1. Commande
        // stockDeducted = true  → pay_now  : stock déduit ici, trigger SQL skippera
        // stockDeducted = false → pay_later : trigger SQL décrémentera au premier changement actif
        const newOrder = await tx.order.create({
            data: {
                restaurantId,
                orderNumber,
                source: OrderSource.counter,
                status: OrderStatus.pending,
                notes: payload.note ?? null,
                tableLabel: payload.tableLabel ?? 'Comptoir',
                totalAmount,
                stockDeducted: isPayNow,
            },
        })

        // 2. Items — createMany évite N requêtes individuelles
        await tx.orderItem.createMany({
            data: itemsData.map((item) => ({...item, orderId: newOrder.id})),
        })

        // 3. Paiement
        const payment = await tx.payment.create({
            data: {
                orderId: newOrder.id,
                restaurantId,
                // Montant plein de la vente, même si une monnaie due a été
                // déduite : la recette ne baisse pas, seul le tiroir encaisse
                // moins. Voir lib/change-due/totals.ts.
                amount: totalAmount,
                // pay_now  → méthode choisie, statut paid
                // pay_later → cash placeholder, statut pending (mis à jour via "Encaisser")
                method: isPayNow ? PAYMENT_METHOD_MAP[payload.paymentMethod!] : PaymentMethod.cash,
                status: isPayNow ? PaymentStatus.paid : PaymentStatus.pending,
                timing: PaymentTiming.after_meal,
                amountTendered,
                changeReturned,
            },
        })

        // 3b. Monnaie que le commerçant n'a pas pu rendre
        let changeDue: {code: string; amount: number} | null = null
        if (newChangeDueAmount > 0) {
            const created = await createChangeDue(tx, {
                restaurantId,
                userId,
                amount: newChangeDueAmount,
                orderId: newOrder.id,
                paymentId: payment.id,
                customerName: payload.changeDue?.customerName,
                customerPhone: payload.changeDue?.customerPhone,
            })
            changeDue = {code: created.code, amount: created.amount}
        }

        // 3c. Monnaie due déduite de cet achat
        // Le statut est dans le WHERE : si une autre caissière vient de solder
        // la même dette, count = 0 et la vente entière est annulée plutôt que
        // d'accorder deux fois la même déduction.
        if (appliedChangeDue) {
            const settled = await tx.changeDue.updateMany({
                where: {
                    id: appliedChangeDue.id,
                    restaurantId,
                    status: 'outstanding',
                },
                data: {
                    status: 'settled',
                    settlementMethod: 'order_deduction',
                    settledOrderId: newOrder.id,
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

        // 4. Décrément stock — pay_now uniquement
        // pay_later : le trigger SQL s'en charge au premier changement de statut
        //
        // Décrément atomique en une seule requête (au lieu d'un SELECT + UPDATE) :
        // évite la relecture redondante de `stock.quantity` déjà chargée dans
        // productMap, et supprime au passage la race condition entre deux ventes
        // concurrentes du même produit (le `FOR UPDATE` verrouille la ligne le
        // temps du calcul du delta).
        if (isPayNow) {
            for (const item of payload.items) {
                const p = productMap.get(item.productId)!
                if (!p.hasStock) continue

                const [stockResult] = await tx.$queryRaw<
                    {new_quantity: number; previous_quantity: number}[]
                >`
                    WITH old_stock AS (
                        SELECT quantity FROM stocks
                        WHERE restaurant_id = ${restaurantId}::uuid AND product_id = ${item.productId}::uuid
                        FOR UPDATE
                    )
                    UPDATE stocks
                    SET quantity = GREATEST((SELECT quantity FROM old_stock) - ${item.quantity}, 0)
                    WHERE restaurant_id = ${restaurantId}::uuid AND product_id = ${item.productId}::uuid
                    RETURNING quantity AS new_quantity, (SELECT quantity FROM old_stock) AS previous_quantity
                `
                if (!stockResult) continue

                const {previous_quantity: previousQty, new_quantity: newQty} = stockResult

                if (newQty <= 0) {
                    await tx.product.update({
                        where: {id: item.productId},
                        data: {isAvailable: false},
                    })
                }

                await tx.stockMovement.create({
                    data: {
                        restaurantId,
                        productId: item.productId,
                        userId,
                        type: 'order_out',
                        quantity: -(item.quantity),
                        previousQty,
                        newQty,
                        orderId: newOrder.id,
                        reason: 'Vente POS',
                    },
                })
            }
        }

        return {...newOrder, changeDue}
    })

    revalidatePath('/dashboard/pos/orders')
    revalidatePath('/dashboard/pos')
    if (newChangeDueAmount > 0 || appliedChangeDue) {
        revalidatePath('/dashboard/pos/monnaie-due')
        revalidatePath('/dashboard/caisse')
    }

    return {
        success: true,
        orderId: order.id,
        mode: payload.mode,
        // Alimente le ticket de preuve remis au client
        changeDue: order.changeDue,
    }
}