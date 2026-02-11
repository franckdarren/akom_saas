// lib/actions/superadmin/restaurant-verification.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// ============================================================
// TYPES
// ============================================================

type ActionResult<T = void> =
    | { success: true; data?: T }
    | { success: false; error: string }

// ============================================================
// HELPER : Vérifier que l'utilisateur est superadmin
// ============================================================

async function verifySuperadmin() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { authorized: false, userId: null }
    }

    // TODO: Implémenter votre logique de vérification superadmin
    // Par exemple, vérifier un rôle dans une table users
    // ou vérifier si user.email est dans une liste de superadmins

    // Pour l'instant, exemple basique :
    const isSuperadmin = user.email?.endsWith('@akom-admin.com') || false

    return { authorized: isSuperadmin, userId: user.id }
}

// ============================================================
// FONCTION : Récupérer les restaurants en attente de vérification
// ============================================================

export async function getRestaurantsPendingVerification() {
    const { authorized } = await verifySuperadmin()

    if (!authorized) {
        return { success: false, error: 'Accès refusé : superadmin uniquement' }
    }

    try {
        const restaurants = await prisma.restaurant.findMany({
            where: {
                verificationStatus: {
                    in: ['pending_documents', 'documents_submitted'],
                },
            },
            include: {
                verificationDocuments: true,
                users: {
                    where: { role: 'admin' },
                    take: 1,
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        })

        return {
            success: true,
            data: restaurants,
        }
    } catch (error) {
        console.error('Erreur récupération restaurants en attente:', error)
        return { success: false, error: 'Erreur lors de la récupération' }
    }
}

// ============================================================
// FONCTION : Approuver la vérification d'un restaurant
// ============================================================

export async function approveRestaurantVerification(
    restaurantId: string
): Promise<ActionResult> {
    const { authorized, userId } = await verifySuperadmin()

    if (!authorized || !userId) {
        return { success: false, error: 'Accès refusé : superadmin uniquement' }
    }

    try {
        const now = new Date()

        // Transaction pour tout faire d'un coup
        await prisma.$transaction(async (tx) => {
            // 1. Mettre à jour le document de vérification
            await tx.restaurantVerificationDocument.update({
                where: { restaurantId },
                data: {
                    verificationStatus: 'verified',
                    verifiedBy: userId,
                    verifiedAt: now,
                    updatedAt: now,
                },
            })

            // 2. Mettre à jour le restaurant
            await tx.restaurant.update({
                where: { id: restaurantId },
                data: {
                    verificationStatus: 'verified',
                    isVerified: true,
                    isActive: true, // ← Activation automatique à la vérification
                    updatedAt: now,
                },
            })

            // 3. Enregistrer dans l'historique
            await tx.restaurantVerificationHistory.create({
                data: {
                    restaurantId,
                    eventType: 'verified',
                    oldStatus: 'documents_submitted',
                    newStatus: 'verified',
                    performedBy: userId,
                    comment: 'Restaurant vérifié et approuvé par le superadmin',
                },
            })
        })

        // TODO: Envoyer une notification email au restaurant
        // await sendVerificationApprovedEmail(restaurantId)

        revalidatePath('/superadmin/verifications')
        revalidatePath('/dashboard')

        return { success: true }
    } catch (error) {
        console.error('Erreur approbation restaurant:', error)
        return { success: false, error: 'Erreur lors de l\'approbation' }
    }
}

// ============================================================
// FONCTION : Rejeter la vérification d'un restaurant
// ============================================================

export async function rejectRestaurantVerification(
    restaurantId: string,
    rejectionReason: string
): Promise<ActionResult> {
    const { authorized, userId } = await verifySuperadmin()

    if (!authorized || !userId) {
        return { success: false, error: 'Accès refusé : superadmin uniquement' }
    }

    if (!rejectionReason || rejectionReason.trim().length < 10) {
        return { success: false, error: 'Veuillez fournir une raison de rejet détaillée (minimum 10 caractères)' }
    }

    try {
        const now = new Date()

        await prisma.$transaction(async (tx) => {
            // 1. Mettre à jour le document de vérification
            await tx.restaurantVerificationDocument.update({
                where: { restaurantId },
                data: {
                    verificationStatus: 'documents_rejected',
                    rejectedBy: userId,
                    rejectedAt: now,
                    rejectionReason: rejectionReason.trim(),
                    updatedAt: now,
                },
            })

            // 2. Mettre à jour le restaurant
            await tx.restaurant.update({
                where: { id: restaurantId },
                data: {
                    verificationStatus: 'documents_rejected',
                    isVerified: false,
                    isActive: false, // ← Désactivation lors du rejet
                    updatedAt: now,
                },
            })

            // 3. Historique
            await tx.restaurantVerificationHistory.create({
                data: {
                    restaurantId,
                    eventType: 'rejected',
                    oldStatus: 'documents_submitted',
                    newStatus: 'documents_rejected',
                    performedBy: userId,
                    comment: `Documents rejetés : ${rejectionReason}`,
                },
            })
        })

        // TODO: Envoyer une notification email au restaurant avec la raison du rejet
        // await sendVerificationRejectedEmail(restaurantId, rejectionReason)

        revalidatePath('/superadmin/verifications')

        return { success: true }
    } catch (error) {
        console.error('Erreur rejet restaurant:', error)
        return { success: false, error: 'Erreur lors du rejet' }
    }
}

// ============================================================
// FONCTION : Récupérer les fiches circuit en attente
// ============================================================

export async function getPendingCircuitSheets() {
    const { authorized } = await verifySuperadmin()

    if (!authorized) {
        return { success: false, error: 'Accès refusé : superadmin uniquement' }
    }

    try {
        const circuitSheets = await prisma.restaurantCircuitSheet.findMany({
            where: {
                isSubmitted: true,
                isValidated: false,
            },
            include: {
                restaurant: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                    },
                },
            },
            orderBy: {
                circuitSheetUploadedAt: 'asc', // Les plus anciens d'abord
            },
        })

        return {
            success: true,
            data: circuitSheets,
        }
    } catch (error) {
        console.error('Erreur récupération fiches circuit:', error)
        return { success: false, error: 'Erreur lors de la récupération' }
    }
}

