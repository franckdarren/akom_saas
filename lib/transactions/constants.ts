// lib/transactions/constants.ts
// Labels et couleurs centralisés pour le module Transactions.

import type {
    TransactionSource,
    TransactionDirection,
    TransactionStatus,
    TransactionMethod,
} from '@/types/transaction'

export const SOURCE_LABELS: Record<TransactionSource, string> = {
    order_payment: 'Commande',
    manual_revenue: 'Recette',
    expense: 'Dépense',
    subscription_payment: 'Abonnement',
}

export const DIRECTION_LABELS: Record<TransactionDirection, string> = {
    in: 'Entrée',
    out: 'Sortie',
}

export const STATUS_LABELS: Record<TransactionStatus, string> = {
    pending: 'En attente',
    confirmed: 'Confirmé',
    failed: 'Échoué',
    refunded: 'Remboursé',
}

export const METHOD_LABELS: Record<TransactionMethod, string> = {
    cash: 'Espèces',
    airtel_money: 'Airtel Money',
    moov_money: 'Moov Money',
    mobile_money: 'Mobile Money',
    card: 'Carte',
    manual: 'Manuel',
}

// Classes Tailwind selon le design system Akôm (tokens sémantiques uniquement)

export const SOURCE_BADGE_CLASSES: Record<TransactionSource, string> = {
    order_payment: 'bg-blue-100 text-blue-800',        // ≡ bg-info-100 text-info-700
    manual_revenue: 'bg-emerald-100 text-emerald-800', // ≡ bg-success-100 text-success-700
    expense: 'bg-amber-100 text-amber-800',            // ≡ bg-warning-100 text-warning-700
    subscription_payment: 'bg-gray-100 text-gray-800', // ≡ bg-muted
}

export const STATUS_BADGE_CLASSES: Record<TransactionStatus, string> = {
    pending: 'bg-amber-100 text-amber-800',            // Jaune comme warning Filament
    confirmed: 'bg-emerald-100 text-emerald-800',      // Vert success
    failed:    'bg-status-cancelled text-status-cancelled-fg',
    refunded: 'bg-gray-100 text-gray-800',             // Gris muted
}

export const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
    stock_purchase: 'Marchandises',
    salary: 'Salaires',
    utilities: 'Charges',
    transport: 'Transport',
    maintenance: 'Entretien',
    marketing: 'Marketing',
    rent: 'Loyer',
    other: 'Autres',
}
