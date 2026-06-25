'use client'

import { AppCard, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/app-card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle } from 'lucide-react'
import type { StockAlert } from '@/types/stats'

interface StockAlertsCardProps {
    data: StockAlert[]
}

export function StockAlertsCard({ data }: StockAlertsCardProps) {
    if (data.length === 0) {
        return (
            <AppCard>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-muted-foreground" />
                        Alertes stock
                    </CardTitle>
                    <CardDescription>Aucun produit en rupture ou stock faible</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground text-center py-8">
                        ✅ Tous les stocks sont à niveau
                    </p>
                </CardContent>
            </AppCard>
        )
    }

    return (
        <AppCard className="border-warning">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-warning">
                    <AlertTriangle className="h-5 w-5" />
                    Alertes stock
                </CardTitle>
                <CardDescription>
                    {data.length} produit(s) nécessitent votre attention
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {data.map((alert) => {
                        const isOutOfStock = alert.currentQuantity === 0
                        const isCritical = alert.currentQuantity > 0 && alert.currentQuantity <= alert.alertThreshold / 2

                        return (
                            <div
                                key={alert.productId}
                                className="flex items-center justify-between p-3 rounded-lg border bg-muted/50"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-medium">{alert.productName}</p>
                                        {alert.categoryName && (
                                            <Badge variant="outline" className="text-xs">
                                                {alert.categoryName}
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Seuil d'alerte : {alert.alertThreshold} unité(s)
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p
                                        className={`text-lg font-bold ${isOutOfStock
                                            ? 'text-destructive'
                                            : isCritical
                                                ? 'text-warning'
                                                : 'text-warning'
                                            }`}
                                    >
                                        {alert.currentQuantity}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {isOutOfStock ? 'Rupture' : isCritical ? 'Critique' : 'Faible'}
                                    </p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </AppCard>
    )
}