// app/dashboard/caisse/_components/SessionSummary.tsx

import {
    CheckCircle2,
    AlertTriangle,
    XCircle,
    History,
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
import {RevenueList} from './revenues/RevenueList'
import {ExpenseList} from './expenses/ExpenseList'
import type {SessionWithRelations} from '../_types'

function formatAmount(n: number) {
    return new Intl.NumberFormat('fr-FR').format(n) + ' FCFA'
}

export function SessionSummary({
                                   session,
                               }: {
    session: SessionWithRelations
}) {
    const manualRevenues = session.manualRevenues ?? []
    const expenses = session.expenses ?? []

    const totalRevenues = manualRevenues.reduce(
        (s, r) => s + r.totalAmount,
        0
    )

    const totalExpenses = expenses.reduce(
        (s, e) => s + e.amount,
        0
    )

    const diff = session.balanceDifference ?? 0
    const TOLERANCE = 500

    const diffStatus =
        Math.abs(diff) === 0
            ? 'perfect'
            : Math.abs(diff) <= TOLERANCE
                ? 'minor'
                : 'major'

    return (
        <div className="space-y-5">
            {/* Header block */}
            <div className="flex items-center gap-3 p-4 rounded-xl border bg-muted/50">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0"/>

                <div className="flex-1">
                    <p className="text-sm font-medium">
                        Session clôturée
                    </p>

                    <p className="text-xs text-muted-foreground">
                        {new Date(session.sessionDate).toLocaleDateString(
                            'fr-FR',
                            {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                            }
                        )}

                        {session.isHistorical && (
                            <span className="ml-2">
                <Badge
                    variant="secondary"
                    className="text-xs gap-1"
                >
                  <History className="h-3 w-3"/>
                  Historique
                </Badge>
              </span>
                        )}
                    </p>
                </div>

                {session.closedAt && (
                    <p className="text-xs text-muted-foreground">
                        {new Date(session.closedAt).toLocaleTimeString(
                            'fr-FR',
                            {
                                hour: '2-digit',
                                minute: '2-digit',
                            }
                        )}
                    </p>
                )}
            </div>

            {/* Financial summary */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">
                        Résumé financier
                    </CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                    {[
                        {label: "Fond d'ouverture", value: session.openingBalance},
                        {
                            label: 'Recettes manuelles',
                            value: totalRevenues,
                            positive: true,
                        },
                        {
                            label: 'Dépenses',
                            value: totalExpenses,
                            negative: true,
                        },
                        {
                            label: 'Balance théorique',
                            value: session.theoreticalBalance ?? 0,
                            bold: true,
                        },
                    ].map((row) => (
                        <div
                            key={row.label}
                            className="flex justify-between items-center"
                        >
              <span
                  className={cn(
                      'text-sm',
                      row.bold && 'font-semibold'
                  )}
              >
                {row.label}
              </span>

                            <span
                                className={cn(
                                    'text-sm tabular-nums',
                                    row.bold &&
                                    'font-bold text-base text-primary',
                                    row.positive &&
                                    'text-primary font-medium',
                                    row.negative &&
                                    'text-destructive font-medium'
                                )}
                            >
                {row.positive
                    ? '+'
                    : row.negative
                        ? '-'
                        : ''}
                                {formatAmount(row.value)}
              </span>
                        </div>
                    ))}

                    <Separator/>

                    {/* Difference block */}
                    <div
                        className={cn(
                            'flex items-center gap-3 p-4 rounded-lg border',
                            diffStatus === 'perfect' &&
                            'bg-primary/5 text-primary',
                            diffStatus === 'minor' &&
                            'bg-muted text-foreground',
                            diffStatus === 'major' &&
                            'bg-destructive/10 text-destructive'
                        )}
                    >
                        {diffStatus === 'perfect' && (
                            <CheckCircle2 className="h-4 w-4 shrink-0"/>
                        )}
                        {diffStatus === 'minor' && (
                            <AlertTriangle className="h-4 w-4 shrink-0"/>
                        )}
                        {diffStatus === 'major' && (
                            <XCircle className="h-4 w-4 shrink-0"/>
                        )}

                        <div className="flex-1">
                            <p className="text-sm font-medium">
                                Compté :{' '}
                                {formatAmount(
                                    session.closingBalance ?? 0
                                )}
                            </p>

                            <p className="text-xs">
                                Écart :{' '}
                                {diff >= 0 ? '+' : ''}
                                {formatAmount(Math.abs(diff))}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Lists */}
            <div className="grid md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm">
                            💰 Recettes ({manualRevenues.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <RevenueList revenues={manualRevenues}/>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm">
                            💸 Dépenses ({expenses.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ExpenseList expenses={expenses}/>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}