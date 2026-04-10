// components/dashboard/stats/StockAlertsTable.tsx
// Pas de Recharts — serveur-compatible

import { AppCard, CardContent, CardHeader, CardTitle } from '@/components/ui/app-card'
import { AlertTriangle, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { StockAlert } from '@/types/stats'

interface StockAlertsTableProps {
    alerts: StockAlert[]
}

export function StockAlertsTable({ alerts }: StockAlertsTableProps) {
    const hasAlerts = alerts.length > 0

    return (
        <AppCard>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="type-card-title">Ruptures & alertes de stock</CardTitle>
                {!hasAlerts && (
                    <div className="flex items-center gap-1.5 text-success">
                        <CheckCircle className="h-4 w-4" />
                        <span className="type-caption font-medium">Tout OK</span>
                    </div>
                )}
            </CardHeader>
            <CardContent>
                {!hasAlerts ? (
                    <div className="layout-empty-state">
                        <p className="type-body-muted">Aucun produit en rupture ou en alerte</p>
                    </div>
                ) : (
                    <div className="layout-card-body">
                        {/* En-tête */}
                        <div className="grid grid-cols-[1fr_auto_auto] gap-4 pb-2 border-b">
                            <span className="type-table-head">Produit</span>
                            <span className="type-table-head text-center">Seuil</span>
                            <span className="type-table-head text-right">Stock</span>
                        </div>
                        {alerts.map((alert) => {
                            const isOutOfStock = alert.currentQuantity === 0
                            return (
                                <div
                                    key={alert.productId}
                                    className="grid grid-cols-[1fr_auto_auto] gap-4 py-2 border-b last:border-0 items-center"
                                >
                                    <div className="min-w-0">
                                        <p className="type-body font-medium truncate">
                                            {alert.productName}
                                        </p>
                                        {alert.categoryName && (
                                            <p className="type-caption text-muted-foreground">
                                                {alert.categoryName}
                                            </p>
                                        )}
                                    </div>
                                    <span className="type-caption text-muted-foreground text-center">
                                        {alert.alertThreshold}
                                    </span>
                                    <span
                                        className={cn(
                                            'type-body font-semibold text-right',
                                            isOutOfStock ? 'text-destructive' : 'text-warning',
                                        )}
                                    >
                                        {isOutOfStock ? (
                                            <span className="flex items-center justify-end gap-1">
                                                <AlertTriangle className="h-3 w-3" />
                                                0
                                            </span>
                                        ) : (
                                            alert.currentQuantity
                                        )}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                )}
            </CardContent>
        </AppCard>
    )
}
