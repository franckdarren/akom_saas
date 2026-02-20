// app/dashboard/caisse/_components/balance/BalanceCard.tsx
'use client'

import {
    TrendingUp,
    TrendingDown,
    Wallet,
    ArrowRightLeft,
} from 'lucide-react'
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import {Separator} from '@/components/ui/separator'
import {cn} from '@/lib/utils'
import type {SessionWithRelations} from '../../_types'

function computeLocalBalance(session: SessionWithRelations) {
    const totalRevenues = session.manualRevenues.reduce(
        (s, r) => s + r.totalAmount,
        0
    )

    const totalExpenses = session.expenses.reduce(
        (s, e) => s + e.amount,
        0
    )

    const theoretical =
        session.openingBalance + totalRevenues - totalExpenses

    const cashRevenues = session.manualRevenues
        .filter((r) => r.paymentMethod === 'cash')
        .reduce((s, r) => s + r.totalAmount, 0)

    const cashExpenses = session.expenses
        .filter((e) => e.paymentMethod === 'cash')
        .reduce((s, e) => s + e.amount, 0)

    const theoreticalCash =
        session.openingBalance + cashRevenues - cashExpenses

    return {
        totalRevenues,
        totalExpenses,
        theoretical,
        theoreticalCash,
    }
}

function formatAmount(amount: number) {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA'
}

interface BalanceCardProps {
    session: SessionWithRelations
}

export function BalanceCard({session}: BalanceCardProps) {
    const {
        totalRevenues,
        totalExpenses,
        theoretical,
        theoreticalCash,
    } = computeLocalBalance(session)

    const stats = [
        {
            label: "Fond d'ouverture",
            value: session.openingBalance,
            icon: <Wallet className="h-4 w-4"/>,
            textColor: 'text-muted-foreground',
            prefix: '',
        },
        {
            label: 'Recettes manuelles',
            value: totalRevenues,
            icon: <TrendingUp className="h-4 w-4"/>,
            textColor: 'text-primary',
            prefix: '+',
        },
        {
            label: 'Dépenses',
            value: totalExpenses,
            icon: <TrendingDown className="h-4 w-4"/>,
            textColor: 'text-destructive',
            prefix: '-',
        },
    ]

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    <ArrowRightLeft className="h-4 w-4 text-primary"/>
                    Balance du jour
                    {session.isHistorical && (
                        <span className="text-xs font-normal text-muted-foreground ml-1">
              (saisie historique)
            </span>
                    )}
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-5">
                {/* KPI row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {stats.map((stat) => (
                        <div
                            key={stat.label}
                            className="rounded-xl border bg-card p-4 space-y-1"
                        >
                            <div
                                className={cn(
                                    'flex items-center gap-1.5 text-xs font-medium',
                                    stat.textColor
                                )}
                            >
                                {stat.icon}
                                {stat.label}
                            </div>

                            <p
                                className={cn(
                                    'text-lg font-bold tabular-nums',
                                    stat.textColor
                                )}
                            >
                                {stat.prefix}
                                {formatAmount(stat.value)}
                            </p>
                        </div>
                    ))}
                </div>

                <Separator/>

                {/* Balances */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Cash balance */}
                    <div className="space-y-1">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Balance cash (tiroir)
                        </p>

                        <p
                            className={cn(
                                'text-2xl font-bold tabular-nums',
                                theoreticalCash >= 0
                                    ? 'text-foreground'
                                    : 'text-destructive'
                            )}
                        >
                            {formatAmount(theoreticalCash)}
                        </p>

                        <p className="text-xs text-muted-foreground">
                            Argent physique estimé
                        </p>
                    </div>

                    {/* Global balance */}
                    <div className="space-y-1">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Balance globale
                        </p>

                        <p
                            className={cn(
                                'text-2xl font-bold tabular-nums',
                                theoretical >= 0
                                    ? 'text-foreground'
                                    : 'text-destructive'
                            )}
                        >
                            {formatAmount(theoretical)}
                        </p>

                        <p className="text-xs text-muted-foreground">
                            Tous modes de paiement
                        </p>
                    </div>
                </div>

                <Separator/>

                <p className="text-xs text-muted-foreground italic">
                    ℹ️ Les paiements issus des commandes Akôm sont inclus
                    automatiquement à la clôture.
                </p>
            </CardContent>
        </Card>
    )
}