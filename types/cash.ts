// types/cash.ts
// Fichier de types globaux pour le module caisse — à importer
// partout où tu manipules ces données en dehors du dossier _types local.

import type {CashSession, ManualRevenue, Expense, Product, Stock} from '@prisma/client'

// Type utilitaire pour formater un montant en FCFA
// avec le séparateur de milliers français.
// Usage : formatFCFA(15000) → "15 000 FCFA"
export function formatFCFA(amount: number): string {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA'
}

// Calcule si un écart de caisse est préoccupant.
// Retourne 'ok', 'minor' ou 'major' selon le seuil.
export function getDiffStatus(difference: number | null): 'ok' | 'minor' | 'major' {
    if (difference === null) return 'ok'
    const abs = Math.abs(difference)
    if (abs === 0) return 'ok'
    if (abs <= 500) return 'minor'
    return 'major'
}

// Retourne la clé de date normalisée (YYYY-MM-DD) d'une session.
// Utile pour construire l'index du calendrier.
export function getSessionDateKey(sessionDate: Date | string): string {
    return new Date(sessionDate).toISOString().split('T')[0]
}

// Labels humains pour les méthodes de paiement.
// On les centralise ici pour ne pas les répéter dans chaque composant.
export const PAYMENT_METHOD_LABELS: Record<string, string> = {
    cash: '💵 Cash',
    airtel_money: '📱 Airtel Money',
    moov_money: '📱 Moov Money',
    card: '💳 Carte',
    other: 'Autre',
}

// Labels pour les catégories de dépenses.
export const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
    stock_purchase: '📦 Marchandises',
    salary: '👤 Salaires',
    utilities: '💡 Charges',
    transport: '🚗 Transport',
    maintenance: '🔧 Entretien',
    marketing: '📣 Marketing',
    rent: '🏠 Loyer',
    other: '❓ Autres',
}