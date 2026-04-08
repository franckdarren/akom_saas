// types/transaction.ts
// Types unifiés pour le module Transactions d'Akôm.
// Ces types agrègent Payment, ManualRevenue, Expense et SubscriptionPayment
// sous une interface commune pour la vue centralisée.

export type TransactionSource =
    | 'order_payment'        // Payment (commande)
    | 'manual_revenue'       // ManualRevenue (recette caisse)
    | 'expense'              // Expense (dépense caisse)
    | 'subscription_payment' // SubscriptionPayment (abonnement)

export type TransactionDirection =
    | 'in'   // Entrée d'argent (du point de vue de l'établissement)
    | 'out'  // Sortie d'argent

// Statut normalisé : mapping des 3 enums Prisma vers une valeur commune
// Payment.paid → confirmed ; SubscriptionPayment.confirmed → confirmed
// ManualRevenue/Expense : toujours 'confirmed'
export type TransactionStatus =
    | 'pending'
    | 'confirmed'
    | 'failed'
    | 'refunded'

// Union des PaymentMethod + SubscriptionPaymentMethod
export type TransactionMethod =
    | 'cash'
    | 'airtel_money'
    | 'moov_money'
    | 'mobile_money'
    | 'card'
    | 'manual' // SubscriptionPayment uniquement

export interface UnifiedTransaction {
    id: string
    source: TransactionSource
    direction: TransactionDirection
    amount: number           // toujours positif ; la direction porte le signe
    status: TransactionStatus
    method: TransactionMethod
    description: string      // généré à partir des données source
    businessDate: string     // ISO date string (date métier, pas createdAt)
    createdAt: string        // ISO date string

    // Références croisées selon la source
    orderId?: string
    orderNumber?: string
    subscriptionId?: string
    sessionId?: string
    expenseCategory?: string // ExpenseCategory (expense uniquement)
}

export interface TransactionFilters {
    startDate?: Date
    endDate?: Date
    source?: TransactionSource          // undefined = toutes les sources
    direction?: TransactionDirection    // undefined = les deux
    status?: TransactionStatus          // undefined = tous les statuts
    method?: TransactionMethod          // undefined = toutes les méthodes
    search?: string
    page: number
    pageSize: number
}

export interface TransactionSummary {
    totalIn: number      // somme entrées confirmées
    totalOut: number     // somme sorties confirmées
    netResult: number    // totalIn - totalOut
    count: number        // nombre total de transactions (avant pagination)
}
