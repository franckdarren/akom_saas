// components/dashboard/stats/CashOperatorsTable.tsx
// Pas de Recharts — composant serveur-compatible (pas de 'use client')

import { AppCard, CardContent, CardHeader, CardTitle } from '@/components/ui/app-card'
import type { CashOperatorStat } from '@/types/stats'

interface CashOperatorsTableProps {
    operators: CashOperatorStat[]
}

export function CashOperatorsTable({ operators }: CashOperatorsTableProps) {
    return (
        <AppCard>
            <CardHeader>
                <CardTitle className="type-card-title">Activité par opérateur</CardTitle>
            </CardHeader>
            <CardContent>
                {operators.length === 0 ? (
                    <div className="layout-empty-state">
                        <p className="type-body-muted">Aucune session sur la période</p>
                    </div>
                ) : (
                    <div className="layout-card-body">
                        {/* En-tête */}
                        <div className="grid grid-cols-3 pb-2 border-b">
                            <span className="type-table-head">Opérateur</span>
                            <span className="type-table-head text-center">Ouvertures</span>
                            <span className="type-table-head text-right">Fermetures</span>
                        </div>
                        {/* Lignes */}
                        {operators.map((op) => (
                            <div
                                key={op.userId}
                                className="grid grid-cols-3 py-2 border-b last:border-0"
                            >
                                <span
                                    className="type-body truncate pr-2"
                                    title={op.email}
                                >
                                    {op.email}
                                </span>
                                <span className="type-body text-center font-medium">
                                    {op.sessionsOpened}
                                </span>
                                <span className="type-body text-right font-medium">
                                    {op.sessionsClosed > 0 ? op.sessionsClosed : '—'}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </AppCard>
    )
}
