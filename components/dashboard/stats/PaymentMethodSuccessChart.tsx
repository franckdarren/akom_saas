'use client'

// components/dashboard/stats/PaymentMethodSuccessChart.tsx

import { AppCard, CardContent, CardHeader, CardTitle } from '@/components/ui/app-card'
import { PAYMENT_METHOD_LABELS } from '@/lib/utils/stats-labels'
import type { PaymentByMethod } from '@/types/stats'

interface PaymentMethodSuccessChartProps {
    data: PaymentByMethod[]
}

export function PaymentMethodSuccessChart({ data }: PaymentMethodSuccessChartProps) {
    return (
        <AppCard>
            <CardHeader>
                <CardTitle className="type-card-title">Succès par méthode de paiement</CardTitle>
            </CardHeader>
            <CardContent>
                {data.length === 0 ? (
                    <div className="layout-empty-state">
                        <p className="type-body-muted">Aucun paiement sur la période</p>
                    </div>
                ) : (
                    <div className="layout-card-body">
                        {data.map((item) => (
                            <div key={item.method} className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <span className="type-body font-medium">
                                        {PAYMENT_METHOD_LABELS[item.method] ?? item.method}
                                    </span>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <span className="type-caption text-muted-foreground">
                                            {item.paidCount}/{item.totalCount}
                                        </span>
                                        <span
                                            className={[
                                                'type-caption font-semibold w-10 text-right',
                                                item.successRate >= 90
                                                    ? 'text-success'
                                                    : item.successRate >= 70
                                                        ? 'text-warning'
                                                        : 'text-destructive',
                                            ].join(' ')}
                                        >
                                            {item.successRate}%
                                        </span>
                                    </div>
                                </div>
                                {/* Barre de progression */}
                                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                                    <div
                                        className={[
                                            'h-full rounded-full transition-all',
                                            item.successRate >= 90
                                                ? 'bg-success'
                                                : item.successRate >= 70
                                                    ? 'bg-warning'
                                                    : 'bg-destructive',
                                        ].join(' ')}
                                        style={{ width: `${item.successRate}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </AppCard>
    )
}
