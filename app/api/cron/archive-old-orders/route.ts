// app/api/cron/archive-old-orders/route.ts

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { logSystemAction } from '@/lib/actions/logs'

/**
 * CRON JOB : Archivage des anciennes commandes
 * Fréquence : Tous les jours à 2h du matin
 * Logique : Archive les commandes terminées depuis plus de 90 jours
 * Note : Nécessite le champ isArchived dans le modèle Order
 */
export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization')
        const token = authHeader?.replace('Bearer ', '')

        if (!token || token !== process.env.CRON_SECRET) {
            console.error('❌ Tentative d\'accès non autorisée au CRON')
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
        }

        console.log('🔄 Démarrage de l\'archivage des anciennes commandes...')

        const ninetyDaysAgo = new Date()
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

        console.log(`📅 Date limite : ${ninetyDaysAgo.toISOString()}`)

        try {
            await prisma.order.findFirst({
                where: { isArchived: false },
                select: { id: true },
            })
        } catch (fieldError) {
            console.warn('⚠️ Le champ isArchived n\'existe pas encore')
            return NextResponse.json({
                success: false,
                message: 'Champ isArchived manquant',
                archived: 0,
                suggestion: 'Ajoutez "isArchived Boolean @default(false)" au modèle Order',
            })
        }

        const ordersToArchive = await prisma.order.findMany({
            where: {
                status: { in: ['delivered', 'cancelled'] },
                updatedAt: { lt: ninetyDaysAgo },
                isArchived: false,
            },
            select: {
                id: true,
                orderNumber: true,
                status: true,
                totalAmount: true,
                updatedAt: true,
                restaurant: { select: { id: true, name: true } },
            },
        })

        if (ordersToArchive.length === 0) {
            console.log('✅ Aucune commande à archiver')
            return NextResponse.json({
                success: true,
                message: 'Aucune commande nécessite d\'archivage',
                archived: 0,
            })
        }

        console.log(`📦 ${ordersToArchive.length} commande(s) à archiver`)

        const BATCH_SIZE = 100
        let totalArchived = 0
        const batches = Math.ceil(ordersToArchive.length / BATCH_SIZE)

        for (let i = 0; i < batches; i++) {
            const start = i * BATCH_SIZE
            const end = start + BATCH_SIZE
            const batch = ordersToArchive.slice(start, end)

            const orderIds = batch.map(order => order.id)

            await prisma.order.updateMany({
                where: { id: { in: orderIds } },
                data: { isArchived: true, updatedAt: new Date() },
            })

            totalArchived += batch.length
            console.log(`   ✓ Lot ${i + 1}/${batches} : ${batch.length} commande(s)`)
        }

        const statsByRestaurant = ordersToArchive.reduce((acc, order) => {
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
        }, {} as Record<string, { restaurantName: string; count: number; totalAmount: number }>)

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

        const result = {
            success: true,
            message: `${totalArchived} commande(s) archivée(s)`,
            archived: totalArchived,
            batches,
            dateThreshold: ninetyDaysAgo.toISOString(),
            statsByRestaurant,
            executedAt: new Date().toISOString(),
        }

        console.log('✅ Archivage terminé')
        return NextResponse.json(result)

    } catch (error) {
        console.error('❌ Erreur archivage commandes:', error)
        
        await logSystemAction(
            'cron_error',
            { task: 'archive-old-orders', error: error instanceof Error ? error.message : 'Erreur inconnue' },
            'error'
        )

        return NextResponse.json(
            { error: 'Erreur lors de l\'archivage', details: error instanceof Error ? error.message : 'Erreur inconnue' },
            { status: 500 }
        )
    }
}