// lib/actions/subscription.ts
'use server'

import prisma from '@/lib/prisma'
import {revalidatePath} from 'next/cache'
import type {SubscriptionPlan, BillingCycle} from '@/lib/config/subscription'
import {
    SUBSCRIPTION_CONFIG,
    calculateMonthlyPrice,
    calculateTotalPrice,
} from '@/lib/config/subscription'

/**
 * Interface pour la création d'un paiement manuel
 *
 * NOUVEAU : Inclut maintenant userCount pour enregistrer
 * le nombre d'utilisateurs pour lesquels le paiement est effectué
 */
interface CreateManualPaymentInput {
    restaurantId: string
    plan: SubscriptionPlan
    billingCycle: BillingCycle
    userCount: number         // NOUVEAU : nombre d'utilisateurs
    proofUrl: string
    notes?: string
}

/**
 * Crée un nouveau paiement manuel en attente de validation
 *
 * MODIFICATIONS :
 * - Accepte maintenant userCount dans les paramètres
 * - Calcule le montant basé sur le nombre d'utilisateurs
 * - Stocke userCount dans la table subscription_payments
 * - Met à jour active_users_count dans la subscription
 */
export async function createManualPayment(input: CreateManualPaymentInput) {
    try {
        const {
            restaurantId,
            plan,
            billingCycle,
            userCount,
            proofUrl,
            notes,
        } = input

        // ============================================================
        // ÉTAPE 1 : Valider les données d'entrée
        // ============================================================

        // Valider que le plan existe
        if (!['starter', 'business', 'premium'].includes(plan)) {
            return {
                success: false,
                error: 'Plan invalide',
            }
        }

        // Valider que le cycle est valide
        if (![1, 3, 6, 12].includes(billingCycle)) {
            return {
                success: false,
                error: 'Cycle de facturation invalide',
            }
        }

        // Valider le nombre d'utilisateurs
        if (userCount < 1) {
            return {
                success: false,
                error: 'Le nombre d\'utilisateurs doit être au minimum 1',
            }
        }

        // Valider que le nombre d'utilisateurs respecte la limite du plan
        const planConfig = SUBSCRIPTION_CONFIG[plan]
        const maxUsers = planConfig.userPricing.maxUsers

        if (maxUsers !== 'unlimited' && userCount > maxUsers) {
            return {
                success: false,
                error: `Le plan ${plan} permet un maximum de ${maxUsers} utilisateurs`,
            }
        }

        // ============================================================
        // ÉTAPE 2 : Calculer le montant total
        // ============================================================

        // Calculer le montant total en tenant compte du nombre d'utilisateurs
        // ET du cycle de facturation (avec réductions éventuelles)
        const amount = calculateTotalPrice(plan, userCount, billingCycle)

        // Calculer la date d'expiration (début de période + durée du cycle)
        const now = new Date()
        const expiresAt = new Date(now)
        expiresAt.setMonth(expiresAt.getMonth() + billingCycle)

        // ============================================================
        // ÉTAPE 3 : Récupérer l'abonnement existant
        // ============================================================

        const subscription = await prisma.subscription.findUnique({
            where: {restaurantId},
        })

        if (!subscription) {
            return {
                success: false,
                error: 'Aucun abonnement trouvé pour ce restaurant',
            }
        }

        // ============================================================
        // ÉTAPE 4 : Créer le paiement en base de données
        // ============================================================

        const payment = await prisma.subscriptionPayment.create({
            data: {
                subscriptionId: subscription.id,
                restaurantId,
                amount,
                method: 'manual', // Paiement manuel (Mobile Money ou virement)
                status: 'pending', // En attente de validation par l'équipe
                billingCycle,
                userCount,        // NOUVEAU : enregistrer le nombre d'utilisateurs
                proofUrl,
                manualNotes: notes,
                expiresAt,
            },
        })

        // ============================================================
        // ÉTAPE 5 : Mettre à jour l'abonnement si nécessaire
        // ============================================================

        // Si le plan change ou si le nombre d'utilisateurs change,
        // on met à jour l'abonnement (mais il reste en attente jusqu'à validation)
        if (subscription.plan !== plan) {
            await prisma.subscription.update({
                where: {id: subscription.id},
                data: {
                    plan,
                    basePlanPrice: planConfig.baseMonthlyPrice,
                    // Note : active_users_count sera mis à jour automatiquement
                    // par le trigger quand des utilisateurs seront ajoutés/supprimés
                },
            })
        }

        // ============================================================
        // ÉTAPE 6 : Revalider le cache et retourner le succès
        // ============================================================

        revalidatePath('/dashboard/subscription')

        return {
            success: true,
            payment: {
                id: payment.id,
                amount: payment.amount,
                status: payment.status,
            },
        }
    } catch (error) {
        console.error('Erreur création paiement manuel:', error)
        return {
            success: false,
            error: 'Erreur lors de la création du paiement. Veuillez réessayer.',
        }
    }
}

