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

// Classes Tailwind selon le design system Akôm (tokens sémantiques)
export const SOURCE_BADGE_CLASSES: Record<TransactionSource, string> = {
    order_payment: 'bg-info-subtle text-info-foreground',
    manual_revenue: 'bg-success-subtle text-success-foreground',
    expense: 'bg-warning-subtle text-warning-foreground',
    subscription_payment: 'bg-muted text-muted-foreground',
}

export const STATUS_BADGE_CLASSES: Record<TransactionStatus, string> = {
    pending: 'bg-status-pending text-status-pending-fg',
    confirmed: 'bg-status-delivered text-status-delivered-fg',
    failed: 'bg-status-cancelled text-status-cancelled-fg',
    refunded: 'bg-muted text-muted-foreground',
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
