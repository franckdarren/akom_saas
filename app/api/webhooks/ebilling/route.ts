// app/api/webhooks/ebilling/route.ts

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

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
        const payload = await request.json()

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
 * Gère la notification pour un paiement d'abonnement
 */
async function handleSubscriptionPaymentWebhook(
    payment: any,
    payload: any
) {
    try {
        // eBilling envoie le statut du paiement dans le payload
        // Les statuts possibles sont généralement: 'SUCCESSFUL', 'FAILED', 'PENDING'
        const paymentStatus = payload.status || payload.payment_status

        if (paymentStatus === 'SUCCESSFUL') {
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

            console.log(
                `✅ Abonnement activé pour ${payment.subscription.restaurant.name}`
            )

            revalidatePath('/dashboard/subscription')

            return NextResponse.json({ success: true })
        } else if (paymentStatus === 'FAILED') {
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
 * Gère la notification pour un paiement de commande
 */
async function handleOrderPaymentWebhook(payment: any, payload: any) {
    try {
        const paymentStatus = payload.status || payload.payment_status

        if (paymentStatus === 'SUCCESSFUL') {
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

            console.log(
                `✅ Paiement commande réussi: ${payment.order.orderNumber}`
            )

            revalidatePath('/dashboard/orders')

            return NextResponse.json({ success: true })
        } else if (paymentStatus === 'FAILED') {
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