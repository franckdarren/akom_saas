// app/(dashboard)/dashboard/stocks/stocks-list.tsx
'use client'

import {useState} from 'react'
import {AppCard, CardContent, CardHeader, CardTitle} from '@/components/ui/app-card'
import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {EmptyState} from '@/components/ui/empty-state'
import {Tabs, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {History, Package, Boxes, Coins} from 'lucide-react'
import {AdjustStockDialog} from './adjust-stock-dialog'
import {StockHistoryDialog} from './stock-history-dialog'
import {AlertThresholdEditor} from './alert-threshold-editor'
import {MarginBadge} from '@/components/stocks/MarginBadge'
import {formatNumber, formatPrice} from '@/lib/utils/format'
import {computeStockValue, type StockValuation} from '@/lib/stock/costing'

type Stock = {
    id: string
    quantity: number
    alertThreshold: number
    avgCost: number | null
    lastPurchasePrice: number | null
    product: {
        id: string
        name: string
        isAvailable: boolean
        price: number | null
        purchasePrice: number | null
        category: { name: string } | null
    }
}

type ViewMode = 'quantity' | 'value'

export function StocksList({
                               stocks,
                               valuation,
                           }: {
    stocks: Stock[]
    valuation: StockValuation
}) {
    const [selectedProduct, setSelectedProduct] = useState<Stock | null>(null)
    const [showHistory, setShowHistory] = useState(false)
    const [view, setView] = useState<ViewMode>('quantity')

    if (stocks.length === 0) {
        return (
            <AppCard>
                <CardContent>
                    <EmptyState
                        icon={Package}
                        title="Aucun produit pour le moment"
                        description="Créez des produits pour gérer leur stock."
                    />
                </CardContent>
            </AppCard>
        )
    }

    // Les KPI n'ont de sens qu'une fois au moins un article valorisé : avant ça
    // ils afficheraient des zéros qui ressemblent à un bug.
    const hasValuation = valuation.totalValue > 0 || valuation.negativeMarginCount > 0

    return (
        <>
            {hasValuation && (
                <div className="layout-kpi-grid">
                    <AppCard variant="stat">
                        <CardContent className="layout-card-body">
                            <p className="type-label-meta text-muted-foreground">Valeur du stock</p>
                            <p className="text-2xl font-bold">{formatPrice(valuation.totalValue)}</p>
                        </CardContent>
                    </AppCard>

                    <AppCard variant="stat">
                        <CardContent className="layout-card-body">
                            <p className="type-label-meta text-muted-foreground">CA potentiel</p>
                            <p className="text-2xl font-bold">{formatPrice(valuation.potentialRevenue)}</p>
                        </CardContent>
                    </AppCard>

                    <AppCard variant="stat">
                        <CardContent className="layout-card-body">
                            <p className="type-label-meta text-muted-foreground">Marge moyenne</p>
                            <p className="text-2xl font-bold">
                                {valuation.averageMarginRate !== null
                                    ? `${valuation.averageMarginRate.toFixed(0)} %`
                                    : '—'}
                            </p>
                        </CardContent>
                    </AppCard>

                    <AppCard variant="stat">
                        <CardContent className="layout-card-body">
                            <p className="type-label-meta text-muted-foreground">Vendus à perte</p>
                            <p
                                className={
                                    'text-2xl font-bold ' +
                                    (valuation.negativeMarginCount > 0 ? 'text-destructive' : '')
                                }
                            >
                                {formatNumber(valuation.negativeMarginCount)}
                            </p>
                        </CardContent>
                    </AppCard>
                </div>
            )}

            <div className="flex items-center justify-between gap-4">
                <Tabs value={view} onValueChange={(v) => setView(v as ViewMode)}>
                    <TabsList>
                        <TabsTrigger value="quantity">
                            <Boxes className="h-4 w-4"/>
                            Quantités
                        </TabsTrigger>
                        <TabsTrigger value="value">
                            <Coins className="h-4 w-4"/>
                            Valeur
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                {view === 'value' && valuation.unvaluedCount > 0 && (
                    <p className="type-caption text-muted-foreground">
                        {formatNumber(valuation.unvaluedCount)} article
                        {valuation.unvaluedCount > 1 ? 's' : ''} sans coût de revient
                    </p>
                )}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {stocks.map((stock) => {
                    const isLowStock = stock.quantity <= stock.alertThreshold && stock.quantity > 0
                    const isOutOfStock = stock.quantity === 0
                    const stockValue = computeStockValue(stock.quantity, stock.avgCost)

                    return (
                        <AppCard key={stock.id} className="hover:border-primary/50 hover:shadow-md">
                            <CardHeader>
                                <div className="flex items-start justify-between gap-2">
                                    <div className="space-y-1 flex-1">
                                        <CardTitle className="text-base">{stock.product.name}</CardTitle>
                                        {stock.product.category && (
                                            <p className="text-sm text-muted-foreground">
                                                {stock.product.category.name}
                                            </p>
                                        )}
                                    </div>
                                    {view === 'value' ? (
                                        <MarginBadge
                                            sellingPrice={stock.product.price}
                                            costPrice={stock.avgCost}
                                        />
                                    ) : (
                                        <Badge variant={isOutOfStock ? 'destructive' : 'success'}>
                                            {stock.product.isAvailable ? 'Disponible' : 'Indisponible'}
                                        </Badge>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="layout-card-body">
                                {view === 'quantity' ? (
                                    <>
                                        {/* Quantité actuelle */}
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-muted-foreground">Quantité</span>
                                            <span
                                                className={`text-2xl font-bold ${
                                                    isOutOfStock
                                                        ? 'text-destructive animate-ping'
                                                        : isLowStock
                                                            ? 'text-warning animate-ping'
                                                            : ''
                                                }`}
                                            >
                                                {formatNumber(stock.quantity)}
                                            </span>
                                        </div>

                                        {/* Seuil d'alerte */}
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Seuil d&apos;alerte</span>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">
                                                    {formatNumber(stock.alertThreshold)}
                                                </span>
                                                <AlertThresholdEditor
                                                    productId={stock.product.id}
                                                    productName={stock.product.name}
                                                    currentThreshold={stock.alertThreshold}
                                                />
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        {/* Valeur immobilisée */}
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-muted-foreground">Valeur en stock</span>
                                            <span className="text-2xl font-bold">
                                                {stock.avgCost !== null ? formatPrice(stockValue) : '—'}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Coût de revient</span>
                                            <span className="font-medium">
                                                {stock.avgCost !== null ? formatPrice(stock.avgCost) : '—'}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Prix de vente</span>
                                            <span className="font-medium">
                                                {stock.product.price !== null
                                                    ? formatPrice(stock.product.price)
                                                    : 'Sur devis'}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Quantité</span>
                                            <span className="font-medium">{formatNumber(stock.quantity)}</span>
                                        </div>
                                    </>
                                )}

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <AdjustStockDialog stock={stock}>
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
                                        <History className="h-4 w-4"/>
                                    </Button>
                                </div>

                                {/* Messages d'alerte */}
                                {view === 'value' && stock.avgCost === null && (
                                    <p className="type-caption text-muted-foreground">
                                        Saisissez un prix d&apos;achat lors de la prochaine entrée pour calculer
                                        le coût de revient.
                                    </p>
                                )}
                                {view === 'quantity' && isLowStock && (
                                    <p className="text-xs text-warning animate-pulse">
                                        ⚠️ Stock faible - Réapprovisionnement recommandé
                                    </p>
                                )}
                                {view === 'quantity' && isOutOfStock && (
                                    <p className="text-xs text-destructive animate-pulse">
                                        🔴 Rupture de stock - Produit indisponible
                                    </p>
                                )}
                            </CardContent>
                        </AppCard>
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
