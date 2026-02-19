// lib/actions/subscription.ts
'use server'

import {createClient} from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import {revalidatePath} from 'next/cache'
import {isSuperAdminEmail} from '@/lib/utils/permissions'
import {
    SUBSCRIPTION_CONFIG,
    calculatePrice,
    type SubscriptionPlan,
    type BillingCycle,
} from '@/lib/config/subscription'

// ============================================================
// FONCTION CENTRALE : ensureSubscription
//
// Point d'entrée unique pour s'assurer qu'un restaurant a
// bien un abonnement. Utilisée partout avant toute opération
// liée à l'abonnement.
//
// Logique :
//   1. Chercher l'abonnement existant
//   2. S'il existe → le retourner tel quel
//   3. S'il n'existe pas → en créer un (trial 30 jours)
//      puis le retourner
// ============================================================

export async function ensureSubscription(restaurantId: string) {
    const existing = await prisma.subscription.findUnique({
        where: {restaurantId},
        include: {
            payments: {
                orderBy: {createdAt: 'desc'},
                take: 10,
            },
        },
    })

    if (existing) {
        return existing
    }

    // Créer automatiquement un trial pour les restaurants
    // créés avant le système d'abonnements
    const config = SUBSCRIPTION_CONFIG['business']
    const now = new Date()
    const trialEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    const created = await prisma.subscription.create({
        data: {
            restaurantId,
            plan: 'business',
            status: 'trial',
            trialStartsAt: now,
            trialEndsAt: trialEnd,
            monthlyPrice: config.monthlyPrice,
            billingCycle: 1,
            maxTables: config.limits.max_tables,
            maxUsers: config.limits.max_users,
            hasStockManagement: config.features.stock_management,
            hasAdvancedStats: config.features.advanced_stats,
            hasDataExport: config.features.data_export,
            hasMobilePayment: config.features.mobile_payment,
            // hasMultiRestaurants: config.features.hasMultiRestaurants,
        },
        include: {
            payments: true,
        },
    })

    return created
}

// ============================================================
// CRÉER UN ABONNEMENT D'ESSAI
// Pour les nouveaux restaurants à l'inscription.
// ============================================================

export async function createTrialSubscription(
    restaurantId: string,
    plan: SubscriptionPlan = 'business'
) {
    try {
        const config = SUBSCRIPTION_CONFIG[plan]
        const now = new Date()
        const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)

        const subscription = await prisma.subscription.create({
            data: {
                restaurantId,
                plan,
                status: 'trial',
                trialStartsAt: now,
                trialEndsAt: trialEnd,
                monthlyPrice: config.monthlyPrice,
                billingCycle: 1,
                maxTables: config.limits.max_tables,
                maxUsers: config.limits.max_users,
                hasStockManagement: config.features.stock_management,
                hasAdvancedStats: config.features.advanced_stats,
                hasDataExport: config.features.data_export,
                hasMobilePayment: config.features.mobile_payment,
                hasMultiRestaurants: config.features.multi_restaurants,
            },
        })

        return {success: true, subscription}
    } catch (error) {
        console.error('Erreur création abonnement:', error)
        return {
            success: false,
            error: "Erreur lors de la création de l'abonnement",
        }
    }
}

// ============================================================
// VÉRIFIER SI ABONNEMENT ACTIF
// ============================================================

