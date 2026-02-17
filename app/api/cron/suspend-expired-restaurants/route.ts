// app/api/cron/suspend-expired-restaurants/route.ts

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { logSystemAction } from '@/lib/actions/logs'

/**
 * CRON JOB : Suspension automatique des restaurants avec abonnement expiré
 * Fréquence : Toutes les heures
 * Sécurité : Protégé par CRON_SECRET
 */
export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization')
        const token = authHeader?.replace('Bearer ', '')

        if (!token || token !== process.env.CRON_SECRET) {
            console.error('❌ Tentative d\'accès non autorisée au CRON')
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
        }

        console.log('🔄 Démarrage de la suspension des restaurants expirés...')

        const expiredSubscriptions = await prisma.subscription.findMany({
            where: { status: 'expired' },
            include: {
                restaurant: {
                    select: { id: true, name: true, isActive: true },
                },
            },
        })

        const restaurantsToSuspend = expiredSubscriptions.filter(
            sub => sub.restaurant.isActive === true
        )

        if (restaurantsToSuspend.length === 0) {
            console.log('✅ Aucun restaurant à suspendre')
            return NextResponse.json({
                success: true,
                message: 'Aucun restaurant à suspendre',
                suspended: 0,
            })
        }

        console.log(`⚠️ ${restaurantsToSuspend.length} restaurant(s) à suspendre`)

        const suspendedRestaurants = await prisma.$transaction(
            restaurantsToSuspend.map(sub =>
                prisma.restaurant.update({
                    where: { id: sub.restaurantId },
                    data: { isActive: false },
                })
            )
        )

        for (const restaurant of suspendedRestaurants) {
            await logSystemAction(
                'restaurant_suspended_auto',
                {
                    restaurantId: restaurant.id,
                    restaurantName: restaurant.name,
                    reason: 'Abonnement expiré',
                    suspendedAt: new Date().toISOString(),
                },
                'warning'
            )
            console.log(`🔒 Restaurant suspendu : ${restaurant.name}`)
        }

        const result = {
            success: true,
            message: `${suspendedRestaurants.length} restaurant(s) suspendu(s)`,
            suspended: suspendedRestaurants.length,
            restaurants: suspendedRestaurants.map(r => ({ id: r.id, name: r.name })),
            executedAt: new Date().toISOString(),
        }

        console.log('✅ Suspension terminée avec succès')
        return NextResponse.json(result)

    } catch (error) {
        console.error('❌ Erreur suspension restaurants:', error)
        
        await logSystemAction(
            'cron_error',
            {
                task: 'suspend-expired-restaurants',
                error: error instanceof Error ? error.message : 'Erreur inconnue',
            },
            'error'
        )

        return NextResponse.json(
            {
                error: 'Erreur lors de la suspension',
                details: error instanceof Error ? error.message : 'Erreur inconnue',
            },
            { status: 500 }
        )
    }
}