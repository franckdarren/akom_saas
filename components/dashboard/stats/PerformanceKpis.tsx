// components/dashboard/stats/PerformanceKpis.tsx

import { AppCard, CardContent, CardHeader, CardTitle } from '@/components/ui/app-card'
import { XCircle, Clock, ShoppingCart, ArrowUp, ArrowDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PerformanceAnalytics } from '@/types/stats'

interface PerformanceKpisProps {
    performance: PerformanceAnalytics
}

function formatDuration(minutes: number): string {
    if (minutes < 60) return `${Math.round(minutes)} min`
    const h = Math.floor(minutes / 60)
    const m = Math.round(minutes % 60)
    return m > 0 ? `${h}h ${m}min` : `${h}h`
}

function computePercentChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0
    return Math.round(((current - previous) / previous) * 1000) / 10
}

export function PerformanceKpis({ performance }: PerformanceKpisProps) {
    const { totalOrders, previousTotalOrders, cancellationRate, cancelledCount, avgFulfillmentMinutes } = performance
    const highCancellationRate = cancellationRate >= 15
    const ordersChange = computePercentChange(totalOrders, previousTotalOrders)
    const ordersUp = ordersChange > 0

    return (
        <div className="grid gap-4 md:grid-cols-3">
            {/* Total commandes avec trend N-1 */}
            <AppCard variant="stat">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="type-description">Total commandes</CardTitle>
                    <div className="p-2 rounded-lg bg-info-subtle text-info">
                        <ShoppingCart className="h-4 w-4" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalOrders}</div>
                    <div className="mt-1 flex items-center gap-1 type-caption">
                        {ordersChange === 0 ? (
                            <span className="flex items-center gap-0.5 text-muted-foreground">
                                <Minus className="h-3 w-3" />
                                Aucune variation
                            </span>
                        ) : (
                            <span className={cn(
                                'flex items-center gap-0.5 font-medium',
                                ordersUp ? 'text-success' : 'text-destructive',
                            )}>
                                {ordersUp ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                                {ordersUp ? '+' : ''}{ordersChange}%
                            </span>
                        )}
                        <span className="text-muted-foreground">vs période préc.</span>
                    </div>
                </CardContent>
            </AppCard>

            {/* Taux d'annulation */}
            <AppCard variant="stat">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="type-description">Taux d'annulation</CardTitle>
                    <div className={cn(
                        'p-2 rounded-lg',
                        highCancellationRate
                            ? 'bg-destructive/10 text-destructive'
                            : 'bg-success-subtle text-success',
                    )}>
                        <XCircle className="h-4 w-4" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className={cn(
                        'text-2xl font-bold',
                        highCancellationRate ? 'text-destructive' : 'text-foreground',
                    )}>
                        {cancellationRate}%
                    </div>
                    <p className="mt-1 type-caption text-muted-foreground">
                        {cancelledCount} commande{cancelledCount > 1 ? 's' : ''} annulée{cancelledCount > 1 ? 's' : ''}
                    </p>
                </CardContent>
            </AppCard>

            {/* Délai moyen de traitement */}
            <AppCard variant="stat">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="type-description">Délai moyen de traitement</CardTitle>
                    <div className="p-2 rounded-lg bg-info-subtle text-info">
                        <Clock className="h-4 w-4" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {avgFulfillmentMinutes != null
                            ? formatDuration(avgFulfillmentMinutes)
                            : '—'}
                    </div>
                    <p className="mt-1 type-caption text-muted-foreground">
                        Commande reçue → livrée
                    </p>
                </CardContent>
            </AppCard>
        </div>
    )
}