/**
 * Récupère l'abonnement d'un restaurant avec tous ses détails
 *
 * MODIFICATIONS :
 * - Inclut maintenant active_users_count et base_plan_price
 * - Les paiements incluent user_count
 */
export async function getRestaurantSubscription(restaurantId: string) {
    try {
        const subscription = await prisma.subscription.findUnique({
            where: {restaurantId},
            include: {
                payments: {
                    orderBy: {createdAt: 'desc'},
                    take: 20, // Les 20 derniers paiements
                },
            },
        })

        if (!subscription) {
            return {subscription: null}
        }

        return {subscription}
    } catch (error) {
        console.error('Erreur récupération abonnement:', error)
        return {subscription: null}
    }
}

/**
 * Calcule le nombre de jours restants avant expiration
 */
export async function getDaysRemaining(restaurantId: string) {
    try {
        const subscription = await prisma.subscription.findUnique({
            where: {restaurantId},
            select: {
                status: true,
                trialEndsAt: true,
                currentPeriodEnd: true,
            },
        })

        if (!subscription) return null

        const now = new Date()
        let endDate: Date | null = null

        if (subscription.status === 'trial' && subscription.trialEndsAt) {
            endDate = new Date(subscription.trialEndsAt)
        } else if (subscription.currentPeriodEnd) {
            endDate = new Date(subscription.currentPeriodEnd)
        }

        if (!endDate) return null

        const diffTime = endDate.getTime() - now.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        return Math.max(0, diffDays)
    } catch (error) {
        console.error('Erreur calcul jours restants:', error)
        return null
    }
}

/**
 * NOUVELLE FONCTION : Vérifie si un restaurant peut ajouter un utilisateur
 *
 * Cette fonction est cruciale pour la gestion des utilisateurs.
 * Elle vérifie que le restaurant n'a pas atteint sa limite d'utilisateurs
 * selon son plan actuel.
 */
export async function canAddUser(restaurantId: string): Promise<{
    allowed: boolean
    currentCount: number
    maxUsers: number | 'unlimited'
    reason?: string
}> {
    try {
        // Récupérer l'abonnement
        const subscription = await prisma.subscription.findUnique({
            where: {restaurantId},
            select: {
                plan: true,
                activeUsersCount: true,
            },
        })

        if (!subscription) {
            return {
                allowed: false,
                currentCount: 0,
                maxUsers: 0,
                reason: 'Aucun abonnement trouvé',
            }
        }

        // Récupérer la configuration du plan
        const planConfig = SUBSCRIPTION_CONFIG[subscription.plan]
        const maxUsers = planConfig.userPricing.maxUsers
        const currentCount = subscription.activeUsersCount

        // Premium est illimité
        if (maxUsers === 'unlimited') {
            return {
                allowed: true,
                currentCount,
                maxUsers: 'unlimited',
            }
        }

        // Vérifier si on peut encore ajouter
        if (currentCount >= maxUsers) {
            return {
                allowed: false,
                currentCount,
                maxUsers,
                reason: `Limite de ${maxUsers} utilisateurs atteinte pour le plan ${subscription.plan}`,
            }
        }

        return {
            allowed: true,
            currentCount,
            maxUsers,
        }
    } catch (error) {
        console.error('Erreur vérification ajout utilisateur:', error)
        return {
            allowed: false,
            currentCount: 0,
            maxUsers: 0,
            reason: 'Erreur lors de la vérification',
        }
    }
}

/**
 * NOUVELLE FONCTION : Crée un abonnement d'essai pour un nouveau restaurant
 *
 * Cette fonction est appelée lors de la création d'un nouveau restaurant.
 * Elle initialise l'abonnement avec le plan Starter en mode essai.
 */