// ============================================================
// FONCTION : Valider une fiche circuit
// ============================================================

export async function validateCircuitSheet(
    restaurantId: string
): Promise<ActionResult> {
    const { authorized, userId } = await verifySuperadmin()

    if (!authorized || !userId) {
        return { success: false, error: 'Accès refusé : superadmin uniquement' }
    }

    try {
        const now = new Date()

        await prisma.$transaction(async (tx) => {
            // 1. Valider la fiche circuit
            await tx.restaurantCircuitSheet.update({
                where: { restaurantId },
                data: {
                    isValidated: true,
                    validatedBy: userId,
                    validatedAt: now,
                    updatedAt: now,
                },
            })

            // 2. Historique
            await tx.restaurantVerificationHistory.create({
                data: {
                    restaurantId,
                    eventType: 'circuit_validated',
                    performedBy: userId,
                    comment: 'Fiche circuit validée par le superadmin',
                },
            })
        })

        // TODO: Notification email
        // await sendCircuitSheetValidatedEmail(restaurantId)

        revalidatePath('/superadmin/circuit-sheets')

        return { success: true }
    } catch (error) {
        console.error('Erreur validation fiche circuit:', error)
        return { success: false, error: 'Erreur lors de la validation' }
    }
}

// ============================================================
// FONCTION : Récupérer les restaurants suspendus
// ============================================================

export async function getSuspendedRestaurants() {
    const { authorized } = await verifySuperadmin()

    if (!authorized) {
        return { success: false, error: 'Accès refusé : superadmin uniquement' }
    }

    try {
        const restaurants = await prisma.restaurant.findMany({
            where: {
                verificationStatus: 'suspended',
            },
            include: {
                circuitSheet: true,
                verificationDocuments: true,
            },
            orderBy: {
                updatedAt: 'desc',
            },
        })

        return {
            success: true,
            data: restaurants,
        }
    } catch (error) {
        console.error('Erreur récupération restaurants suspendus:', error)
        return { success: false, error: 'Erreur lors de la récupération' }
    }
}

// ============================================================
// FONCTION : Réactiver manuellement un restaurant suspendu
// ============================================================

export async function reactivateSuspendedRestaurant(
    restaurantId: string,
    comment: string
): Promise<ActionResult> {
    const { authorized, userId } = await verifySuperadmin()

    if (!authorized || !userId) {
        return { success: false, error: 'Accès refusé : superadmin uniquement' }
    }

    try {
        const now = new Date()

        await prisma.$transaction(async (tx) => {
            // 1. Réactiver le restaurant
            await tx.restaurant.update({
                where: { id: restaurantId },
                data: {
                    verificationStatus: 'verified',
                    isActive: true,
                    updatedAt: now,
                },
            })

            // 2. Historique
            await tx.restaurantVerificationHistory.create({
                data: {
                    restaurantId,
                    eventType: 'reactivated',
                    oldStatus: 'suspended',
                    newStatus: 'verified',
                    performedBy: userId,
                    comment: comment || 'Réactivation manuelle par le superadmin',
                },
            })
        })

        // TODO: Notification email
        // await sendRestaurantReactivatedEmail(restaurantId)

        revalidatePath('/superadmin/suspended')
        revalidatePath('/dashboard')

        return { success: true }
    } catch (error) {
        console.error('Erreur réactivation restaurant:', error)
        return { success: false, error: 'Erreur lors de la réactivation' }
    }
}

// ============================================================
// FONCTION : Récupérer les statistiques de vérification
// ============================================================

export async function getVerificationStats() {
    const { authorized } = await verifySuperadmin()

    if (!authorized) {
        return { success: false, error: 'Accès refusé : superadmin uniquement' }
    }

    try {
        const [
            pendingCount,
            submittedCount,
            verifiedCount,
            rejectedCount,
            suspendedCount,
            pendingCircuitSheetsCount,
        ] = await Promise.all([
            prisma.restaurant.count({
                where: { verificationStatus: 'pending_documents' },
            }),
            prisma.restaurant.count({
                where: { verificationStatus: 'documents_submitted' },
            }),
            prisma.restaurant.count({
                where: { verificationStatus: 'verified' },
            }),
            prisma.restaurant.count({
                where: { verificationStatus: 'documents_rejected' },
            }),
            prisma.restaurant.count({
                where: { verificationStatus: 'suspended' },
            }),
            prisma.restaurantCircuitSheet.count({
                where: {
                    isSubmitted: true,
                    isValidated: false,
                },
            }),
        ])

        return {
            success: true,
            data: {
                pending: pendingCount,
                submitted: submittedCount,
                verified: verifiedCount,
                rejected: rejectedCount,
                suspended: suspendedCount,
                pendingCircuitSheets: pendingCircuitSheetsCount,
                total: pendingCount + submittedCount + verifiedCount + rejectedCount + suspendedCount,
            },
        }
    } catch (error) {
        console.error('Erreur récupération stats:', error)
        return { success: false, error: 'Erreur lors de la récupération' }
    }
}