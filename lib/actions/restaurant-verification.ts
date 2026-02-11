// lib/actions/restaurant-verification.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import type {
    VerificationDocumentData,
    CircuitSheetData,
    VerificationApprovalData,
    IdentityDocumentType,
} from '@/types/restaurant-verification'

// ============================================================
// TYPES POUR LES RETOURS D'ACTIONS
// ============================================================

type ActionResult<T = void> =
    | { success: true; data?: T }
    | { success: false; error: string }

// ============================================================
// FONCTION : Soumettre les documents de vérification
// ============================================================

export async function submitVerificationDocuments(
    restaurantId: string,
    data: VerificationDocumentData
): Promise<ActionResult> {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'Non authentifié' }
    }

    // Vérifier que l'utilisateur est admin du restaurant
    const userRole = await prisma.restaurantUser.findUnique({
        where: {
            userId_restaurantId: {
                userId: user.id,
                restaurantId,
            },
        },
    })

    if (!userRole || userRole.role !== 'admin') {
        return { success: false, error: 'Seuls les admins peuvent soumettre les documents' }
    }

    // Vérifier que les deux documents sont fournis
    if (!data.profilePhotoUrl || !data.identityDocumentUrl) {
        return { success: false, error: 'Les deux documents sont obligatoires' }
    }

    try {
        // Mettre à jour ou créer l'enregistrement de vérification
        const now = new Date()

        await prisma.restaurantVerificationDocument.upsert({
            where: { restaurantId },
            update: {
                profilePhotoUrl: data.profilePhotoUrl,
                profilePhotoUploadedAt: data.profilePhotoUrl ? now : undefined,
                identityDocumentUrl: data.identityDocumentUrl,
                identityDocumentType: data.identityDocumentType,
                identityDocumentUploadedAt: data.identityDocumentUrl ? now : undefined,
                verificationStatus: 'documents_submitted', // ← Passage automatique à "soumis"
                updatedAt: now,
            },
            create: {
                restaurantId,
                profilePhotoUrl: data.profilePhotoUrl,
                profilePhotoUploadedAt: now,
                identityDocumentUrl: data.identityDocumentUrl,
                identityDocumentType: data.identityDocumentType,
                identityDocumentUploadedAt: now,
                verificationStatus: 'documents_submitted',
            },
        })

        // Mettre à jour le statut du restaurant
        await prisma.restaurant.update({
            where: { id: restaurantId },
            data: {
                verificationStatus: 'documents_submitted',
            },
        })

        // Enregistrer dans l'historique
        await prisma.restaurantVerificationHistory.create({
            data: {
                restaurantId,
                eventType: 'documents_submitted',
                oldStatus: 'pending_documents',
                newStatus: 'documents_submitted',
                performedBy: user.id,
                comment: 'Documents de vérification soumis',
            },
        })

        revalidatePath('/dashboard')
        revalidatePath('/dashboard/settings')

        return { success: true }
    } catch (error) {
        console.error('Erreur soumission documents:', error)
        return { success: false, error: 'Erreur lors de la soumission' }
    }
}

// ============================================================
// FONCTION : Re-soumettre les documents après rejet
// ============================================================

export async function resubmitVerificationDocuments(
    restaurantId: string,
    data: VerificationDocumentData
): Promise<ActionResult> {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'Non authentifié' }
    }

    // Vérifier que l'utilisateur est admin du restaurant
    const userRole = await prisma.restaurantUser.findUnique({
        where: {
            userId_restaurantId: {
                userId: user.id,
                restaurantId,
            },
        },
    })

    if (!userRole || userRole.role !== 'admin') {
        return { success: false, error: 'Accès refusé' }
    }

    try {
        const now = new Date()

        await prisma.restaurantVerificationDocument.update({
            where: { restaurantId },
            data: {
                profilePhotoUrl: data.profilePhotoUrl,
                profilePhotoUploadedAt: data.profilePhotoUrl ? now : undefined,
                identityDocumentUrl: data.identityDocumentUrl,
                identityDocumentType: data.identityDocumentType,
                identityDocumentUploadedAt: data.identityDocumentUrl ? now : undefined,
                verificationStatus: 'documents_submitted',
                // Réinitialiser les champs de rejet
                rejectionReason: null,
                rejectedBy: null,
                rejectedAt: null,
                updatedAt: now,
            },
        })

        await prisma.restaurant.update({
            where: { id: restaurantId },
            data: {
                verificationStatus: 'documents_submitted',
            },
        })

        // Historique
        await prisma.restaurantVerificationHistory.create({
            data: {
                restaurantId,
                eventType: 'resubmitted',
                oldStatus: 'documents_rejected',
                newStatus: 'documents_submitted',
                performedBy: user.id,
                comment: 'Documents re-soumis après rejet',
            },
        })

        revalidatePath('/dashboard')
        revalidatePath('/dashboard/settings')

        return { success: true }
    } catch (error) {
        console.error('Erreur re-soumission:', error)
        return { success: false, error: 'Erreur lors de la re-soumission' }
    }
}

