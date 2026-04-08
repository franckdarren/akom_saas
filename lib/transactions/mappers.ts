// lib/transactions/mappers.ts
// Fonctions de mapping : types Prisma → UnifiedTransaction.
// Chaque mapper isole la logique de normalisation d'une source.

import type {
    Payment,
    PaymentStatus,
    PaymentMethod,
    ManualRevenue,
    Expense,
    SubscriptionPayment,
    SubscriptionPaymentStatus,
    SubscriptionPaymentMethod,
    SubscriptionPlan,
} from '@prisma/client'
import type {UnifiedTransaction, TransactionStatus, TransactionMethod} from '@/types/transaction'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapPaymentStatus(status: PaymentStatus): TransactionStatus {
    switch (status) {
        case 'paid':
            return 'confirmed'
        case 'pending':
            return 'pending'
        case 'failed':
            return 'failed'
        case 'refunded':
            return 'refunded'
    }
}

function mapSubscriptionStatus(status: SubscriptionPaymentStatus): TransactionStatus {
    switch (status) {
        case 'confirmed':
            return 'confirmed'
        case 'pending':
            return 'pending'
        case 'failed':
            return 'failed'
        case 'refunded':
            return 'refunded'
    }
}

function mapPaymentMethod(method: PaymentMethod | SubscriptionPaymentMethod): TransactionMethod {
    // PaymentMethod et SubscriptionPaymentMethod partagent les mêmes valeurs
    // sauf 'manual' qui est propre à SubscriptionPaymentMethod.
    return method as TransactionMethod
}

const PLAN_LABELS: Record<SubscriptionPlan, string> = {
    starter: 'Starter',
    business: 'Business',
    premium: 'Premium',
}

// ─── Mappers ──────────────────────────────────────────────────────────────────

type PaymentWithOrder = Payment & {
    order: {id: string; orderNumber: string | null}
}

export function mapPayment(payment: PaymentWithOrder): UnifiedTransaction {
    const orderNum = payment.order.orderNumber
    return {
        id: payment.id,
        source: 'order_payment',
        direction: 'in',
        amount: payment.amount,
        status: mapPaymentStatus(payment.status),
        method: mapPaymentMethod(payment.method),
        description: orderNum ? `Commande ${orderNum}` : 'Commande',
        businessDate: (payment.paidAt ?? payment.createdAt).toISOString(),
        createdAt: payment.createdAt.toISOString(),
        orderId: payment.orderId,
        orderNumber: orderNum ?? undefined,
    }
}

type SubscriptionPaymentWithPlan = SubscriptionPayment & {
    subscription: {plan: SubscriptionPlan}
}

export function mapSubscriptionPayment(sp: SubscriptionPaymentWithPlan): UnifiedTransaction {
    const planLabel = PLAN_LABELS[sp.subscription.plan]
    const cycleLabel = sp.billingCycle === 1 ? '1 mois' : `${sp.billingCycle} mois`
    return {
        id: sp.id,
        source: 'subscription_payment',
        direction: 'out',
        amount: sp.amount,
        status: mapSubscriptionStatus(sp.status),
        method: mapPaymentMethod(sp.method),
        description: `Abonnement ${planLabel} — ${cycleLabel}`,
        businessDate: (sp.paidAt ?? sp.createdAt).toISOString(),
        createdAt: sp.createdAt.toISOString(),
        subscriptionId: sp.subscriptionId,
    }
}

export function mapManualRevenue(rev: ManualRevenue): UnifiedTransaction {
    return {
        id: rev.id,
        source: 'manual_revenue',
        direction: 'in',
        amount: rev.totalAmount,
        status: 'confirmed',
        method: mapPaymentMethod(rev.paymentMethod),
        description: rev.description,
        businessDate: rev.revenueDate.toISOString(),
        createdAt: rev.createdAt.toISOString(),
        sessionId: rev.sessionId,
    }
}

export function mapExpense(expense: Expense): UnifiedTransaction {
    return {
        id: expense.id,
        source: 'expense',
        direction: 'out',
        amount: expense.amount,
        status: 'confirmed',
        method: mapPaymentMethod(expense.paymentMethod),
        description: expense.description,
        businessDate: expense.expenseDate.toISOString(),
        createdAt: expense.createdAt.toISOString(),
        sessionId: expense.sessionId,
        expenseCategory: expense.category,
    }
}
