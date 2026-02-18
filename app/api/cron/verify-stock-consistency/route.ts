// app/api/cron/verify-stock-consistency/route.ts

import {NextRequest, NextResponse} from 'next/server'
import prisma from '@/lib/prisma'
import {logSystemAction} from '@/lib/actions/logs'

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * CRON JOB : Vérification et correction de la cohérence des stocks
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Fréquence : Tous les jours à 2h du matin (configurer dans vercel.json)
 *
 * Problème résolu :
 *   Le trigger SQL `decrement_stock_on_preparing` décrémente le stock
 *   quand une commande passe en "preparing". Il peut arriver que
 *   isAvailable ne soit plus synchronisé avec la réalité du stock
 *   (bug réseau, rollback partiel, etc.).
 *   Ce CRON détecte et corrige ces incohérences automatiquement.
 *
 * Deux cas corrigés :
 *   1. Produit "disponible" mais stock = 0  → on le désactive
 *   2. Produit "indisponible" mais stock > 0 → on le réactive
 *
 * Pourquoi filtrer sur productType = 'good' ET hasStock = true ?
 *   Les produits de type 'service' n'ont pas de stock par définition —
 *   leur quantity est toujours 0. Sans ce filtre, TOUS les services
 *   actifs seraient désactivés à tort à chaque exécution.
 *
 * Performance :
 *   ✅ 2 findMany en parallèle (Promise.all)
 *   ✅ updateMany : 1 requête SQL par groupe
 *   ✅ Logs en parallèle (Promise.all)
 */
export async function GET(request: NextRequest) {
    try {
        // ── Vérification du token ───────────────────────────────────────────
        const authHeader = request.headers.get('authorization')
        const token = authHeader?.replace('Bearer ', '')

        if (!token || token !== process.env.CRON_SECRET) {
            console.error("❌ Tentative d'accès non autorisée au CRON")
            return NextResponse.json({error: 'Non autorisé'}, {status: 401})
        }

        console.log('🔄 Démarrage de la vérification de cohérence des stocks...')

        // ── Filtre commun ────────────────────────────────────────────────────
        // Restreint aux produits physiques avec gestion de stock activée.
        // Les services sont exclus pour éviter les faux positifs.
        const physicalProductFilter = {
            productType: 'good' as const,
            hasStock: true,
        }

        // ── 1. Détection des incohérences en parallèle ──────────────────────
        const [productsAvailableButOutOfStock, productsUnavailableButInStock] =
            await Promise.all([
                // Cas 1 : disponible mais stock épuisé → le produit s'affiche
                // sur le menu mais ne peut pas être servi
                prisma.product.findMany({
                    where: {
                        ...physicalProductFilter,
                        isAvailable: true,
                        stock: {quantity: {lte: 0}},
                    },
                    include: {
                        stock: true,
                        restaurant: {select: {id: true, name: true}},
                    },
                }),

                // Cas 2 : indisponible mais stock présent → le produit est caché
                // du menu alors qu'il pourrait être vendu
                prisma.product.findMany({
                    where: {
                        ...physicalProductFilter,
                        isAvailable: false,
                        stock: {quantity: {gt: 0}},
                    },
                    include: {
                        stock: true,
                        restaurant: {select: {id: true, name: true}},
                    },
                }),
            ])

        const totalInconsistencies =
            productsAvailableButOutOfStock.length +
            productsUnavailableButInStock.length

        // Rien à corriger → sortie rapide
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

        // ── 2. Désactivation des produits sans stock ─────────────────────────
        // updateMany : 1 seule requête SQL pour tous les produits du groupe
        if (productsAvailableButOutOfStock.length > 0) {
            console.log(`🔴 ${productsAvailableButOutOfStock.length} produit(s) à désactiver`)
            await prisma.product.updateMany({
                where: {id: {in: productsAvailableButOutOfStock.map((p) => p.id)}},
                data: {isAvailable: false},
            })
        }

        // ── 3. Réactivation des produits avec stock ──────────────────────────
        if (productsUnavailableButInStock.length > 0) {
            console.log(`🟢 ${productsUnavailableButInStock.length} produit(s) à réactiver`)
            await prisma.product.updateMany({
                where: {id: {in: productsUnavailableButInStock.map((p) => p.id)}},
                data: {isAvailable: true},
            })
        }

        // ── 4. Logs système en parallèle ────────────────────────────────────
        // On spread les deux tableaux dans un seul Promise.all pour tout
        // écrire en une seule vague, sans attendre que chaque log termine
        await Promise.all([
            ...productsAvailableButOutOfStock.map((p) =>
                logSystemAction(
                    'stock_consistency_fix',
                    {
                        action: 'product_disabled',
                        productId: p.id,
                        productName: p.name,
                        restaurantId: p.restaurantId,
                        restaurantName: p.restaurant.name,
                        reason: 'Rupture de stock détectée',
                        quantity: p.stock?.quantity || 0,
                    },
                    'warning'
                )
            ),
            ...productsUnavailableButInStock.map((p) =>
                logSystemAction(
                    'stock_consistency_fix',
                    {
                        action: 'product_enabled',
                        productId: p.id,
                        productName: p.name,
                        restaurantId: p.restaurantId,
                        restaurantName: p.restaurant.name,
                        reason: 'Stock disponible détecté',
                        quantity: p.stock?.quantity || 0,
                    },
                    'info'
                )
            ),
        ])

        // ── 5. Rapport de réponse ────────────────────────────────────────────
        const corrections = [
            ...productsAvailableButOutOfStock.map((p) => ({
                type: 'disabled',
                productId: p.id,
                productName: p.name,
                restaurantName: p.restaurant.name,
                currentStock: p.stock?.quantity || 0,
            })),
            ...productsUnavailableButInStock.map((p) => ({
                type: 'enabled',
                productId: p.id,
                productName: p.name,
                restaurantName: p.restaurant.name,
                currentStock: p.stock?.quantity || 0,
            })),
        ]

        console.log('✅ Vérification de cohérence terminée')
        return NextResponse.json({
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
        })
    } catch (error) {
        console.error('❌ Erreur vérification stocks:', error)

        await logSystemAction(
            'cron_error',
            {
                task: 'verify-stock-consistency',
                error: error instanceof Error ? error.message : 'Erreur inconnue',
            },
            'error'
        )

        return NextResponse.json(
            {
                error: 'Erreur lors de la vérification',
                details: error instanceof Error ? error.message : 'Erreur inconnue',
            },
            {status: 500}
        )
    }
}