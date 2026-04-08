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
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="type-description">Entrées</CardTitle>
                    <div className="p-2 rounded-lg bg-success-subtle text-success-foreground">
                        <ArrowDownLeft className="h-4 w-4"/>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-success-foreground">
                        {formatFCFA(totalIn)}
                    </div>
                    <p className="type-caption mt-1">
                        Recettes confirmées sur la période
                    </p>
                </CardContent>
            </AppCard>

            {/* Sorties */}
            <AppCard variant="stat">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="type-description">Sorties</CardTitle>
                    <div className="p-2 rounded-lg bg-destructive/10 text-destructive">
                        <ArrowUpRight className="h-4 w-4"/>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-destructive">
                        {formatFCFA(totalOut)}
                    </div>
                    <p className="type-caption mt-1">
                        Dépenses &amp; abonnements confirmés
                    </p>
                </CardContent>
            </AppCard>

            {/* Résultat net */}
            <AppCard variant="stat">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="type-description">Résultat net</CardTitle>
                    <div
                        className={cn(
                            'p-2 rounded-lg',
                            isPositive
                                ? 'bg-success-subtle text-success-foreground'
                                : 'bg-destructive/10 text-destructive',
                        )}
                    >
                        <TrendingUp className="h-4 w-4"/>
                    </div>
                </CardHeader>
                <CardContent>
                    <div
                        className={cn(
                            'text-2xl font-bold',
                            isPositive ? 'text-success-foreground' : 'text-destructive',
                        )}
                    >
                        {isPositive ? '+' : ''}{formatFCFA(netResult)}
                    </div>
                    <p className="type-caption mt-1">
                        {count} transaction{count !== 1 ? 's' : ''} sur la période
                    </p>
                </CardContent>
            </AppCard>
        </div>
    )
}
