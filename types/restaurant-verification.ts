// types/restaurant-verification.ts

import type {
    RestaurantVerificationStatus,
    RestaurantVerificationDocument,
    RestaurantCircuitSheet,
    RestaurantVerificationHistory
} from '@prisma/client'

// ============================================================
// TYPES DE BASE
// ============================================================

export type { RestaurantVerificationStatus }

export type IdentityDocumentType = 'cni' | 'passport' | 'driving_license'

export type VerificationEventType =
    | 'documents_submitted'
    | 'verified'
    | 'rejected'
    | 'resubmitted'
    | 'circuit_submitted'
    | 'circuit_validated'
    | 'suspended'
    | 'reactivated'

// ============================================================
// INTERFACES
// ============================================================

export interface VerificationDocumentData {
    profilePhotoUrl?: string | null
    identityDocumentUrl?: string | null
    identityDocumentType?: IdentityDocumentType | null
}

export interface CircuitSheetData {
    circuitSheetUrl: string
}

export interface VerificationApprovalData {
    approved: boolean
    rejectionReason?: string
}

export interface RestaurantWithVerification {
    id: string
    name: string
    slug: string
    verificationStatus: RestaurantVerificationStatus
    isVerified: boolean
    createdAt: Date
    verificationDocuments: RestaurantVerificationDocument | null
    circuitSheet: RestaurantCircuitSheet | null
}

// ============================================================
// CONSTANTES D'AFFICHAGE
// ============================================================

export const VERIFICATION_STATUS_LABELS: Record<RestaurantVerificationStatus, string> = {
    pending_documents: 'Documents en attente',
    documents_submitted: 'Documents soumis',
    documents_rejected: 'Documents rejetés',
    verified: 'Vérifié',
    suspended: 'Suspendu',
}

export const VERIFICATION_STATUS_COLORS: Record<RestaurantVerificationStatus, string> = {
    pending_documents: 'orange',
    documents_submitted: 'blue',
    documents_rejected: 'red',
    verified: 'green',
    suspended: 'gray',
}

export const IDENTITY_DOCUMENT_TYPE_LABELS: Record<IdentityDocumentType, string> = {
    cni: 'Carte nationale d\'identité',
    passport: 'Passeport',
    driving_license: 'Permis de conduire',
}

export const EVENT_TYPE_LABELS: Record<VerificationEventType, string> = {
    documents_submitted: 'Documents soumis',
    verified: 'Restaurant vérifié',
    rejected: 'Documents rejetés',
    resubmitted: 'Documents re-soumis',
    circuit_submitted: 'Fiche circuit soumise',
    circuit_validated: 'Fiche circuit validée',
    suspended: 'Restaurant suspendu',
    reactivated: 'Restaurant réactivé',
}

// ============================================================
// HELPERS
// ============================================================

/**
 * Vérifie si tous les documents obligatoires sont uploadés
 */
export function areDocumentsComplete(doc: RestaurantVerificationDocument | null): boolean {
    if (!doc) return false
    return !!(doc.profilePhotoUrl && doc.identityDocumentUrl)
}

/**
 * Vérifie si un restaurant peut être activé
 * Un restaurant ne peut être actif que s'il est vérifié
 */
export function canActivateRestaurant(verificationStatus: RestaurantVerificationStatus): boolean {
    return verificationStatus === 'verified'
}

/**
 * Retourne le variant du badge selon le statut
 */
export function getVerificationBadgeVariant(
    status: RestaurantVerificationStatus
): 'default' | 'secondary' | 'destructive' | 'outline' | 'success' {
    switch (status) {
        case 'verified':
            return 'success'
        case 'documents_submitted':
            return 'default'
        case 'documents_rejected':
        case 'suspended':
            return 'destructive'
        case 'pending_documents':
        default:
            return 'secondary'
    }
}

/**
 * Calcule le nombre de jours restants avant la deadline
 */
export function getDaysRemaining(deadlineAt: Date): number {
    const now = new Date()
    const deadline = new Date(deadlineAt)
    const diffTime = deadline.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
}

/**
 * Vérifie si la deadline est dépassée
 */
export function isDeadlineOverdue(deadlineAt: Date): boolean {
    return new Date(deadlineAt) < new Date()
}

/**
 * Retourne le message d'alerte selon le nombre de jours restants
 */
export function getDeadlineMessage(deadlineAt: Date): {
    message: string
    variant: 'default' | 'secondary' | 'destructive'
} {
    const daysRemaining = getDaysRemaining(deadlineAt)

    if (daysRemaining < 0) {
        return {
            message: `Échéance dépassée de ${Math.abs(daysRemaining)} jour(s)`,
            variant: 'destructive',
        }
    } else if (daysRemaining <= 7) {
        return {
            message: `Plus que ${daysRemaining} jour(s) pour soumettre`,
            variant: 'secondary',
        }
    } else {
        return {
            message: `${daysRemaining} jour(s) restants`,
            variant: 'default',
        }
    }
}

/**
 * Formatte le type de document pour l'affichage
 */
export function formatDocumentType(type: IdentityDocumentType | null): string {
    if (!type) return 'Non spécifié'
    return IDENTITY_DOCUMENT_TYPE_LABELS[type] || type
}

/**
 * Vérifie si le restaurant nécessite une fiche circuit
 * (uniquement pour Business et Premium)
 */
export function requiresCircuitSheet(plan: string): boolean {
    return plan === 'business' || plan === 'premium'
}