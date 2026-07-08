// app/api/webhooks/ebilling/route.ts

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import type { Prisma } from '@prisma/client'
import { deductOrderStock } from '@/lib/stock/deduct-order-stock'
import { EBillingService, ebilling } from '@/lib/payment/ebilling'

type SubscriptionPaymentWithSub = Prisma.SubscriptionPaymentGetPayload<{
    include: { subscription: { include: { restaurant: true } } }
}>
type OrderPaymentWithOrder = Prisma.PaymentGetPayload<{
    include: { order: true; restaurant: true }
}>
interface EBillingPayload {
    reference?: string
    status?: string
    payment_status?: string
    error_message?: string
    [key: string]: unknown
}

/**
 * Webhook eBilling - Point d'entrée des notifications de paiement
 * 
 * URL à configurer dans votre compte eBilling:
 * https://votre-domaine.com/api/webhooks/ebilling
 * 
 * IMPORTANT: Cette URL doit être HTTPS en production et accessible publiquement.
 * eBilling ne peut pas envoyer de notifications vers localhost.
 */

export async function POST(request: NextRequest) {
    try {
        const payload = await request.json() as EBillingPayload

        // Log pour debugging (à retirer en production)
        console.log('📥 Webhook eBilling reçu:', payload)

        // Vérifier que nous avons bien une référence
        const reference = payload.reference

        if (!reference) {
            console.error('❌ Webhook sans référence')
            return NextResponse.json({ error: 'Référence manquante' }, { status: 400 })
        }

        // La référence est soit un subscriptionPayment.id soit un payment.id
        // Nous devons déterminer lequel en essayant les deux

        // Essayer d'abord comme paiement d'abonnement
        const subscriptionPayment =
            await prisma.subscriptionPayment.findUnique({
                where: { id: reference },
                include: {
                    subscription: {
                        include: { restaurant: true },
                    },
                },
            })

        if (subscriptionPayment) {
            return handleSubscriptionPaymentWebhook(
                subscriptionPayment,
                payload
            )
        }

        // Sinon, essayer comme paiement de commande
        const orderPayment = await prisma.payment.findUnique({
            where: { id: reference },
            include: {
                order: true,
                restaurant: true,
            },
        })

        if (orderPayment) {
            return handleOrderPaymentWebhook(orderPayment, payload)
        }

        console.error('❌ Paiement introuvable:', reference)
        return NextResponse.json(
            { error: 'Paiement introuvable' },
            { status: 404 }
        )
    } catch (error) {
        console.error('❌ Erreur webhook eBilling:', error)
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        )
    }
}

/**
 * Gère la notification pour un paiement d'abonnement.
 *
 * SÉCURITÉ : on ne fait jamais confiance au body du webhook seul.
 * On revérifie le statut auprès de l'API eBilling (source autoritative) et
 * on valide le montant retourné. Sans cette étape, n'importe qui peut forger
 * un POST sur ce webhook avec status=SUCCESSFUL pour activer un abonnement gratuit.
 */
async function handleSubscriptionPaymentWebhook(
    payment: SubscriptionPaymentWithSub,
    payload: EBillingPayload
) {
    try {
        // Le payment doit avoir été initié via eBilling (transactionId = bill_id eBilling).
        // S'il n'a pas de transactionId, c'est un paiement manuel — on refuse le webhook.
        if (!payment.transactionId) {
            console.error('❌ Subscription payment sans bill_id eBilling:', payment.id)
            return NextResponse.json({ error: 'Cannot verify' }, { status: 503 })
        }

        // Re-interroger eBilling avec les credentials plateforme.
        const verified = await ebilling.getBill(payment.transactionId)

        if (!verified.success) {
            console.error('❌ Vérification eBilling abonnement échouée:', verified.error)
            return NextResponse.json({ error: 'Verification failed' }, { status: 503 })
        }

        // Cohérence : le bill récupéré doit pointer vers le même payment.
        if (verified.externalReference && verified.externalReference !== payment.id) {
            console.error('❌ external_reference eBilling mismatch:', {
                expected: payment.id,
                received: verified.externalReference,
            })
            return NextResponse.json({ error: 'Reference mismatch' }, { status: 400 })
        }

        // Validation du montant contre la réponse autoritative.
        if (verified.amount !== undefined && verified.amount !== payment.amount) {
            console.error('❌ Montant eBilling mismatch (vérifié):', {
                expected: payment.amount,
                verified: verified.amount,
            })
            return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 })
        }

        // Statut authoritatif depuis eBilling (et non depuis le body).
        const verifiedStatus = (verified.status || '').toString().toUpperCase()

        if (['PAID', 'SUCCESSFUL', 'COMPLETED'].includes(verifiedStatus)) {
            // Marquer le paiement comme confirmé
            await prisma.subscriptionPayment.update({
                where: { id: payment.id },
                data: {
                    status: 'confirmed',
                    paidAt: new Date(),
                    validatedAt: new Date(),
                },
            })

            // Activer l'abonnement
            await prisma.subscription.update({
                where: { id: payment.subscriptionId },
                data: {
                    status: 'active',
                    currentPeriodStart: new Date(),
                    currentPeriodEnd: payment.expiresAt,
                },
            })

            await prisma.restaurant.update({
                where: { id: payment.subscription.restaurantId },
                data: { isActive: true },
            })

            console.log(
                `✅ Abonnement activé pour ${payment.subscription.restaurant.name}`
            )

            revalidatePath('/dashboard/subscription')

            return NextResponse.json({ success: true })
        } else if (['FAILED', 'CANCELLED', 'EXPIRED'].includes(verifiedStatus)) {
            await prisma.subscriptionPayment.update({
                where: { id: payment.id },
                data: {
                    status: 'failed',
                    errorMessage: payload.error_message || 'Paiement échoué',
                },
            })

            console.log('❌ Paiement abonnement échoué:', payment.id)

            return NextResponse.json({ success: true })
        }

        // Statut inconnu ou PENDING, on ne fait rien
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Erreur handleSubscriptionPaymentWebhook:', error)
        return NextResponse.json(
            { error: 'Erreur traitement webhook' },
            { status: 500 }
        )
    }
}

