// lib/actions/transaction.ts
// Server Action qui agrège Payment, ManualRevenue, Expense et SubscriptionPayment
// sous une liste unifiée de transactions pour le module Transactions d'Akôm.

'use server'

import prisma from '@/lib/prisma'
import {getCurrentUserAndRestaurant} from '@/lib/auth/session'
import type {
    TransactionFilters,
    UnifiedTransaction,
    TransactionSummary,
    TransactionSource,
} from '@/types/transaction'
import {
    mapPayment,
    mapSubscriptionPayment,
    mapManualRevenue,
    mapExpense,
} from '@/lib/transactions/mappers'
import {PaymentMethod, SubscriptionPaymentMethod} from '@prisma/client'

function endOfDay(date: Date): Date {
    const d = new Date(date)
    d.setHours(23, 59, 59, 999)
    return d
}

function startOfDay(date: Date): Date {
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)
    return d
}

export async function getTransactions(filters: TransactionFilters): Promise<{
    transactions: UnifiedTransaction[]
    total: number
    summary: TransactionSummary
}> {
    const {restaurantId} = await getCurrentUserAndRestaurant()
    if (!restaurantId) throw new Error('Non autorisé')

    const {
        startDate,
        endDate,
        source,
        direction,
        status,
        method,
        search,
        page = 1,
        pageSize = 50,
    } = filters

    const start = startDate ? startOfDay(startDate) : undefined
    const end = endDate ? endOfDay(endDate) : undefined

    const allSources: TransactionSource[] = [
        'order_payment',
        'manual_revenue',
        'expense',
        'subscription_payment',
    ]
    const sourcesToQuery = source ? [source] : allSources

    const queryPayments =
        sourcesToQuery.includes('order_payment') &&
        (direction === undefined || direction === 'in')
    const queryRevenues =
        sourcesToQuery.includes('manual_revenue') &&
        (direction === undefined || direction === 'in')
    const queryExpenses =
        sourcesToQuery.includes('expense') &&
        (direction === undefined || direction === 'out')
    const querySubscriptions =
        sourcesToQuery.includes('subscription_payment') &&
        (direction === undefined || direction === 'out')

    const paymentStatusMap = {
        pending: 'pending' as const,
        confirmed: 'paid' as const,
        failed: 'failed' as const,
        refunded: 'refunded' as const,
    }
    const subscriptionStatusMap = {
        pending: 'pending' as const,
        confirmed: 'confirmed' as const,
        failed: 'failed' as const,
        refunded: 'refunded' as const,
    }

    // 'manual' n'existe pas dans PaymentMethod → on l'exclut pour ces tables
    const paymentMethodFilter =
        method && method !== 'manual' && Object.values(PaymentMethod).includes(method as PaymentMethod)
            ? (method as PaymentMethod)
            : undefined
    const subscriptionMethodFilter =
        method && Object.values(SubscriptionPaymentMethod).includes(method as SubscriptionPaymentMethod)
            ? (method as SubscriptionPaymentMethod)
            : undefined

    const dateFilterCreatedAt = start || end
        ? {createdAt: {...(start ? {gte: start} : {}), ...(end ? {lte: end} : {})}}
        : {}
    const dateFilterRevenueDate = start || end
        ? {revenueDate: {...(start ? {gte: start} : {}), ...(end ? {lte: end} : {})}}
        : {}
    const dateFilterExpenseDate = start || end
        ? {expenseDate: {...(start ? {gte: start} : {}), ...(end ? {lte: end} : {})}}
        : {}

    const [payments, revenues, expenses, subscriptionPayments] = await Promise.all([
        queryPayments
            ? prisma.payment.findMany({
                where: {
                    restaurantId,
                    ...dateFilterCreatedAt,
                    ...(status ? {status: paymentStatusMap[status]} : {}),
                    ...(paymentMethodFilter ? {method: paymentMethodFilter} : {}),
                },
                include: {order: {select: {id: true, orderNumber: true}}},
                orderBy: {createdAt: 'desc'},
            })
            : Promise.resolve([]),

        queryRevenues
            ? prisma.manualRevenue.findMany({
                where: {
                    restaurantId,
                    ...dateFilterRevenueDate,
                    ...(paymentMethodFilter ? {paymentMethod: paymentMethodFilter} : {}),
                },
                orderBy: {revenueDate: 'desc'},
            })
            : Promise.resolve([]),

        queryExpenses
            ? prisma.expense.findMany({
                where: {
                    restaurantId,
                    ...dateFilterExpenseDate,
                    ...(paymentMethodFilter ? {paymentMethod: paymentMethodFilter} : {}),
                },
                orderBy: {expenseDate: 'desc'},
            })
            : Promise.resolve([]),

        querySubscriptions
            ? prisma.subscriptionPayment.findMany({
                where: {
                    restaurantId,
                    ...dateFilterCreatedAt,
                    ...(status ? {status: subscriptionStatusMap[status]} : {}),
                    ...(subscriptionMethodFilter ? {method: subscriptionMethodFilter} : {}),
                },
                include: {subscription: {select: {plan: true}}},
                orderBy: {createdAt: 'desc'},
            })
            : Promise.resolve([]),
    ])

    let all: UnifiedTransaction[] = [
        ...payments.map(mapPayment),
        ...revenues.map(mapManualRevenue),
        ...expenses.map(mapExpense),
        ...subscriptionPayments.map(mapSubscriptionPayment),
    ]

    // ManualRevenue et Expense sont toujours 'confirmed'.
    // Si le filtre demande un autre statut, on les retire.
    if (status && status !== 'confirmed') {
        all = all.filter(t => t.source !== 'manual_revenue' && t.source !== 'expense')
    }

    if (search?.trim()) {
        const q = search.trim().toLowerCase()
        all = all.filter(
            t =>
                t.description.toLowerCase().includes(q) ||
                (t.orderNumber?.toLowerCase().includes(q) ?? false),
        )
    }

    all.sort(
        (a, b) => new Date(b.businessDate).getTime() - new Date(a.businessDate).getTime(),
    )

    const confirmed = all.filter(t => t.status === 'confirmed')
    const totalIn = confirmed
        .filter(t => t.direction === 'in')
        .reduce((sum, t) => sum + t.amount, 0)
    const totalOut = confirmed
        .filter(t => t.direction === 'out')
        .reduce((sum, t) => sum + t.amount, 0)

    const summary: TransactionSummary = {
        totalIn,
        totalOut,
        netResult: totalIn - totalOut,
        count: all.length,
    }

    const total = all.length
    const offset = (page - 1) * pageSize
    const paginated = all.slice(offset, offset + pageSize)

    return {transactions: paginated, total, summary}
}
