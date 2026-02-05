// lib/actions/subscription.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import {
    PLAN_CONFIGS,
    calculatePrice,
    type SubscriptionPlan,
    type BillingCycle,
} from '@/lib/subscription/config'

// ============================================================
// FONCTION CENTRALE : ensureSubscription
//
// C'est le point d'entrée unique pour "s'assurer qu'un
// restaurant a bien un abonnement". Elle est utilisée partout
// où on a besoin de l'abonnement avant de faire quoi que ce
// soit (paiement, vérification, affichage).
//
// Logique :
//   1. On cherche l'abonnement existant
//   2. S'il existe → on le retourne tel quel
//   3. S'il n'existe pas → on en crée un (trial de 14 jours)
//      puis on le retourne
//
// Comme ça, les restaurants créés avant le système
// d'abonnements ne tombent jamais dans le vide.
// ============================================================

export async function ensureSubscription(restaurantId: string) {
    // Chercher l'abonnement existant
    const existing = await prisma.subscription.findUnique({
        where: { restaurantId },
        include: {
            payments: {
                orderBy: { createdAt: 'desc' },
                take: 10,
            },
        },
    })

    // S'il existe déjà, on retourne directement — rien à faire
    if (existing) {
        return existing
    }

    // Sinon, on en crée un automatiquement avec une période
    // d'essai de 14 jours sur le plan "business" par défaut.
    // Ce cas ne se produit qu'une seule fois par restaurant
    // (celui qui a été créé avant le système d'abonnements).
    const config = PLAN_CONFIGS['business']
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
            maxTables: config.maxTables,
            maxUsers: config.maxUsers,
            hasStockManagement: config.hasStockManagement,
            hasAdvancedStats: config.hasAdvancedStats,
            hasDataExport: config.hasDataExport,
            hasMobilePayment: config.hasMobilePayment,
            hasMultiRestaurants: config.hasMultiRestaurants,
        },
        include: {
            payments: true,
        },
    })

    return created
}

// ============================================================
// CRÉER UN ABONNEMENT D'ESSAI
// Utilisée à l'inscription d'un nouveau restaurant.
// Pour les restaurants déjà existants, ensureSubscription()
// gère automatiquement la création.
// ============================================================

export async function createTrialSubscription(
    restaurantId: string,
    plan: SubscriptionPlan = 'business'
) {
    try {
        const config = PLAN_CONFIGS[plan]
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
        return {
            success: false,
            error: 'Erreur lors de la création de l\'abonnement',
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
            where: { restaurantId },
            select: {
                status: true,
                currentPeriodEnd: true,
                trialEndsAt: true,
            },
        })

        // Si pas d'abonnement, retourner false
        if (!subscription) return false

        const now = new Date()

        // Cas 1 : Période d'essai
        if (subscription.status === 'trial') {
            // Conversion explicite en Date si nécessaire
            const trialEnd = new Date(subscription.trialEndsAt)
            return now < trialEnd
        }

        // Cas 2 : Abonnement actif
        if (subscription.status === 'active') {
            // Vérifier que currentPeriodEnd existe
            if (!subscription.currentPeriodEnd) {
                console.warn(
                    `⚠️ Abonnement actif sans currentPeriodEnd pour restaurant ${restaurantId}`
                )
                return false
            }

            // Conversion explicite en Date
            const periodEnd = new Date(subscription.currentPeriodEnd)
            
            // Vérification que la date est valide
            if (isNaN(periodEnd.getTime())) {
                console.error(
                    `❌ Date invalide pour currentPeriodEnd: ${subscription.currentPeriodEnd}`
                )
                return false
            }

            // Comparaison avec debug optionnel
            const isActive = now < periodEnd
            
            // Debug utile en développement
            console.log(`🔍 Vérification abonnement ${restaurantId}:`, {
                status: subscription.status,
                now: now.toISOString(),
                periodEnd: periodEnd.toISOString(),
                isActive,
                daysRemaining: Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
            })

            return isActive
        }

        // Cas 3 : Tous les autres statuts (expired, suspended, cancelled)
        // → Retourner false explicitement
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
// Utilise ensureSubscription() pour garantir qu'un abonnement
// existe toujours avant de retourner les données.
// ============================================================

export async function getRestaurantSubscription(restaurantId: string) {
    try {
        // ensureSubscription gère les deux cas : existant ou à créer
        const subscription = await ensureSubscription(restaurantId)
        return { success: true, subscription }
    } catch (error) {
        console.error('Erreur récupération abonnement:', error)
        return {
            success: false,
            error: 'Erreur lors de la récupération de l\'abonnement',
            subscription: null,
        }
    }
}

// ============================================================
// CRÉER UN PAIEMENT MANUEL
// Utilise ensureSubscription() pour récupérer (ou créer)
// l'abonnement avant de créer le paiement.
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
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return { success: false, error: 'Non authentifié' }
        }

        // ensureSubscription à la place de findUnique : elle
        // crée l'abonnement si nécessaire avant de continuer.
        const subscription = await ensureSubscription(data.restaurantId)

        // Calculer le montant
        const amount = calculatePrice(data.plan, data.billingCycle)

        // Date d'expiration basée sur aujourd'hui + N mois
        const now = new Date()
        const expiresAt = new Date(
            now.getTime() + data.billingCycle * 30 * 24 * 60 * 60 * 1000
        )

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
        return {
            success: false,
            error: 'Erreur lors de la création du paiement',
        }
    }
}

// ============================================================
// VALIDER UN PAIEMENT MANUEL (SuperAdmin uniquement)
// ============================================================

export async function validateManualPayment(paymentId: string) {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return { success: false, error: 'Non authentifié' }
        }

        // Vérifier si SuperAdmin
        const superAdminEmails =
            process.env.SUPER_ADMIN_EMAILS?.split(',') || []
        const isSuperAdmin = superAdminEmails.some(
            (e) => e.trim().toLowerCase() === (user.email || '').toLowerCase()
        )

        if (!isSuperAdmin) {
            return {
                success: false,
                error: 'Accès réservé aux super admins',
            }
        }

        // Récupérer le paiement avec sa subscription parent
        const payment = await prisma.subscriptionPayment.findUnique({
            where: { id: paymentId },
            include: { subscription: true },
        })

        if (!payment) {
            return { success: false, error: 'Paiement introuvable' }
        }

        const now = new Date()

        // Transaction atomique : on met à jour le paiement et
        // l'abonnement en même temps. Si l'un échoue, l'autre
        // est rollbacké automatiquement.
        await prisma.$transaction(async (tx) => {
            await tx.subscriptionPayment.update({
                where: { id: paymentId },
                data: {
                    status: 'confirmed',
                    validatedBy: user.id,
                    validatedAt: now,
                    paidAt: now,
                },
            })

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
        return {
            success: false,
            error: 'Erreur lors du changement de plan',
        }
    }
}

// ============================================================
// OBTENIR LES JOURS RESTANTS (pour affichage)
// ============================================================

export async function getDaysRemaining(
    restaurantId: string
): Promise<number | null> {
    try {
        const subscription = await ensureSubscription(restaurantId)
        const now = new Date()
        let endDate: Date

        if (subscription.status === 'trial') {
            // Conversion explicite
            endDate = new Date(subscription.trialEndsAt)
        } else if (
            subscription.status === 'active' &&
            subscription.currentPeriodEnd
        ) {
            // Conversion explicite
            endDate = new Date(subscription.currentPeriodEnd)
        } else {
            return 0
        }

        // Vérifier que la date est valide
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