/**
 * Gère la notification pour un paiement de commande.
 *
 * SÉCURITÉ : on ne fait jamais confiance au body du webhook seul.
 * On revérifie le statut auprès de l'API eBilling avec les credentials du
 * restaurant et on valide le montant. Sans cette étape, n'importe qui ayant
 * initié un paiement de commande peut forger ce callback pour valider sa
 * commande sans paiement réel.
 */
async function handleOrderPaymentWebhook(payment: OrderPaymentWithOrder, payload: EBillingPayload) {
    try {
        // Le payment doit avoir été initié via eBilling (transactionId = bill_id).
        if (!payment.transactionId) {
            console.error('❌ Order payment sans bill_id eBilling:', payment.id)
            return NextResponse.json({ error: 'Cannot verify' }, { status: 503 })
        }

        // Vérifier que le restaurant a des credentials eBilling.
        if (!payment.restaurant.ebillingUsername || !payment.restaurant.ebillingSharedKey) {
            console.error('❌ Restaurant sans config eBilling:', payment.restaurantId)
            return NextResponse.json({ error: 'Cannot verify' }, { status: 503 })
        }

        // Re-interroger eBilling avec les credentials du restaurant.
        const restaurantEBilling = new EBillingService({
            username: payment.restaurant.ebillingUsername,
            sharedKey: payment.restaurant.ebillingSharedKey,
        })

        const verified = await restaurantEBilling.getBill(payment.transactionId)

        if (!verified.success) {
            console.error('❌ Vérification eBilling commande échouée:', verified.error)
            return NextResponse.json({ error: 'Verification failed' }, { status: 503 })
        }

        // Cohérence : le bill récupéré doit pointer vers le même payment.
        if (verified.externalReference && verified.externalReference !== payment.id) {
            console.error('❌ external_reference eBilling mismatch:', {
                expected: payment.id,
                received: verified.externalReference,
            })
            return NextResponse.json({ error: 'Reference mismatch' }, { status: 400 })
        }

        // Validation du montant contre la réponse autoritative.
        if (verified.amount !== undefined && verified.amount !== payment.amount) {
            console.error('❌ Montant eBilling commande mismatch (vérifié):', {
                expected: payment.amount,
                verified: verified.amount,
            })
            return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 })
        }

        // Statut authoritatif depuis eBilling (et non depuis le body).
        const verifiedStatus = (verified.status || '').toString().toUpperCase()

        if (['PAID', 'SUCCESSFUL', 'COMPLETED'].includes(verifiedStatus)) {
            // Marquer le paiement comme réussi
            await prisma.payment.update({
                where: { id: payment.id },
                data: {
                    status: 'paid',
                },
            })

            // Optionnel: changer automatiquement le statut de la commande
            await prisma.order.update({
                where: { id: payment.orderId },
                data: {
                    status: 'preparing', // La commande passe en préparation
                },
            })

            await deductOrderStock(payment.orderId, payment.restaurantId)

            console.log(
                `✅ Paiement commande réussi: ${payment.order.orderNumber}`
            )

            revalidatePath('/dashboard/orders')

            return NextResponse.json({ success: true })
        } else if (['FAILED', 'CANCELLED', 'EXPIRED'].includes(verifiedStatus)) {
            await prisma.payment.update({
                where: { id: payment.id },
                data: {
                    status: 'failed',
                    errorMessage: payload.error_message || 'Paiement échoué',
                },
            })

            // Optionnel: annuler la commande si le paiement échoue
            await prisma.order.update({
                where: { id: payment.orderId },
                data: {
                    status: 'cancelled',
                    notes: 'Annulée - paiement échoué',
                },
            })

            console.log('❌ Paiement commande échoué:', payment.order.orderNumber)

            return NextResponse.json({ success: true })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Erreur handleOrderPaymentWebhook:', error)
        return NextResponse.json(
            { error: 'Erreur traitement webhook' },
            { status: 500 }
        )
    }
}