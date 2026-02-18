// app/api/cron/archive-old-orders/route.ts

import {NextRequest, NextResponse} from 'next/server'
import prisma from '@/lib/prisma'
import {logSystemAction} from '@/lib/actions/logs'

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * CRON JOB : Archivage des anciennes commandes
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Fréquence : Tous les jours à 2h du matin (configurer dans vercel.json)
 *
 * Logique :
 *   Marque comme archivées (isArchived = true) toutes les commandes
 *   dont le statut est "delivered" ou "cancelled" et qui n'ont pas
 *   été modifiées depuis 90 jours.
 *
 * Pourquoi archiver plutôt que supprimer ?
 *   - Conservation des données pour les statistiques historiques
 *   - Conformité légale (traçabilité des transactions)
 *   - Les commandes archivées sont simplement exclues des vues courantes
 *     via le filtre isArchived: false dans les autres requêtes
 *
 * Pourquoi traiter par lots (BATCH_SIZE = 100) ?
 *   - Évite de verrouiller la table "orders" trop longtemps
 *   - Réduit la consommation mémoire sur de gros volumes
 *   - Permet de logguer la progression lot par lot
 *
 * Prérequis :
 *   Le champ `isArchived Boolean @default(false)` doit exister
 *   dans le modèle Order du schema.prisma. ✅ C'est le cas.
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

        console.log("🔄 Démarrage de l'archivage des anciennes commandes...")

        // ── Calcul de la date seuil ─────────────────────────────────────────
        // Toute commande dont updatedAt est antérieur à cette date
        // et dont le statut est terminal sera archivée
        const ninetyDaysAgo = new Date()
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

        console.log(`📅 Date limite : ${ninetyDaysAgo.toISOString()}`)

        // ── 1. Recherche des commandes à archiver ───────────────────────────
        // On utilise select (pas include) pour ne charger que ce dont on a besoin :
        // les IDs pour le updateMany, et les données restaurant pour les stats
        const ordersToArchive = await prisma.order.findMany({
            where: {
                status: {in: ['delivered', 'cancelled']}, // Statuts terminaux uniquement
                updatedAt: {lt: ninetyDaysAgo},           // Pas modifiée depuis 90 jours
                isArchived: false,                           // Pas déjà archivée
            },
            select: {
                id: true,
                orderNumber: true,
                status: true,
                totalAmount: true,
                updatedAt: true,
                restaurant: {select: {id: true, name: true}},
            },
        })

        if (ordersToArchive.length === 0) {
            console.log('✅ Aucune commande à archiver')
            return NextResponse.json({
                success: true,
                message: "Aucune commande nécessite d'archivage",
                archived: 0,
            })
        }

        console.log(`📦 ${ordersToArchive.length} commande(s) à archiver`)

        // ── 2. Archivage par lots ───────────────────────────────────────────
        const BATCH_SIZE = 100
        let totalArchived = 0
        const batches = Math.ceil(ordersToArchive.length / BATCH_SIZE)

        for (let i = 0; i < batches; i++) {
            const batch = ordersToArchive.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE)
            const orderIds = batch.map((order) => order.id)

            // updateMany : une seule requête SQL pour tout le lot
            // On met aussi à jour updatedAt pour tracer la date d'archivage
            await prisma.order.updateMany({
                where: {id: {in: orderIds}},
                data: {isArchived: true, updatedAt: new Date()},
            })

            totalArchived += batch.length
            console.log(`   ✓ Lot ${i + 1}/${batches} : ${batch.length} commande(s)`)
        }

        // ── 3. Calcul des statistiques par restaurant ───────────────────────
        // Utile pour le log système : on sait combien chaque restaurant
        // a eu de commandes archivées et quel CA elles représentent
        const statsByRestaurant = ordersToArchive.reduce(
            (acc, order) => {
                const rid = order.restaurant.id
                if (!acc[rid]) {
                    acc[rid] = {
                        restaurantName: order.restaurant.name,
                        count: 0,
                        totalAmount: 0,
                    }
                }
                acc[rid].count++
                acc[rid].totalAmount += order.totalAmount
                return acc
            },
            {} as Record<string, { restaurantName: string; count: number; totalAmount: number }>
        )

        // ── 4. Log système ──────────────────────────────────────────────────
        await logSystemAction(
            'orders_archived',
            {
                totalArchived,
                dateThreshold: ninetyDaysAgo.toISOString(),
                batches,
                restaurants: Object.keys(statsByRestaurant).length,
                statsByRestaurant,
            },
            'info'
        )

        console.log('✅ Archivage terminé')
        return NextResponse.json({
            success: true,
            message: `${totalArchived} commande(s) archivée(s)`,
            archived: totalArchived,
            batches,
            dateThreshold: ninetyDaysAgo.toISOString(),
            statsByRestaurant,
            executedAt: new Date().toISOString(),
        })
    } catch (error) {
        console.error('❌ Erreur archivage commandes:', error)

        await logSystemAction(
            'cron_error',
            {
                task: 'archive-old-orders',
                error: error instanceof Error ? error.message : 'Erreur inconnue',
            },
            'error'
        )

        return NextResponse.json(
            {
                error: "Erreur lors de l'archivage",
                details: error instanceof Error ? error.message : 'Erreur inconnue',
            },
            {status: 500}
        )
    }
}