// app/(dashboard)/dashboard/stocks/stocks-list.tsx
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { History } from 'lucide-react'
import { AdjustStockDialog } from './adjust-stock-dialog'
import { StockHistoryDialog } from './stock-history-dialog'
import { formatNumber } from '@/lib/utils/slug'

type Stock = {
    id: string
    quantity: number
    alertThreshold: number
    product: {
        id: string
        name: string
        isAvailable: boolean
        category: { name: string } | null
    }
}

export function StocksList({ stocks }: { stocks: Stock[] }) {
    const [selectedProduct, setSelectedProduct] = useState<Stock | null>(null)
    const [showHistory, setShowHistory] = useState(false)

    if (stocks.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                    <p className="text-muted-foreground text-center">
                        Aucun produit pour le moment.
                        <br />
                        Créez des produits pour gérer leur stock.
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {stocks.map((stock) => {
                    const isLowStock = stock.quantity <= stock.alertThreshold && stock.quantity > 0
                    const isOutOfStock = stock.quantity === 0

                    return (
                        <Card key={stock.id}>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1 flex-1">
                                        <CardTitle className="text-base">{stock.product.name}</CardTitle>
                                        {stock.product.category && (
                                            <p className="text-sm text-muted-foreground">
                                                {stock.product.category.name}
                                            </p>
                                        )}
                                    </div>
                                    <Badge
                                        variant={
                                            isOutOfStock
                                                ? 'destructive'
                                                : isLowStock
                                                    ? 'secondary'
                                                    : 'default'
                                        }
                                    >
                                        {stock.product.isAvailable ? 'Dispo' : 'Indispo'}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Quantité actuelle */}
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Quantité</span>
                                    <span
                                        className={`text-2xl font-bold ${isOutOfStock
                                            ? 'text-red-500'
                                            : isLowStock
                                                ? 'text-orange-500'
                                                : ''
                                            }`}
                                    >
                                        {formatNumber(stock.quantity)}
                                    </span>
                                </div>

                                {/* Seuil d'alerte */}
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Seuil d'alerte</span>
                                    <span>{formatNumber(stock.alertThreshold)}</span>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <AdjustStockDialog
                                        stock={stock}
                                        onSuccess={() => {
                                            // Le refresh se fait dans l'action
                                        }}
                                    >
                                        <Button size="sm" className="flex-1">
                                            Ajuster
                                        </Button>
                                    </AdjustStockDialog>

                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                            setSelectedProduct(stock)
                                            setShowHistory(true)
                                        }}
                                    >
                                        <History className="h-4 w-4" />
                                    </Button>
                                </div>

                                {/* Message d'alerte */}
                                {isLowStock && (
                                    <p className="text-xs text-orange-500">
                                        ⚠️ Stock faible - Réapprovisionnement recommandé
                                    </p>
                                )}
                                {isOutOfStock && (
                                    <p className="text-xs text-red-500">
                                        🔴 Rupture de stock - Produit indisponible
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* Dialog d'historique */}
            {selectedProduct && (
                <StockHistoryDialog
                    product={selectedProduct}
                    open={showHistory}
                    onOpenChange={setShowHistory}
                />
            )}
        </>
    )
}