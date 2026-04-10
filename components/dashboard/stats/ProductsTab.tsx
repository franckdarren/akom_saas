'use client'

// components/dashboard/stats/ProductsTab.tsx

import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'
import { AppCard, CardContent, CardHeader, CardTitle } from '@/components/ui/app-card'
import { StockAlertsTable } from './StockAlertsTable'
import { formatPrice } from '@/lib/utils/format'
import { Package, PackageX, AlertTriangle, ArrowDown, ArrowUp, Minus, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ProductAnalytics, StockRotationItem, StockAlert } from '@/types/stats'
import { CsvExportButton } from './CsvExportButton'

const StockMovementTypeChart = dynamic(
    () =>
        import('./StockMovementTypeChart').then((m) => ({
            default: m.StockMovementTypeChart,
        })),
    { ssr: false, loading: () => <Skeleton className="h-[340px] w-full rounded-xl" /> },
)

const StockRotationChart = dynamic(
    () =>
        import('./StockRotationChart').then((m) => ({ default: m.StockRotationChart })),
    { ssr: false, loading: () => <Skeleton className="h-[340px] w-full rounded-xl" /> },
)

interface ProductsTabProps {
    analytics: ProductAnalytics
}

function computePercentChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0
    return Math.round(((current - previous) / previous) * 1000) / 10
}

function buildRotationCsv(items: StockRotationItem[]): string[][] {
    return [
        ['Produit', 'Catégorie', 'Sorties', 'Entrées', 'Stock actuel'],
        ...items.map((i) => [
            i.productName,
            i.categoryName ?? '',
            String(i.outQty),
            String(i.inQty),
            String(i.currentQty),
        ]),
    ]
}

function buildAlertsCsv(alerts: StockAlert[]): string[][] {
    return [
        ['Produit', 'Catégorie', 'Stock actuel', 'Seuil d\'alerte'],
        ...alerts.map((a) => [
            a.productName,
            a.categoryName ?? '',
            String(a.currentQuantity),
            String(a.alertThreshold),
        ]),
    ]
}

export function ProductsTab({ analytics }: ProductsTabProps) {
    const { valuation, movementsByType, topRotation, alerts, previousMovementsCount } = analytics
    const {
        totalValue,
        productsWithStock,
        productsOutOfStock,
        productsInAlert,
    } = valuation

    const hasProblems = productsOutOfStock > 0 || productsInAlert > 0
    const totalMovements = movementsByType.reduce((s, m) => s + m.count, 0)
    const movementsChange = computePercentChange(totalMovements, previousMovementsCount)
    const movementsUp = movementsChange > 0

    return (
        <div className="layout-sections">
            {/* KPIs valorisation */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Valeur totale du stock */}
                <AppCard variant="stat">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="type-description">Valeur du stock</CardTitle>
                        <div className="p-2 rounded-lg bg-info-subtle text-info">
                            <Package className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatPrice(totalValue)}</div>
                        <p className="mt-1 type-caption text-muted-foreground">
                            {productsWithStock} produit{productsWithStock > 1 ? 's' : ''} géré{productsWithStock > 1 ? 's' : ''}
                        </p>
                    </CardContent>
                </AppCard>

                {/* Ruptures de stock */}
                <AppCard variant="stat">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="type-description">Ruptures de stock</CardTitle>
                        <div
                            className={cn(
                                'p-2 rounded-lg',
                                productsOutOfStock > 0
                                    ? 'bg-destructive/10 text-destructive'
                                    : 'bg-success-subtle text-success',
                            )}
                        >
                            <PackageX className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div
                            className={cn(
                                'text-2xl font-bold',
                                productsOutOfStock > 0 ? 'text-destructive' : 'text-foreground',
                            )}
                        >
                            {productsOutOfStock}
                        </div>
                        <p className="mt-1 type-caption text-muted-foreground">
                            {productsOutOfStock > 0
                                ? `produit${productsOutOfStock > 1 ? 's' : ''} à 0 unité`
                                : 'Aucune rupture'}
                        </p>
                    </CardContent>
                </AppCard>

                {/* Alertes stock bas */}
                <AppCard variant="stat">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="type-description">Alertes stock bas</CardTitle>
                        <div
                            className={cn(
                                'p-2 rounded-lg',
                                productsInAlert > 0
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
                                productsInAlert > 0 ? 'text-warning' : 'text-foreground',
                            )}
                        >
                            {productsInAlert}
                        </div>
                        <p className="mt-1 type-caption text-muted-foreground">
                            {productsInAlert > 0
                                ? `produit${productsInAlert > 1 ? 's' : ''} sous le seuil`
                                : 'Tous les stocks OK'}
                        </p>
                    </CardContent>
                </AppCard>

                {/* Mouvements sur la période avec trend N-1 */}
                <AppCard variant="stat">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="type-description">Mouvements</CardTitle>
                        <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                            <TrendingDown className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalMovements}</div>
                        <div className="mt-1 flex items-center gap-1 type-caption">
                            {movementsChange === 0 ? (
                                <span className="flex items-center gap-0.5 text-muted-foreground">
                                    <Minus className="h-3 w-3" />
                                    Aucune variation
                                </span>
                            ) : (
                                <span className={cn(
                                    'flex items-center gap-0.5 font-medium',
                                    movementsUp ? 'text-info' : 'text-muted-foreground',
                                )}>
                                    {movementsUp ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                                    {movementsUp ? '+' : ''}{movementsChange}%
                                </span>
                            )}
                            <span className="text-muted-foreground">vs période préc.</span>
                        </div>
                    </CardContent>
                </AppCard>
            </div>

            {/* Graphiques mouvements & rotation */}
            <div className="grid gap-6 md:grid-cols-2">
                <StockMovementTypeChart data={movementsByType} />
                <StockRotationChart data={topRotation} />
            </div>

            {/* Tableau des alertes + exports CSV */}
            <div className="grid gap-6 md:grid-cols-2">
                {hasProblems && <StockAlertsTable alerts={alerts} />}
                <div className={cn('flex gap-2', hasProblems ? 'items-start justify-end' : 'justify-start')}>
                    {topRotation.length > 0 && (
                        <CsvExportButton
                            rows={buildRotationCsv(topRotation)}
                            filename="rotation-stocks.csv"
                            label="Rotation CSV"
                        />
                    )}
                    {alerts.length > 0 && (
                        <CsvExportButton
                            rows={buildAlertsCsv(alerts)}
                            filename="alertes-stocks.csv"
                            label="Alertes CSV"
                        />
                    )}
                </div>
            </div>
        </div>
    )
}
