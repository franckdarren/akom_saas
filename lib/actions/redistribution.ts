// lib/actions/redistribution.ts
'use server'

import prisma from '@/lib/prisma'

/**
 * GESTION DE LA REDISTRIBUTION AUX RESTAURANTS
 * 
 * Ce fichier gère le reversement de l'argent des commandes
 * du compte Akôm vers les comptes des restaurants.
 */

// ============================================================
// TYPES
// ============================================================

export interface RestaurantBalance {
    restaurantId: string
    restaurantName: string
    // Montants financiers
    totalDue: number // Montant total à reverser depuis le début
    paidAmount: number // Montant déjà reversé
    pendingAmount: number // Montant en attente de reversement
    // Statistiques
    pendingPaymentsCount: number // Nombre de paiements en attente
    totalPaymentsCount: number // Nombre total de paiements
    // Dates
    oldestPendingPayment?: Date // Date du plus ancien paiement non redistribué
    lastRedistribution?: Date // Date de la dernière redistribution
    // Coordonnées de redistribution
    preferredMethod: string
    mobileMoneyNumber?: string
    mobileMoneyOperator?: string
    bankAccountNumber?: string
}

export interface PaymentToRedistribute {
    id: string
    orderId: string
    orderNumber: string
    amount: number // Montant total du paiement
    restaurantAmount: number // Montant à reverser au restaurant
    akomCommission: number // Commission Akôm
    transactionFees: number // Frais eBilling
    createdAt: Date
    phoneNumber?: string
}

// ============================================================
// RÉCUPÉRER LES SOLDES DES RESTAURANTS
// ============================================================

