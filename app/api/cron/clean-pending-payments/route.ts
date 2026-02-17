// app/api/cron/clean-pending-payments/route.ts

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { logSystemAction } from '@/lib/actions/logs'

/**
 * CRON JOB : Nettoyage des paiements en attente expirés
 * Fréquence : Toutes les heures
 * Logique : Expire les paiements manuels en "pending" depuis plus de 7 jours
 */
export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization')
        const token = authHeader?.replace('Bearer ', '')

        if (!token || token !== process.env.CRON_SECRET) {
            console.error('❌ Tentative d\'accès non autorisée au CRON')
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
        }

        console.log('🔄 Démarrage du nettoyage des paiements en attente...')

        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

        const expiredPayments = await prisma.subscriptionPayment.findMany({
            where: {
                status: 'pending',
                method: 'manual',
                createdAt: { lt: sevenDaysAgo },
            },
            include: {
                restaurant: { select: { id: true, name: true } },
                subscription: { select: { id: true, plan: true } },
            },
        })

        if (expiredPayments.length === 0) {
            console.log('✅ Aucun paiement à expirer')
            return NextResponse.json({
                success: true,
                message: 'Aucun paiement en attente à expirer',
                expired: 0,
            })
        }

        console.log(`⚠️ ${expiredPayments.length} paiement(s) à expirer`)

        const updatedPayments = await prisma.$transaction(
            expiredPayments.map(payment =>
                prisma.subscriptionPayment.update({
                    where: { id: payment.id },
                    data: { status: 'expired', updatedAt: new Date() },
                })
            )
        )

        for (const payment of expiredPayments) {
            await logSystemAction(
                'payment_expired_auto',
                {
                    paymentId: payment.id,
                    restaurantId: payment.restaurantId,
                    restaurantName: payment.restaurant.name,
                    amount: payment.amount,
                    billingCycle: payment.billingCycle,
                    daysPending: Math.floor(
                        (Date.now() - payment.createdAt.getTime()) / (1000 * 60 * 60 * 24)
                    ),
                },
                'warning'
            )
            console.log(`⏰ Paiement expiré : ${payment.restaurant.name} - ${payment.amount} FCFA`)
        }

        const result = {
            success: true,
            message: `${updatedPayments.length} paiement(s) expiré(s)`,
            expired: updatedPayments.length,
            payments: updatedPayments.map(p => {
                const original = expiredPayments.find(ep => ep.id === p.id)
                return {
                    id: p.id,
                    restaurantName: original?.restaurant.name,
                    amount: p.amount,
                    billingCycle: p.billingCycle,
                }
            }),
            executedAt: new Date().toISOString(),
        }

        console.log('✅ Nettoyage des paiements terminé')
        return NextResponse.json(result)

    } catch (error) {
        console.error('❌ Erreur nettoyage paiements:', error)
        
        await logSystemAction(
            'cron_error',
            { task: 'clean-pending-payments', error: error instanceof Error ? error.message : 'Erreur inconnue' },
            'error'
        )

        return NextResponse.json(
            { error: 'Erreur lors du nettoyage', details: error instanceof Error ? error.message : 'Erreur inconnue' },
            { status: 500 }
        )
    }
}