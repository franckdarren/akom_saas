// types/change-due.ts
// Monnaie due aux clients — types partagés entre les Server Actions et l'UI.

import type {ChangeDueStatus, ChangeDueSettlementMethod} from '@prisma/client'

export type {ChangeDueStatus, ChangeDueSettlementMethod}

/**
 * Ligne de monnaie due telle que consommée par les composants client.
 * Les dates sont déjà sérialisées en ISO (les objets Date ne traversent pas
 * la frontière serveur → client).
 */
export interface ChangeDueRow {
    id: string
    code: string
    amount: number
    status: ChangeDueStatus

    customerName: string | null
    customerPhone: string | null

    dueDate: string
    createdAt: string

    settlementMethod: ChangeDueSettlementMethod | null
    settledDate: string | null
    settledAt: string | null
    cancelReason: string | null
    notes: string | null

    // Numéros de commande dénormalisés pour l'affichage
    orderNumber: string | null
    settledOrderNumber: string | null

    // Traçabilité : email de l'opérateur, ou null si non résolu
    createdByEmail: string | null
    settledByEmail: string | null
}

export interface ChangeDueListResult {
    rows: ChangeDueRow[]
    /** Total encore dû aux clients, tous statuts `outstanding` confondus. */
    outstandingTotal: number
    outstandingCount: number
}

/** Dette trouvée par code, pour application au comptoir. */
export interface ChangeDueLookup {
    id: string
    code: string
    amount: number
    customerName: string | null
    customerPhone: string | null
    dueDate: string
}

export const CHANGE_DUE_STATUS_LABELS: Record<ChangeDueStatus, string> = {
    outstanding: 'En cours',
    settled: 'Soldée',
    cancelled: 'Annulée',
}

export const CHANGE_DUE_SETTLEMENT_LABELS: Record<ChangeDueSettlementMethod, string> = {
    cash: 'Rendue en espèces',
    order_deduction: 'Déduite d\'un achat',
}
