// app/(dashboard)/dashboard/transactions/_components/TransactionSummaryCards.tsx
import {ArrowDownLeft, ArrowUpRight, TrendingUp} from 'lucide-react'
import {AppCard, CardContent, CardHeader, CardTitle} from '@/components/ui/app-card'
import {cn} from '@/lib/utils'
import {formatFCFA} from '@/types/cash'
import type {TransactionSummary} from '@/types/transaction'

interface TransactionSummaryCardsProps {
    summary: TransactionSummary
}

export function TransactionSummaryCards({summary}: TransactionSummaryCardsProps) {
    const {totalIn, totalOut, netResult, count} = summary
    const isPositive = netResult >= 0

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Entrées */}
            <AppCard variant="stat">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="type-description">Entrées</CardTitle>
                    <ArrowDownLeft className="h-4 w-4 text-muted-foreground"/>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatFCFA(totalIn)}</div>
                    <p className="type-caption mt-1">Recettes confirmées</p>
                </CardContent>
            </AppCard>

            {/* Sorties */}
            <AppCard variant="stat">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="type-description">Sorties</CardTitle>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground"/>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatFCFA(totalOut)}</div>
                    <p className="type-caption mt-1">Dépenses &amp; abonnements</p>
                </CardContent>
            </AppCard>

            {/* Résultat net */}
            <AppCard variant="stat">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="type-description">Résultat net</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground"/>
                </CardHeader>
                <CardContent>
                    <div
                        className={cn(
                            'text-2xl font-bold',
                            isPositive ? 'text-success' : 'text-destructive',
                        )}
                    >
                        {isPositive ? '+' : ''}{formatFCFA(netResult)}
                    </div>
                    <p className="type-caption mt-1">
                        {count} transaction{count !== 1 ? 's' : ''}
                    </p>
                </CardContent>
            </AppCard>
        </div>
    )
}
