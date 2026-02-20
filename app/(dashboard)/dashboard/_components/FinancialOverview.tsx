// app/(dashboard)/dashboard/_components/FinancialOverview.tsx

import {
    TrendingUp,
    TrendingDown,
    Minus,
    BookOpen,
} from 'lucide-react'
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import {Badge} from '@/components/ui/badge'
import {Separator} from '@/components/ui/separator'
import {cn} from '@/lib/utils'
import type {FinancialPeriodStats} from '@/lib/stats/financial-aggregates'

interface FinancialOverviewProps {
    stats: FinancialPeriodStats
    title?: string
}

function fmt(n: number) {
    return new Intl.NumberFormat('fr-FR').format(n) + ' FCFA'
}

const EXPENSE_LABELS: Record<string, string> = {
    stock_purchase: '📦 Marchandises',
    salary: '👤 Salaires',
    utilities: '💡 Charges',
    transport: '🚗 Transport',
    maintenance: '🔧 Entretien',
    marketing: '📣 Marketing',
    rent: '🏠 Loyer',
    other: '❓ Autres',
}

export function FinancialOverview({
                                      stats,
                                      title = 'Aperçu financier',
                                  }: FinancialOverviewProps) {
    const isPositive = stats.netResult >= 0

    const cards = [
        {
            label: 'Recettes totales',
            value: stats.totalRevenue,
            icon: <TrendingUp className="h-4 w-4"/>,
            textColor: 'text-primary',
            detail:
                stats.manualRevenue > 0
                    ? `dont ${fmt(stats.manualRevenue)} manuels`
                    : undefined,
        },
        {
            label: 'Dépenses',
            value: stats.totalExpenses,
            icon: <TrendingDown className="h-4 w-4"/>,
            textColor: 'text-destructive',
            detail:
                stats.expensesByCategory.length > 0
                    ? `${stats.expensesByCategory.length} catégorie(s)`
                    : undefined,
        },
        {
            label: 'Résultat net',
            value: stats.netResult,
            icon: <Minus className="h-4 w-4"/>,
            textColor: isPositive ? 'text-primary' : 'text-destructive',
            detail: undefined,
        },
    ]

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{title}</CardTitle>

                    {stats.manualRevenue > 0 && (
                        <Badge variant="secondary" className="gap-1 text-xs">
                            <BookOpen className="h-3 w-3"/>
                            Cahier inclus
                        </Badge>
                    )}
                </div>
            </CardHeader>

            <CardContent className="space-y-5">
                {/* Top summary cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {cards.map((card) => (
                        <div
                            key={card.label}
                            className="rounded-xl border bg-card p-4 space-y-1"
                        >
                            <div
                                className={cn(
                                    'flex items-center gap-1.5 text-xs font-medium',
                                    card.textColor
                                )}
                            >
                                {card.icon}
                                {card.label}
                            </div>

                            <p
                                className={cn(
                                    'text-xl font-bold tabular-nums leading-tight',
                                    card.textColor
                                )}
                            >
                                {fmt(Math.abs(card.value))}
                            </p>

                            {card.detail && (
                                <p className="text-xs text-muted-foreground">
                                    {card.detail}
                                </p>
                            )}
                        </div>
                    ))}
                </div>

                {/* Expenses by category */}
                {stats.expensesByCategory.length > 0 && (
                    <>
                        <Separator/>

                        <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                Dépenses par catégorie
                            </p>

                            {stats.expensesByCategory
                                .sort((a, b) => b.total - a.total)
                                .map((cat) => {
                                    const pct =
                                        stats.totalExpenses > 0
                                            ? Math.round(
                                                (cat.total / stats.totalExpenses) * 100
                                            )
                                            : 0

                                    return (
                                        <div
                                            key={cat.category}
                                            className="flex items-center gap-3"
                                        >
                      <span className="text-xs text-muted-foreground w-32 truncate">
                        {EXPENSE_LABELS[cat.category] ??
                            cat.category}
                      </span>

                                            <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                                                <div
                                                    className="h-full bg-destructive transition-all"
                                                    style={{width: `${pct}%`}}
                                                />
                                            </div>

                                            <span className="text-xs font-medium tabular-nums w-28 text-right">
                        {fmt(cat.total)}
                      </span>
                                        </div>
                                    )
                                })}
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    )
}