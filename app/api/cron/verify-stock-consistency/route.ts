// app/api/cron/verify-stock-consistency/route.ts

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { logSystemAction } from '@/lib/actions/logs'

/**
 * CRON JOB : Vérification et correction de la cohérence des stocks
 * Fréquence : Tous les jours à 2h du matin
 * Logique : Corrige les incohérences entre disponibilité produit et stock réel
 */
export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization')
        const token = authHeader?.replace('Bearer ', '')

        if (!token || token !== process.env.CRON_SECRET) {
            console.error('❌ Tentative d\'accès non autorisée au CRON')
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
        }

        console.log('🔄 Démarrage de la vérification de cohérence des stocks...')

        const productsAvailableButOutOfStock = await prisma.product.findMany({
            where: {
                isAvailable: true,
                stock: { quantity: { lte: 0 } },
            },
            include: {
                stock: true,
                restaurant: { select: { id: true, name: true } },
            },
        })

        const productsUnavailableButInStock = await prisma.product.findMany({
            where: {
                isAvailable: false,
                stock: { quantity: { gt: 0 } },
            },
            include: {
                stock: true,
                restaurant: { select: { id: true, name: true } },
            },
        })

        const totalInconsistencies =
            productsAvailableButOutOfStock.length +
            productsUnavailableButInStock.length

        if (totalInconsistencies === 0) {
            console.log('✅ Aucune incohérence détectée')
            return NextResponse.json({
                success: true,
                message: 'Tous les stocks sont cohérents',
                inconsistencies: 0,
                corrected: 0,
            })
        }

        console.log(`⚠️ ${totalInconsistencies} incohérence(s) détectée(s)`)

        const corrections = []

        if (productsAvailableButOutOfStock.length > 0) {
            console.log(`🔴 ${productsAvailableButOutOfStock.length} produit(s) à désactiver`)

            for (const product of productsAvailableButOutOfStock) {
                await prisma.product.update({
                    where: { id: product.id },
                    data: { isAvailable: false },
                })

                corrections.push({
                    type: 'disabled',
                    productId: product.id,
                    productName: product.name,
                    restaurantName: product.restaurant.name,
                    currentStock: product.stock?.quantity || 0,
                })

                await logSystemAction(
                    'stock_consistency_fix',
                    {
                        action: 'product_disabled',
                        productId: product.id,
                        productName: product.name,
                        restaurantId: product.restaurantId,
                        restaurantName: product.restaurant.name,
                        reason: 'Rupture de stock détectée',
                        quantity: product.stock?.quantity || 0,
                    },
                    'warning'
                )

                console.log(`   ✓ ${product.name} désactivé`)
            }
        }

        if (productsUnavailableButInStock.length > 0) {
            console.log(`🟢 ${productsUnavailableButInStock.length} produit(s) à réactiver`)

            for (const product of productsUnavailableButInStock) {
                await prisma.product.update({
                    where: { id: product.id },
                    data: { isAvailable: true },
                })

                corrections.push({
                    type: 'enabled',
                    productId: product.id,
                    productName: product.name,
                    restaurantName: product.restaurant.name,
                    currentStock: product.stock?.quantity || 0,
                })

                await logSystemAction(
                    'stock_consistency_fix',
                    {
                        action: 'product_enabled',
                        productId: product.id,
                        productName: product.name,
                        restaurantId: product.restaurantId,
                        restaurantName: product.restaurant.name,
                        reason: 'Stock disponible détecté',
                        quantity: product.stock?.quantity || 0,
                    },
                    'info'
                )

                console.log(`   ✓ ${product.name} réactivé`)
            }
        }

        const result = {
            success: true,
            message: `${corrections.length} incohérence(s) corrigée(s)`,
            inconsistencies: totalInconsistencies,
            corrected: corrections.length,
            details: {
                productsDisabled: productsAvailableButOutOfStock.length,
                productsEnabled: productsUnavailableButInStock.length,
                corrections,
            },
            executedAt: new Date().toISOString(),
        }

        console.log('✅ Vérification de cohérence terminée')
        return NextResponse.json(result)

    } catch (error) {
        console.error('❌ Erreur vérification stocks:', error)
        
        await logSystemAction(
            'cron_error',
            { task: 'verify-stock-consistency', error: error instanceof Error ? error.message : 'Erreur inconnue' },
            'error'
        )

        return NextResponse.json(
            { error: 'Erreur lors de la vérification', details: error instanceof Error ? error.message : 'Erreur inconnue' },
            { status: 500 }
        )
    }
}
