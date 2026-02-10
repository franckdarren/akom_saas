// lib/actions/redistribution.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { isSuperAdmin } from './auth'

/**
 * TABLEAU DE BORD DE REDISTRIBUTION
 * 
 * Affiche combien vous devez à chaque restaurant et permet
 * de marquer les paiements comme "redistribués" une fois
 * que vous avez effectué le virement.
 */

interface RestaurantBalance {
    restaurantId: string
    restaurantName: string
    totalDue: number // Montant total à reverser
    paidAmount: number // Montant déjà reversé
    pendingAmount: number // Montant en attente de reversement
    transactionsCount: number
    lastPayment?: Date
}

export async function getRestaurantsBalances(): Promise<RestaurantBalance[]> {
    // Vérifier que c'est un SuperAdmin
    const isSuperAdminUser = await isSuperAdmin()
    if (!isSuperAdminUser) {
        throw new Error('Accès refusé')
    }

    /**
     * Récupérer tous les paiements confirmés
     * 
     * On ne s'intéresse qu'aux paiements de commandes (pas aux abonnements)
     * qui ont été payés avec succès.
     */
    const payments = await prisma.payment.findMany({
        where: {
            status: 'paid',
        },
        include: {
            restaurant: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
    })

    /**
     * Grouper par restaurant et calculer les montants
     */
    const balanceMap = new Map<string, RestaurantBalance>()

    for (const payment of payments) {
        const restaurantId = payment.restaurantId
        
        if (!balanceMap.has(restaurantId)) {
            balanceMap.set(restaurantId, {
                restaurantId,
                restaurantName: payment.restaurant.name,
                totalDue: 0,
                paidAmount: 0,
                pendingAmount: 0,
                transactionsCount: 0,
            })
        }

        const balance = balanceMap.get(restaurantId)!
        
        /**
         * Extraire le montant qui revient au restaurant
         * 
         * Dans notre metadata, nous avons stocké la décomposition.
         * Le montant qui revient au restaurant est dans restaurantAmount.
         */
        const metadata = payment.metadata as any
        const restaurantAmount = metadata?.restaurantAmount || payment.amount

        balance.totalDue += restaurantAmount
        balance.transactionsCount += 1

        /**
         * NOUVEAU CHAMP À AJOUTER : redistributedAt
         * 
         * Ce champ dans la table payments permet de savoir
         * si ce paiement a déjà été reversé au restaurant.
         */
        if (payment.redistributedAt) {
            balance.paidAmount += restaurantAmount
        } else {
            balance.pendingAmount += restaurantAmount
        }

        if (payment.redistributedAt && (!balance.lastPayment || payment.redistributedAt > balance.lastPayment)) {
            balance.lastPayment = payment.redistributedAt
        }
    }

    return Array.from(balanceMap.values()).sort((a, b) => b.pendingAmount - a.pendingAmount)
}

/**
 * Marquer les paiements d'un restaurant comme redistribués
 * 
 * À appeler après avoir effectué le virement au restaurant.
 */
export async function markPaymentsAsRedistributed(
    restaurantId: string,
    paymentIds: string[]
) {
    const isSuperAdminUser = await isSuperAdmin()
    if (!isSuperAdminUser) {
        throw new Error('Accès refusé')
    }

    try {
        await prisma.payment.updateMany({
            where: {
                id: { in: paymentIds },
                restaurantId: restaurantId,
                status: 'paid',
                redistributedAt: null, // Seulement ceux pas encore redistribués
            },
            data: {
                redistributedAt: new Date(),
            },
        })

        return { success: true }
    } catch (error) {
        console.error('Erreur marquage redistribution:', error)
        return { error: 'Erreur lors du marquage' }
    }
}