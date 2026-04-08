// app/api/cron/cancel-abandoned-orders/route.ts

import {NextRequest, NextResponse} from 'next/server'
import prisma from '@/lib/prisma'
import {logSystemAction} from '@/lib/actions/logs'

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * CRON JOB : Annulation des commandes abandonnées
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Fréquence : Toutes les 15 minutes (configurer dans vercel.json)
 *
 * Logique :
 *   Une commande "pending" depuis plus de 4 heures est considérée
 *   abandonnée (client parti, problème réseau, etc.). Ce CRON les
 *   annule automatiquement pour garder le dashboard propre.
 *
 * Pourquoi 4 heures ?
 *   C'est un délai raisonnable pour un restaurant : couvre les services
 *   du midi et du soir sans risquer d'annuler des commandes légitimes.
 *   Ajustable selon ton contexte métier.
 *
 * Pourquoi on filtre isArchived: false ?
 *   Les commandes déjà archivées (> 90 jours) ne doivent pas être
 *   retraitées. Ce filtre évite de modifier des données historiques.
 *
 * Corrections apportées vs version originale :
 *   ✅ $transaction(N updates) → updateMany : 1 requête SQL au lieu de N
 *   ✅ Logs en parallèle avec Promise.all au lieu du for...of séquentiel
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

        console.log("🔄 Démarrage de l'annulation des commandes abandonnées...")

        // ── Calcul du seuil de temps ────────────────────────────────────────
        const fourHoursAgo = new Date()
        fourHoursAgo.setHours(fourHoursAgo.getHours() - 4)

        // ── 1. Recherche des commandes abandonnées ──────────────────────────
        // On utilise select (plus léger qu'include) : on ne charge que
        // les champs nécessaires pour l'annulation et le log
        const abandonedOrders = await prisma.order.findMany({
            where: {
                status: { in: ['pending', 'awaiting_payment'] },
                createdAt: {lt: fourHoursAgo},     // Plus vieille que 4h
                isArchived: false,                    // Pas encore archivée
                restaurant: {isActive: true},       // Restaurant encore actif
            },
            select: {
                id: true,
                orderNumber: true,
                restaurantId: true,
                totalAmount: true,
                createdAt: true,
                table: {select: {number: true}},
                restaurant: {select: {id: true, name: true}},
                orderItems: {select: {id: true}}, // Juste pour compter les items
            },
        })

        if (abandonedOrders.length === 0) {
            console.log('✅ Aucune commande abandonnée à annuler')
            return NextResponse.json({
                success: true,
                message: 'Aucune commande abandonnée détectée',
                cancelled: 0,
            })
        }

        console.log(`⚠️ ${abandonedOrders.length} commande(s) abandonnée(s)`)

        // ── 2. Annulation en une seule requête ──────────────────────────────
        // ✅ updateMany : 1 requête SQL pour toutes les commandes
        // L'ancienne version utilisait $transaction(N updates) ce qui
        // générait N requêtes individuelles dans une transaction — plus lent
        await prisma.order.updateMany({
            where: {id: {in: abandonedOrders.map((o) => o.id)}},
            data: {
                status: 'cancelled',
                updatedAt: new Date(),
            },
        })

        // ── 3. Construction du rapport et logs en parallèle ─────────────────
        // ✅ Promise.all : tous les logSystemAction sont lancés simultanément
        const details = abandonedOrders.map((order) => {
            const minutesOld = Math.floor(
                (Date.now() - order.createdAt.getTime()) / (1000 * 60)
            )
            const safeOrderNumber = order.orderNumber ?? `CMD-${order.id.slice(0, 6)}`

            console.log(`🗑️ Commande ${safeOrderNumber} annulée (${minutesOld}min)`)

            return {
                orderId: order.id,
                orderNumber: safeOrderNumber,
                restaurantName: order.restaurant.name,
                tableNumber: order.table?.number ?? null,
                totalAmount: order.totalAmount,
                minutesOld,
                itemsCount: order.orderItems.length,
            }
        })

        // Logs en parallèle — on n'attend pas l'un pour commencer l'autre
        await Promise.all(
            details.map((d) =>
                logSystemAction(
                    'order_cancelled_auto',
                    {
                        orderId: d.orderId,
                        orderNumber: d.orderNumber,
                        restaurantId: abandonedOrders.find((o) => o.id === d.orderId)
                            ?.restaurantId,
                        restaurantName: d.restaurantName,
                        tableNumber: d.tableNumber,
                        totalAmount: d.totalAmount,
                        itemsCount: d.itemsCount,
                        minutesOld: d.minutesOld,
                        reason: 'Commande abandonnée (> 4 heures)',
                    },
                    'warning'
                )
            )
        )

        console.log('✅ Annulation des commandes terminée')
        return NextResponse.json({
            success: true,
            message: `${abandonedOrders.length} commande(s) annulée(s)`,
            cancelled: abandonedOrders.length,
            details,
            executedAt: new Date().toISOString(),
        })
    } catch (error) {
        console.error('❌ Erreur annulation commandes:', error)

        await logSystemAction(
            'cron_error',
            {
                task: 'cancel-abandoned-orders',
                error: error instanceof Error ? error.message : 'Erreur inconnue',
            },
            'error'
        )

        return NextResponse.json(
            {
                error: "Erreur lors de l'annulation",
                details: error instanceof Error ? error.message : 'Erreur inconnue',
            },
            {status: 500}
        )
    }
}