export async function getRestaurantsBalances(): Promise<RestaurantBalance[]> {
    /**
     * Récupère tous les paiements confirmés (status = 'paid')
     * et les groupe par restaurant pour calculer les montants dus
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
                    preferredRedistributionMethod: true,
                    mobileMoneyNumber: true,
                    mobileMoneyOperator: true,
                    bankAccountNumber: true,
                },
            },
            order: {
                select: {
                    orderNumber: true,
                },
            },
        },
        orderBy: {
            createdAt: 'asc',
        },
    })

    // Grouper les paiements par restaurant
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
                pendingPaymentsCount: 0,
                totalPaymentsCount: 0,
                preferredMethod: payment.restaurant.preferredRedistributionMethod,
                mobileMoneyNumber: payment.restaurant.mobileMoneyNumber || undefined,
                mobileMoneyOperator: payment.restaurant.mobileMoneyOperator || undefined,
                bankAccountNumber: payment.restaurant.bankAccountNumber || undefined,
            })
        }

        const balance = balanceMap.get(restaurantId)!

        // Extraire le montant qui revient au restaurant depuis metadata
        const metadata = payment.metadata as any
        const restaurantAmount = metadata?.restaurantAmount || payment.amount

        balance.totalDue += restaurantAmount
        balance.totalPaymentsCount += 1

        // Vérifier si déjà redistribué
        if (payment.redistributedAt) {
            balance.paidAmount += restaurantAmount
            
            if (!balance.lastRedistribution || payment.redistributedAt > balance.lastRedistribution) {
                balance.lastRedistribution = payment.redistributedAt
            }
        } else {
            balance.pendingAmount += restaurantAmount
            balance.pendingPaymentsCount += 1
            
            if (!balance.oldestPendingPayment || payment.createdAt < balance.oldestPendingPayment) {
                balance.oldestPendingPayment = payment.createdAt
            }
        }
    }

    // Trier par montant en attente décroissant
    return Array.from(balanceMap.values())
        .filter(balance => balance.pendingAmount > 0) // Seulement les restaurants avec de l'argent en attente
        .sort((a, b) => b.pendingAmount - a.pendingAmount)
}

// ============================================================
// RÉCUPÉRER LES PAIEMENTS EN ATTENTE POUR UN RESTAURANT
// ============================================================

export async function getPendingPaymentsForRestaurant(
    restaurantId: string
): Promise<PaymentToRedistribute[]> {
    const payments = await prisma.payment.findMany({
        where: {
            restaurantId,
            status: 'paid',
            redistributedAt: null,
        },
        include: {
            order: {
                select: {
                    orderNumber: true,
                },
            },
        },
        orderBy: {
            createdAt: 'asc',
        },
    })

    return payments.map(payment => {
        const metadata = payment.metadata as any
        
        return {
            id: payment.id,
            orderId: payment.orderId,
            orderNumber: payment.order.orderNumber || 'N/A',
            amount: payment.amount,
            restaurantAmount: metadata?.restaurantAmount || payment.amount,
            akomCommission: metadata?.akomCommission || 0,
            transactionFees: metadata?.transactionFees || 0,
            createdAt: payment.createdAt,
            phoneNumber: payment.phoneNumber || undefined,
        }
    })
}

// ============================================================
// MARQUER LES PAIEMENTS COMME REDISTRIBUÉS
// ============================================================

export interface MarkAsRedistributedParams {
    restaurantId: string
    paymentIds: string[]
    redistributionMethod: 'mobile_money' | 'bank_transfer' | 'cash'
    redistributionRef?: string // Numéro de transaction ou référence virement
    notes?: string
}

export async function markPaymentsAsRedistributed(
    params: MarkAsRedistributedParams
) {
    try {
        const now = new Date()

        // Mettre à jour tous les paiements concernés
        await prisma.payment.updateMany({
            where: {
                id: { in: params.paymentIds },
                restaurantId: params.restaurantId,
                status: 'paid',
                redistributedAt: null, // Seulement ceux pas encore redistribués
            },
            data: {
                redistributedAt: now,
                redistributionMethod: params.redistributionMethod,
                redistributionRef: params.redistributionRef,
            },
        })

        return { 
            success: true,
            message: `${params.paymentIds.length} paiement(s) marqué(s) comme redistribué(s)`
        }
    } catch (error) {
        console.error('Erreur marquage redistribution:', error)
        return { 
            error: 'Erreur lors du marquage de la redistribution' 
        }
    }
}

// ============================================================
// STATISTIQUES GLOBALES DE REDISTRIBUTION
// ============================================================

export interface RedistributionStats {
    totalPendingAmount: number // Montant total en attente de redistribution
    totalPendingPayments: number // Nombre de paiements en attente
    totalRedistributedToday: number // Montant redistribué aujourd'hui
    totalRedistributedThisWeek: number // Montant redistribué cette semaine
    totalRedistributedThisMonth: number // Montant redistribué ce mois
    restaurantsWithPendingPayments: number // Nombre de restaurants en attente
}

export async function getRedistributionStats(): Promise<RedistributionStats> {
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // Paiements en attente
    const pendingPayments = await prisma.payment.findMany({
        where: {
            status: 'paid',
            redistributedAt: null,
        },
        select: {
            metadata: true,
            amount: true,
            restaurantId: true,
        },
    })

    const totalPendingAmount = pendingPayments.reduce((sum, p) => {
        const metadata = p.metadata as any
        return sum + (metadata?.restaurantAmount || p.amount)
    }, 0)

    const uniqueRestaurants = new Set(pendingPayments.map(p => p.restaurantId))

    // Montants redistribués
    const getRedistributedAmount = async (startDate: Date) => {
        const payments = await prisma.payment.findMany({
            where: {
                status: 'paid',
                redistributedAt: {
                    gte: startDate,
                },
            },
            select: {
                metadata: true,
                amount: true,
            },
        })

        return payments.reduce((sum, p) => {
            const metadata = p.metadata as any
            return sum + (metadata?.restaurantAmount || p.amount)
        }, 0)
    }

    const [redistributedToday, redistributedWeek, redistributedMonth] = await Promise.all([
        getRedistributedAmount(startOfDay),
        getRedistributedAmount(startOfWeek),
        getRedistributedAmount(startOfMonth),
    ])

    return {
        totalPendingAmount,
        totalPendingPayments: pendingPayments.length,
        totalRedistributedToday: redistributedToday,
        totalRedistributedThisWeek: redistributedWeek,
        totalRedistributedThisMonth: redistributedMonth,
        restaurantsWithPendingPayments: uniqueRestaurants.size,
    }
}