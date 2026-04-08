// app/(dashboard)/dashboard/transactions/_components/TransactionsTable.tsx
'use client'

import {ChevronLeft, ChevronRight} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {AppCard, CardContent, CardHeader, CardTitle} from '@/components/ui/app-card'
import {cn} from '@/lib/utils'
import {formatFCFA} from '@/types/cash'
import {METHOD_LABELS, STATUS_BADGE_CLASSES, STATUS_LABELS, EXPENSE_CATEGORY_LABELS} from '@/lib/transactions/constants'
import {TransactionSourceBadge} from './TransactionSourceBadge'
import type {UnifiedTransaction} from '@/types/transaction'

interface TransactionsTableProps {
    transactions: UnifiedTransaction[]
    total: number
    page: number
    pageSize: number
    isPending: boolean
    onPageChange: (page: number) => void
}

function formatBusinessDate(isoString: string): string {
    const date = new Date(isoString)
    return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    })
}

export function TransactionsTable({
    transactions,
    total,
    page,
    pageSize,
    isPending,
    onPageChange,
}: TransactionsTableProps) {
    const totalPages = Math.max(1, Math.ceil(total / pageSize))
    const start = (page - 1) * pageSize + 1
    const end = Math.min(page * pageSize, total)

    if (transactions.length === 0) {
        return (
            <AppCard>
                <CardContent className="layout-empty-state">
                    <p className="type-body-muted">Aucune transaction sur cette période.</p>
                    <p className="type-caption">Ajustez les filtres pour voir plus de résultats.</p>
                </CardContent>
            </AppCard>
        )
    }

    return (
        <AppCard>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="type-card-title">
                    Transactions
                </CardTitle>
                <span className="type-caption">
                    {total} résultat{total !== 1 ? 's' : ''}
                </span>
            </CardHeader>
            <CardContent className="p-0">
                {/* Table desktop */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-muted/40">
                                <th className="type-table-head px-4 py-3 text-left">Date</th>
                                <th className="type-table-head px-4 py-3 text-left">Description</th>
                                <th className="type-table-head px-4 py-3 text-left">Source</th>
                                <th className="type-table-head px-4 py-3 text-left">Méthode</th>
                                <th className="type-table-head px-4 py-3 text-right">Montant</th>
                                <th className="type-table-head px-4 py-3 text-left">Statut</th>
                            </tr>
                        </thead>
                        <tbody className={cn(isPending && 'opacity-50 pointer-events-none')}>
                            {transactions.map(tx => (
                                <TransactionRow key={tx.id} tx={tx}/>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t px-4 py-3">
                        <span className="type-caption">
                            {start}–{end} sur {total}
                        </span>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => onPageChange(page - 1)}
                                disabled={page <= 1 || isPending}
                            >
                                <ChevronLeft className="h-4 w-4"/>
                            </Button>
                            <span className="type-caption px-2">
                                {page} / {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => onPageChange(page + 1)}
                                disabled={page >= totalPages || isPending}
                            >
                                <ChevronRight className="h-4 w-4"/>
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </AppCard>
    )
}

function TransactionRow({tx}: {tx: UnifiedTransaction}) {
    const isIn = tx.direction === 'in'
    const amountColor = isIn ? 'text-success-foreground' : 'text-destructive'
    const amountPrefix = isIn ? '+' : '−'

    const description = tx.expenseCategory
        ? `${tx.description} · ${EXPENSE_CATEGORY_LABELS[tx.expenseCategory] ?? tx.expenseCategory}`
        : tx.description

    return (
        <tr className="border-b last:border-0 hover:bg-muted/30 transition-colors">
            <td className="px-4 py-3 type-caption whitespace-nowrap">
                {formatBusinessDate(tx.businessDate)}
            </td>
            <td className="px-4 py-3 max-w-[240px]">
                <p className="type-body truncate" title={description}>
                    {description}
                </p>
            </td>
            <td className="px-4 py-3">
                <TransactionSourceBadge source={tx.source}/>
            </td>
            <td className="px-4 py-3 type-body">
                {METHOD_LABELS[tx.method]}
            </td>
            <td className={cn('px-4 py-3 text-right font-semibold tabular-nums', amountColor)}>
                {amountPrefix} {formatFCFA(tx.amount)}
            </td>
            <td className="px-4 py-3">
                <span
                    className={cn(
                        'inline-flex items-center rounded-full px-2 py-0.5 type-badge',
                        STATUS_BADGE_CLASSES[tx.status],
                    )}
                >
                    {STATUS_LABELS[tx.status]}
                </span>
            </td>
        </tr>
    )
}
