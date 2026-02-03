// lib/actions/subscription.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { PLAN_CONFIGS, calculatePrice, type SubscriptionPlan, type BillingCycle } from '@/lib/subscription/config'

// ============================================================
// CRÉER UN ABONNEMENT D'ESSAI (appelé à l'inscription)
// ============================================================

export async function createTrialSubscription(
    restaurantId: string,
    plan: SubscriptionPlan = 'starter'
) {
    try {
        const config = PLAN_CONFIGS[plan]
        const now = new Date()
        const trialEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // +30 jours

        const subscription = await prisma.subscription.create({
            data: {
                restaurantId,
                plan,
                status: 'trial',
                trialStartsAt: now,
                trialEndsAt: trialEnd,
                monthlyPrice: config.monthlyPrice,
                billingCycle: 1,
                maxTables: config.maxTables,
                maxUsers: config.maxUsers,
                hasStockManagement: config.hasStockManagement,
                hasAdvancedStats: config.hasAdvancedStats,
                hasDataExport: config.hasDataExport,
                hasMobilePayment: config.hasMobilePayment,
                hasMultiRestaurants: config.hasMultiRestaurants,
            },
        })

        return { success: true, subscription }
    } catch (error) {
        console.error('Erreur création abonnement:', error)
        return { success: false, error: 'Erreur lors de la création de l\'abonnement' }
    }
}

// ============================================================
// VÉRIFIER SI ABONNEMENT ACTIF
// ============================================================

export async function isSubscriptionActive(restaurantId: string): Promise<boolean> {
    try {
        const subscription = await prisma.subscription.findUnique({
            where: { restaurantId },
            select: {
                status: true,
                currentPeriodEnd: true,
                trialEndsAt: true,
            },
        })

        if (!subscription) return false

        const now = new Date()

        // En période d'essai
        if (subscription.status === 'trial') {
            return now < subscription.trialEndsAt
        }

        // Abonnement payé actif
        if (subscription.status === 'active' && subscription.currentPeriodEnd) {
            return now < subscription.currentPeriodEnd
        }

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
        const subscription = await prisma.subscription.findUnique({
            where: { restaurantId },
            include: {
                payments: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                },
            },
        })

        return { success: true, subscription }
    } catch (error) {
        console.error('Erreur récupération abonnement:', error)
        return { success: false, error: 'Erreur lors de la récupération de l\'abonnement' }
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
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { success: false, error: 'Non authentifié' }
        }

        // Récupérer l'abonnement
        const subscription = await prisma.subscription.findUnique({
            where: { restaurantId: data.restaurantId },
        })

        if (!subscription) {
            return { success: false, error: 'Aucun abonnement trouvé' }
        }

        // Calculer le montant
        const amount = calculatePrice(data.plan, data.billingCycle)

        // Date d'expiration
        const now = new Date()
        const expiresAt = new Date(now.getTime() + data.billingCycle * 30 * 24 * 60 * 60 * 1000)

        // Créer le paiement
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
        return { success: true, payment }
    } catch (error) {
        console.error('Erreur création paiement:', error)
        return { success: false, error: 'Erreur lors de la création du paiement' }
    }
}

// ============================================================
// VALIDER UN PAIEMENT MANUEL (SuperAdmin uniquement)
// ============================================================

export async function validateManualPayment(paymentId: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { success: false, error: 'Non authentifié' }
        }

        // Vérifier si SuperAdmin
        const superAdminEmails = process.env.SUPER_ADMIN_EMAILS?.split(',') || []
        const isSuperAdmin = superAdminEmails.includes(user.email || '')

        if (!isSuperAdmin) {
            return { success: false, error: 'Accès réservé aux super admins' }
        }

        // Récupérer le paiement
        const payment = await prisma.subscriptionPayment.findUnique({
            where: { id: paymentId },
            include: { subscription: true },
        })

        if (!payment) {
            return { success: false, error: 'Paiement introuvable' }
        }

        const now = new Date()

        // Mettre à jour le paiement et l'abonnement
        await prisma.$transaction(async (tx) => {
            // Confirmer le paiement
            await tx.subscriptionPayment.update({
                where: { id: paymentId },
                data: {
                    status: 'confirmed',
                    validatedBy: user.id,
                    validatedAt: now,
                    paidAt: now,
                },
            })

            // Activer l'abonnement
            await tx.subscription.update({
                where: { id: payment.subscriptionId },
                data: {
                    status: 'active',
                    currentPeriodStart: now,
                    currentPeriodEnd: payment.expiresAt,
                },
            })
        })

        revalidatePath('/superadmin/payments')
        revalidatePath('/dashboard/subscription')
        return { success: true }
    } catch (error) {
        console.error('Erreur validation paiement:', error)
        return { success: false, error: 'Erreur lors de la validation du paiement' }
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
        const config = PLAN_CONFIGS[newPlan]

        const subscription = await prisma.subscription.update({
            where: { restaurantId },
            data: {
                plan: newPlan,
                monthlyPrice: config.monthlyPrice,
                maxTables: config.maxTables,
                maxUsers: config.maxUsers,
                hasStockManagement: config.hasStockManagement,
                hasAdvancedStats: config.hasAdvancedStats,
                hasDataExport: config.hasDataExport,
                hasMobilePayment: config.hasMobilePayment,
                hasMultiRestaurants: config.hasMultiRestaurants,
            },
        })

        revalidatePath('/dashboard/subscription')
        return { success: true, subscription }
    } catch (error) {
        console.error('Erreur changement de plan:', error)
        return { success: false, error: 'Erreur lors du changement de plan' }
    }
}

// ============================================================
// OBTENIR LES JOURS RESTANTS (pour affichage)
// ============================================================

export async function getDaysRemaining(restaurantId: string): Promise<number | null> {
    try {
        const subscription = await prisma.subscription.findUnique({
            where: { restaurantId },
            select: {
                status: true,
                trialEndsAt: true,
                currentPeriodEnd: true,
            },
        })

        if (!subscription) return null

        const now = new Date()
        let endDate: Date

        if (subscription.status === 'trial') {
            endDate = subscription.trialEndsAt
        } else if (subscription.status === 'active' && subscription.currentPeriodEnd) {
            endDate = subscription.currentPeriodEnd
        } else {
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