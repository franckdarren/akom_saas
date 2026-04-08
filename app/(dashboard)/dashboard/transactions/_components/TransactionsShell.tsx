// app/(dashboard)/dashboard/transactions/_components/TransactionsShell.tsx
'use client'

import {useState, useTransition, useCallback} from 'react'
import {getTransactions} from '@/lib/actions/transaction'
import {TransactionSummaryCards} from './TransactionSummaryCards'
import {TransactionFiltersBar, type ActiveFilters, type DatePreset} from './TransactionFiltersBar'
import {TransactionsTable} from './TransactionsTable'
import type {UnifiedTransaction, TransactionSummary} from '@/types/transaction'

interface TransactionsShellProps {
    initialTransactions: UnifiedTransaction[]
    initialSummary: TransactionSummary
    initialTotal: number
    defaultStartDate: string  // ISO string (mois courant)
    defaultEndDate: string
}

// Calcule la plage de dates pour un préset donné
function getDateRangeForPreset(preset: DatePreset): {startDate?: Date; endDate?: Date} {
    const now = new Date()
    switch (preset) {
        case 'today': {
            const s = new Date(now.getFullYear(), now.getMonth(), now.getDate())
            const e = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
            return {startDate: s, endDate: e}
        }
        case 'week': {
            const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1 // lundi = 0
            const s = new Date(now)
            s.setDate(now.getDate() - dayOfWeek)
            s.setHours(0, 0, 0, 0)
            const e = new Date(now)
            e.setHours(23, 59, 59, 999)
            return {startDate: s, endDate: e}
        }
        case 'month': {
            const s = new Date(now.getFullYear(), now.getMonth(), 1)
            const e = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
            return {startDate: s, endDate: e}
        }
        case 'last_month': {
            const s = new Date(now.getFullYear(), now.getMonth() - 1, 1)
            const e = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
            return {startDate: s, endDate: e}
        }
        case 'all':
            return {}
    }
}

export function TransactionsShell({
    initialTransactions,
    initialSummary,
    initialTotal,
    defaultStartDate,
    defaultEndDate,
}: TransactionsShellProps) {
    const [transactions, setTransactions] = useState<UnifiedTransaction[]>(initialTransactions)
    const [summary, setSummary] = useState<TransactionSummary>(initialSummary)
    const [total, setTotal] = useState(initialTotal)
    const [page, setPage] = useState(1)
    const [isPending, startTransition] = useTransition()

    const [filters, setFilters] = useState<ActiveFilters>({
        preset: 'month',
        source: 'all',
        direction: 'all',
        status: 'all',
        method: 'all',
        search: '',
    })

    const applyFilters = useCallback(
        (nextFilters: ActiveFilters, nextPage: number) => {
            const {startDate, endDate} = getDateRangeForPreset(nextFilters.preset)
            startTransition(async () => {
                const result = await getTransactions({
                    startDate,
                    endDate,
                    source: nextFilters.source !== 'all' ? nextFilters.source : undefined,
                    direction: nextFilters.direction !== 'all' ? nextFilters.direction : undefined,
                    status: nextFilters.status !== 'all' ? nextFilters.status : undefined,
                    method: nextFilters.method !== 'all' ? nextFilters.method : undefined,
                    search: nextFilters.search || undefined,
                    page: nextPage,
                    pageSize: 50,
                })
                setTransactions(result.transactions)
                setSummary(result.summary)
                setTotal(result.total)
                setPage(nextPage)
            })
        },
        [],
    )

    function handleFiltersChange(nextFilters: ActiveFilters) {
        setFilters(nextFilters)
        applyFilters(nextFilters, 1)
    }

    function handlePageChange(nextPage: number) {
        applyFilters(filters, nextPage)
    }

    return (
        <div className="space-y-6">
            {/* Titre */}
            <div>
                <h1 className="type-page-title">Transactions</h1>
                <p className="type-description mt-1">
                    Vue centralisée de tous les flux d&apos;argent de l&apos;établissement.
                </p>
            </div>

            {/* KPIs */}
            <TransactionSummaryCards summary={summary}/>

            {/* Filtres */}
            <TransactionFiltersBar
                filters={filters}
                onChange={handleFiltersChange}
                isPending={isPending}
            />

            {/* Table */}
            <TransactionsTable
                transactions={transactions}
                total={total}
                page={page}
                pageSize={50}
                isPending={isPending}
                onPageChange={handlePageChange}
            />
        </div>
    )
}
