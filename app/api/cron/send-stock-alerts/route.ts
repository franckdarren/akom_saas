// app/api/cron/send-stock-alerts/route.ts

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { logSystemAction } from '@/lib/actions/logs'
import { sendStockAlertEmail } from '@/lib/email/cron-emails'

/**
 * CRON JOB : Envoi d'alertes de stock bas
 * Fréquence : Tous les jours à 9h du matin
 * Logique : Envoie un email récapitulatif des produits sous le seuil d'alerte
 */
export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization')
        const token = authHeader?.replace('Bearer ', '')

        if (!token || token !== process.env.CRON_SECRET) {
            console.error('❌ Tentative d\'accès non autorisée au CRON')
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
        }

        console.log('🔄 Démarrage de l\'envoi des alertes de stock bas...')

        const activeRestaurants = await prisma.restaurant.findMany({
            where: {
                isActive: true,
                subscription: { status: { in: ['trial', 'active'] } },
            },
            select: { id: true, name: true, email: true },
        })

        if (activeRestaurants.length === 0) {
            console.log('✅ Aucun restaurant actif à vérifier')
            return NextResponse.json({
                success: true,
                message: 'Aucun restaurant actif',
                alertsSent: 0,
            })
        }

        console.log(`📊 Vérification de ${activeRestaurants.length} restaurant(s)`)

        let totalAlertsSent = 0
        const alertsDetails = []

        for (const restaurant of activeRestaurants) {
            const allStocks = await prisma.stock.findMany({
                where: { restaurantId: restaurant.id },
                include: {
                    product: {
                        select: {
                            name: true,
                            category: { select: { name: true } },
                        },
                    },
                },
            })

            const lowStockProducts = allStocks.filter(
                stock => stock.quantity <= stock.alertThreshold
            )

            if (lowStockProducts.length === 0) {
                console.log(`✅ ${restaurant.name} : Aucune alerte de stock`)
                continue
            }

            console.log(`⚠️ ${restaurant.name} : ${lowStockProducts.length} produit(s) en alerte`)

            try {
                const stockAlerts = lowStockProducts.map(stock => ({
                    productName: stock.product.name,
                    categoryName: stock.product.category?.name || 'Sans catégorie',
                    currentQuantity: stock.quantity,
                    alertThreshold: stock.alertThreshold,
                    difference: stock.alertThreshold - stock.quantity,
                }))

                await sendStockAlertEmail({
                    to: restaurant.email,
                    restaurantName: restaurant.name,
                    alerts: stockAlerts,
                })

                totalAlertsSent++
                alertsDetails.push({
                    restaurantId: restaurant.id,
                    restaurantName: restaurant.name,
                    alertCount: lowStockProducts.length,
                    emailSent: true,
                })

                await logSystemAction(
                    'stock_alert_sent',
                    {
                        restaurantId: restaurant.id,
                        restaurantName: restaurant.name,
                        alertCount: lowStockProducts.length,
                        products: stockAlerts.map(a => a.productName),
                    },
                    'info'
                )

                console.log(`✅ Email envoyé à ${restaurant.name}`)

            } catch (emailError) {
                console.error(`❌ Erreur envoi email pour ${restaurant.name}:`, emailError)

                alertsDetails.push({
                    restaurantId: restaurant.id,
                    restaurantName: restaurant.name,
                    alertCount: lowStockProducts.length,
                    emailSent: false,
                    error: emailError instanceof Error ? emailError.message : 'Erreur inconnue',
                })

                await logSystemAction(
                    'stock_alert_failed',
                    {
                        restaurantId: restaurant.id,
                        restaurantName: restaurant.name,
                        error: emailError instanceof Error ? emailError.message : 'Erreur inconnue',
                    },
                    'error'
                )
            }
        }

        const result = {
            success: true,
            message: `${totalAlertsSent} alerte(s) de stock envoyée(s)`,
            alertsSent: totalAlertsSent,
            restaurantsChecked: activeRestaurants.length,
            details: alertsDetails,
            executedAt: new Date().toISOString(),
        }

        console.log('✅ Envoi des alertes de stock terminé')
        return NextResponse.json(result)

    } catch (error) {
        console.error('❌ Erreur envoi alertes stock:', error)
        
        await logSystemAction(
            'cron_error',
            { task: 'send-stock-alerts', error: error instanceof Error ? error.message : 'Erreur inconnue' },
            'error'
        )

        return NextResponse.json(
            { error: 'Erreur lors de l\'envoi des alertes', details: error instanceof Error ? error.message : 'Erreur inconnue' },
            { status: 500 }
        )
    }
}