export async function ensureSubscription(restaurantId: string) {
    try {
        // Vérifier si un abonnement existe déjà
        let subscription = await prisma.subscription.findUnique({
            where: {restaurantId},
        })

        if (subscription) {
            return subscription
        }

        // Créer un nouvel abonnement d'essai
        const now = new Date()
        const trialEndsAt = new Date(now)
        trialEndsAt.setDate(trialEndsAt.getDate() + 14) // 14 jours d'essai

        subscription = await prisma.subscription.create({
            data: {
                restaurantId,
                plan: 'starter',
                status: 'trial',
                trialStartsAt: now,
                trialEndsAt,
                basePlanPrice: 3000, // Prix de base Starter
                activeUsersCount: 1, // L'admin qui vient de créer le restaurant
                billingCycle: 1,
            },
        })

        return subscription
    } catch (error) {
        console.error('Erreur création abonnement:', error)
        throw new Error('Impossible de créer l\'abonnement')
    }
}

/**
 * NOUVELLE FONCTION : Valide un paiement manuel
 *
 * Cette fonction est utilisée par le superadmin
 * pour approuver un paiement manuel en attente.
 */
export async function validateManualPayment(paymentId: string) {
    try {
        // ============================================================
        // ÉTAPE 1 : Récupérer le paiement
        // ============================================================

        const payment = await prisma.subscriptionPayment.findUnique({
            where: {id: paymentId},
            include: {
                subscription: true,
            },
        })

        if (!payment) {
            return {
                success: false,
                error: 'Paiement introuvable',
            }
        }

        if (payment.status !== 'pending') {
            return {
                success: false,
                error: 'Ce paiement a déjà été traité',
            }
        }

        // ============================================================
        // ÉTAPE 2 : Mettre à jour le paiement
        // ============================================================

        await prisma.subscriptionPayment.update({
            where: {id: paymentId},
            data: {
                status: 'confirmed',
            },
        })

        // ============================================================
        // ÉTAPE 3 : Mettre à jour l'abonnement
        // ============================================================

        await prisma.subscription.update({
            where: {id: payment.subscriptionId},
            data: {
                status: 'active',
                billingCycle: payment.billingCycle,
                currentPeriodStart: new Date(),
                currentPeriodEnd: payment.expiresAt,
            },
        })

        // ============================================================
        // ÉTAPE 4 : Revalidation du cache
        // ============================================================

        revalidatePath('/dashboard/superadmin/payments')
        revalidatePath('/dashboard/subscription')

        return {
            success: true,
        }
    } catch (error) {
        console.error('Erreur validation paiement manuel:', error)

        return {
            success: false,
            error: 'Erreur lors de la validation du paiement',
        }
    }
}


export async function getSubscriptionWithPayments(
    restaurantId: string
): Promise<{
    id: string
    restaurantId: string
    plan: string
    status: 'trial' | 'active' | 'expired' | 'canceled'
    trialEndsAt: Date | null
    currentPeriodEnd: Date | null
    payments: {
        id: string
        amount: number
        status: 'pending' | 'confirmed' | 'failed'
        userCount: number
        createdAt: Date
    }[]
}> {
    const subscription = await prisma.subscription.findUnique({
        where: {restaurantId},
        include: {
            payments: {
                orderBy: {createdAt: 'desc'},
                take: 20, // les 20 derniers paiements
                select: {
                    id: true,
                    amount: true,
                    status: true,
                    userCount: true,
                    createdAt: true,
                },
            },
        },
    })

    if (!subscription) {
        throw new Error('Abonnement introuvable')
    }

    return {
        id: subscription.id,
        restaurantId: subscription.restaurantId,
        plan: subscription.plan,
        status: subscription.status as 'trial' | 'active' | 'expired' | 'canceled',
        trialEndsAt: subscription.trialEndsAt,
        currentPeriodEnd: subscription.currentPeriodEnd,
        payments: subscription.payments.map((p) => ({
            id: p.id,
            amount: p.amount,
            status: p.status as 'pending' | 'confirmed' | 'failed',
            userCount: p.userCount,
            createdAt: p.createdAt,
        })),
    }
}