export async function isSubscriptionActive(
    restaurantId: string
): Promise<boolean> {
    try {
        const subscription = await prisma.subscription.findUnique({
            where: {restaurantId},
            select: {
                status: true,
                currentPeriodEnd: true,
                trialEndsAt: true,
            },
        })

        if (!subscription) return false

        const now = new Date()

        if (subscription.status === 'trial') {
            const trialEnd = new Date(subscription.trialEndsAt)
            return now < trialEnd
        }

        if (subscription.status === 'active') {
            if (!subscription.currentPeriodEnd) {
                console.warn(
                    `⚠️ Abonnement actif sans currentPeriodEnd pour restaurant ${restaurantId}`
                )
                return false
            }

            const periodEnd = new Date(subscription.currentPeriodEnd)

            if (isNaN(periodEnd.getTime())) {
                console.error(
                    `❌ Date invalide pour currentPeriodEnd: ${subscription.currentPeriodEnd}`
                )
                return false
            }

            const isActive = now < periodEnd

            console.log(`🔍 Vérification abonnement ${restaurantId}:`, {
                status: subscription.status,
                now: now.toISOString(),
                periodEnd: periodEnd.toISOString(),
                isActive,
                daysRemaining: Math.ceil(
                    (periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
                ),
            })

            return isActive
        }

        console.log(
            `❌ Abonnement ${restaurantId} avec statut ${subscription.status} → accès refusé`
        )
        return false
    } catch (error) {
        console.error('Erreur vérification abonnement:', error)
        return false
    }
}

// ============================================================
// RÉCUPÉRER L'ABONNEMENT D'UN RESTAURANT
// ============================================================

export async function getRestaurantSubscription(restaurantId: string) {
    try {
        const subscription = await ensureSubscription(restaurantId)
        return {success: true, subscription}
    } catch (error) {
        console.error('Erreur récupération abonnement:', error)
        return {
            success: false,
            error: "Erreur lors de la récupération de l'abonnement",
            subscription: null,
        }
    }
}

// ============================================================
// CRÉER UN PAIEMENT MANUEL
// ============================================================

export async function createManualPayment(data: {
    restaurantId: string
    plan: SubscriptionPlan
    billingCycle: BillingCycle
    proofUrl?: string
    notes?: string
}) {
    try {
        const supabase = await createClient()
        const {
            data: {user},
        } = await supabase.auth.getUser()

        if (!user) {
            return {success: false, error: 'Non authentifié'}
        }

        const subscription = await ensureSubscription(data.restaurantId)
        const amount = calculatePrice(data.plan, data.billingCycle)

        const now = new Date()
        const expiresAt = new Date(
            now.getTime() + data.billingCycle * 30 * 24 * 60 * 60 * 1000
        )

        const payment = await prisma.subscriptionPayment.create({
            data: {
                subscriptionId: subscription.id,
                restaurantId: data.restaurantId,
                amount,
                method: 'manual',
                status: 'pending',
                billingCycle: data.billingCycle,
                proofUrl: data.proofUrl,
                manualNotes: data.notes,
                expiresAt,
            },
        })

        revalidatePath('/dashboard/subscription')
        return {success: true, payment}
    } catch (error) {
        console.error('Erreur création paiement:', error)
        return {
            success: false,
            error: 'Erreur lors de la création du paiement',
        }
    }
}

// ============================================================
// VALIDER UN PAIEMENT MANUEL (SuperAdmin uniquement)
// ✅ Utilise isSuperAdminEmail() au lieu d'une logique dupliquée
// ============================================================

export async function validateManualPayment(paymentId: string) {
    try {
        const supabase = await createClient()
        const {
            data: {user},
        } = await supabase.auth.getUser()

        if (!user) {
            return {success: false, error: 'Non authentifié'}
        }

        // ✅ Vérification centralisée via utilitaire partagé
        if (!isSuperAdminEmail(user.email ?? '')) {
            return {success: false, error: 'Accès réservé aux super admins'}
        }

        const payment = await prisma.subscriptionPayment.findUnique({
            where: {id: paymentId},
            include: {subscription: true},
        })

        if (!payment) {
            return {success: false, error: 'Paiement introuvable'}
        }

        const now = new Date()

        await prisma.$transaction(async (tx) => {
            await tx.subscriptionPayment.update({
                where: {id: paymentId},
                data: {
                    status: 'confirmed',
                    validatedBy: user.id,
                    validatedAt: now,
                    paidAt: now,
                },
            })

            await tx.subscription.update({
                where: {id: payment.subscriptionId},
                data: {
                    status: 'active',
                    currentPeriodStart: now,
                    currentPeriodEnd: payment.expiresAt,
                },
            })
        })

        revalidatePath('/superadmin/payments')
        revalidatePath('/dashboard/subscription')
        return {success: true}
    } catch (error) {
        console.error('Erreur validation paiement:', error)
        return {
            success: false,
            error: 'Erreur lors de la validation du paiement',
        }
    }
}

// ============================================================
// CHANGER DE PLAN
// ============================================================

export async function changePlan(
    restaurantId: string,
    newPlan: SubscriptionPlan
) {
    try {
        const config = SUBSCRIPTION_CONFIG[newPlan]

        const subscription = await prisma.subscription.update({
            where: {restaurantId},
            data: {
                plan: newPlan,
                monthlyPrice: config.monthlyPrice,
                maxTables: config.limits.max_tables,
                maxUsers: config.limits.max_users,
                hasStockManagement: config.features.stock_management,
                hasAdvancedStats: config.features.advanced_stats,
                hasDataExport: config.features.data_export,
                hasMobilePayment: config.features.mobile_payment,
                hasMultiRestaurants: config.features.multi_restaurants,
            },
        })

        revalidatePath('/dashboard/subscription')
        return {success: true, subscription}
    } catch (error) {
        console.error('Erreur changement de plan:', error)
        return {
            success: false,
            error: 'Erreur lors du changement de plan',
        }
    }
}

// ============================================================
// OBTENIR LES JOURS RESTANTS
// ============================================================

export async function getDaysRemaining(
    restaurantId: string
): Promise<number | null> {
    try {
        const subscription = await ensureSubscription(restaurantId)
        const now = new Date()
        let endDate: Date

        if (subscription.status === 'trial') {
            endDate = new Date(subscription.trialEndsAt)
        } else if (
            subscription.status === 'active' &&
            subscription.currentPeriodEnd
        ) {
            endDate = new Date(subscription.currentPeriodEnd)
        } else {
            return 0
        }

        if (isNaN(endDate.getTime())) {
            console.error('Date invalide dans getDaysRemaining')
            return 0
        }

        const diffTime = endDate.getTime() - now.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        return Math.max(0, diffDays)
    } catch (error) {
        console.error('Erreur calcul jours restants:', error)
        return null
    }
}