'use client'

// components/dashboard/stats/CashTab.tsx

import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'
import { AppCard, CardContent, CardHeader, CardTitle } from '@/components/ui/app-card'
import { AlertTriangle, ArrowDown, ArrowUp, Minus, Scale, Wallet } from 'lucide-react'
import { CashOperatorsTable } from './CashOperatorsTable'
import { CsvExportButton } from './CsvExportButton'
import { formatPrice } from '@/lib/utils/format'
import { cn } from '@/lib/utils'
import type { CashAnalytics, CashSessionStat } from '@/types/stats'

const CashBalanceChart = dynamic(
    () => import('./CashBalanceChart').then((m) => ({ default: m.CashBalanceChart })),
    { ssr: false, loading: () => <Skeleton className="h-[340px] w-full rounded-xl" /> },
)

const CashGapChart = dynamic(
    () => import('./CashGapChart').then((m) => ({ default: m.CashGapChart })),
    { ssr: false, loading: () => <Skeleton className="h-[340px] w-full rounded-xl" /> },
)

interface CashTabProps {
    analytics: CashAnalytics
}

function computePercentChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0
    return Math.round(((current - previous) / previous) * 1000) / 10
}

function buildSessionsCsv(sessions: CashSessionStat[]): string[][] {
    return [
        ['Date', 'Ouverture (FCFA)', 'Fermeture (FCFA)', 'Écart (FCFA)', 'Statut'],
        ...sessions.map((s) => [
            s.sessionDate,
            String(s.openingBalance),
            s.closingBalance !== null ? String(s.closingBalance) : '',
            s.balanceDifference !== null ? String(s.balanceDifference) : '',
            s.status === 'closed' ? 'Clôturée' : 'Ouverte',
        ]),
    ]
}

export function CashTab({ analytics }: CashTabProps) {
    const {
        sessions,
        avgOpeningBalance,
        avgClosingBalance,
        avgGapAmount,
        gapCount,
        operators,
        previousSessionsCount,
    } = analytics

    const hasGaps = gapCount > 0
    const sessionsChange = computePercentChange(sessions.length, previousSessionsCount)
    const sessionsUp = sessionsChange > 0

    return (
        <div className="layout-sections">
            {/* KPIs */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Nombre de sessions avec trend N-1 */}
                <AppCard variant="stat">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="type-description">Sessions de caisse</CardTitle>
                        <div className="p-2 rounded-lg bg-info-subtle text-info">
                            <Scale className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{sessions.length}</div>
                        <div className="mt-1 flex items-center gap-1 type-caption">
                            {sessionsChange === 0 ? (
                                <span className="flex items-center gap-0.5 text-muted-foreground">
                                    <Minus className="h-3 w-3" />
                                    Aucune variation
                                </span>
                            ) : (
                                <span className={cn(
                                    'flex items-center gap-0.5 font-medium',
                                    sessionsUp ? 'text-success' : 'text-destructive',
                                )}>
                                    {sessionsUp ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                                    {sessionsUp ? '+' : ''}{sessionsChange}%
                                </span>
                            )}
                            <span className="text-muted-foreground">vs période préc.</span>
                        </div>
                    </CardContent>
                </AppCard>

                {/* Solde moyen d'ouverture */}
                <AppCard variant="stat">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="type-description">Solde moyen ouverture</CardTitle>
                        <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                            <Wallet className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {sessions.length > 0 ? formatPrice(avgOpeningBalance) : '—'}
                        </div>
                        <p className="mt-1 type-caption text-muted-foreground">
                            Fonds de caisse moyen
                        </p>
                    </CardContent>
                </AppCard>

                {/* Solde moyen de fermeture */}
                <AppCard variant="stat">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="type-description">Solde moyen fermeture</CardTitle>
                        <div className="p-2 rounded-lg bg-success-subtle text-success">
                            <Wallet className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {avgClosingBalance !== null ? formatPrice(avgClosingBalance) : '—'}
                        </div>
                        <p className="mt-1 type-caption text-muted-foreground">
                            Sessions clôturées uniquement
                        </p>
                    </CardContent>
                </AppCard>

                {/* Écarts */}
                <AppCard variant="stat">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="type-description">Écarts détectés</CardTitle>
                        <div
                            className={cn(
                                'p-2 rounded-lg',
                                hasGaps
                                    ? 'bg-warning-subtle text-warning'
                                    : 'bg-success-subtle text-success',
                            )}
                        >
                            <AlertTriangle className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div
                            className={cn(
                                'text-2xl font-bold',
                                hasGaps ? 'text-warning' : 'text-foreground',
                            )}
                        >
                            {gapCount}
                        </div>
                        <p className="mt-1 type-caption text-muted-foreground">
                            {hasGaps && avgGapAmount !== null
                                ? `Écart moyen : ${formatPrice(avgGapAmount)}`
                                : 'Aucun écart &gt; 500 FCFA'}
                        </p>
                    </CardContent>
                </AppCard>
            </div>

            {/* Graphiques soldes & écarts */}
            <div className="grid gap-6 md:grid-cols-2">
                <CashBalanceChart data={sessions} />
                <CashGapChart data={sessions} />
            </div>

            {/* Activité opérateurs + export CSV */}
            <div className="grid gap-6 md:grid-cols-2">
                {operators.length > 0 && <CashOperatorsTable operators={operators} />}
                {sessions.length > 0 && (
                    <div className={operators.length > 0 ? 'flex items-start justify-end' : 'flex justify-end'}>
                        <CsvExportButton
                            rows={buildSessionsCsv(sessions)}
                            filename="sessions-caisse.csv"
                            label="Exporter les sessions"
                        />
                    </div>
                )}
            </div>
        </div>
    )
}