// ============================================================
// FONCTION : Récupérer le statut de vérification
// ============================================================

export async function getVerificationStatus(restaurantId: string) {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'Non authentifié' }
    }

    try {
        const restaurant = await prisma.restaurant.findUnique({
            where: { id: restaurantId },
            include: {
                verificationDocuments: true,
                circuitSheet: true,
                subscription: {
                    select: {
                        plan: true,
                    },
                },
            },
        })

        if (!restaurant) {
            return { success: false, error: 'Restaurant introuvable' }
        }

        return {
            success: true,
            data: {
                verificationStatus: restaurant.verificationStatus,
                isVerified: restaurant.isVerified,
                documents: restaurant.verificationDocuments,
                circuitSheet: restaurant.circuitSheet,
                requiresCircuitSheet: restaurant.subscription?.plan === 'business' ||
                    restaurant.subscription?.plan === 'premium',
            },
        }
    } catch (error) {
        console.error('Erreur récupération statut:', error)
        return { success: false, error: 'Erreur lors de la récupération' }
    }
}

// ============================================================
// FONCTION : Soumettre la fiche circuit (Business uniquement)
// ============================================================

export async function submitCircuitSheet(
    restaurantId: string,
    data: CircuitSheetData
): Promise<ActionResult> {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'Non authentifié' }
    }

    // Vérifier que l'utilisateur est admin
    const userRole = await prisma.restaurantUser.findUnique({
        where: {
            userId_restaurantId: {
                userId: user.id,
                restaurantId,
            },
        },
    })

    if (!userRole || userRole.role !== 'admin') {
        return { success: false, error: 'Accès refusé' }
    }

    // Vérifier que le restaurant est sur Business
    const subscription = await prisma.subscription.findUnique({
        where: { restaurantId },
    })

    if (!subscription || (subscription.plan !== 'business' && subscription.plan !== 'premium')) {
        return { success: false, error: 'La fiche circuit est requise uniquement pour les offres Business et Premium' }
    }

    try {
        const now = new Date()

        await prisma.restaurantCircuitSheet.update({
            where: { restaurantId },
            data: {
                circuitSheetUrl: data.circuitSheetUrl,
                circuitSheetUploadedAt: now,
                isSubmitted: true,
                updatedAt: now,
            },
        })

        // Si le restaurant était suspendu pour fiche manquante, on le réactive
        const restaurant = await prisma.restaurant.findUnique({
            where: { id: restaurantId },
            select: { verificationStatus: true },
        })

        if (restaurant?.verificationStatus === 'suspended') {
            await prisma.restaurant.update({
                where: { id: restaurantId },
                data: {
                    verificationStatus: 'verified',
                    isActive: true,
                },
            })

            // Historique réactivation
            await prisma.restaurantVerificationHistory.create({
                data: {
                    restaurantId,
                    eventType: 'reactivated',
                    oldStatus: 'suspended',
                    newStatus: 'verified',
                    performedBy: user.id,
                    comment: 'Restaurant réactivé après soumission de la fiche circuit',
                },
            })
        }

        // Historique soumission fiche
        await prisma.restaurantVerificationHistory.create({
            data: {
                restaurantId,
                eventType: 'circuit_submitted',
                performedBy: user.id,
                comment: 'Fiche circuit soumise',
            },
        })

        revalidatePath('/dashboard')
        revalidatePath('/dashboard/settings')

        return { success: true }
    } catch (error) {
        console.error('Erreur soumission fiche circuit:', error)
        return { success: false, error: 'Erreur lors de la soumission' }
    }
}

// ============================================================
// FONCTION : Récupérer l'historique de vérification
// ============================================================

export async function getVerificationHistory(restaurantId: string) {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'Non authentifié' }
    }

    try {
        const history = await prisma.restaurantVerificationHistory.findMany({
            where: { restaurantId },
            orderBy: { createdAt: 'desc' },
            take: 20, // Limiter à 20 dernières entrées
        })

        return {
            success: true,
            data: history,
        }
    } catch (error) {
        console.error('Erreur récupération historique:', error)
        return { success: false, error: 'Erreur lors de la récupération' }
    }
}

// ============================================================
// FONCTIONS SUPERADMIN (à implémenter dans un module séparé)
// ============================================================

/**
 * Ces fonctions ne doivent être accessibles qu'aux superadmins.
 * Elles seront implémentées dans lib/actions/superadmin/restaurant-verification.ts
 * 
 * - approveRestaurantVerification(restaurantId, superadminId)
 * - rejectRestaurantVerification(restaurantId, superadminId, reason)
 * - getRestaurantsPendingVerification()
 * - validateCircuitSheet(restaurantId, superadminId)
 */