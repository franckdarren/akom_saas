// components/dashboard/stats/CategoryRevenueTable.tsx
'use client'

import { AppCard, CardContent, CardHeader, CardTitle } from '@/components/ui/app-card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { formatPrice } from '@/lib/utils/format'
import type { CategorySales } from '@/types/stats'

interface CategoryRevenueTableProps {
    data: CategorySales[]
}

const CHART_COLORS = Array.from({ length: 5 }, (_, i) => `var(--chart-${i + 1})`)

export function CategoryRevenueTable({ data }: CategoryRevenueTableProps) {
    return (
        <AppCard>
            <CardHeader>
                <CardTitle className="type-card-title">
                    CA par catégorie
                </CardTitle>
            </CardHeader>
            <CardContent>
                {data.length === 0 ? (
                    <div className="layout-empty-state">
                        <p className="type-body-muted">Aucune vente sur la période</p>
                    </div>
                ) : (
                    <div className="layout-card-body">
                        {data.map((cat, index) => (
                            <div key={cat.categoryId ?? 'uncategorized'}>
                                {index > 0 && <Separator className="mb-4" />}

                                <div className="space-y-2">
                                    {/* Ligne 1 : nom + montant */}
                                    <div className="layout-inline justify-between">
                                        <div className="layout-inline">
                                            <div
                                                className="h-2.5 w-2.5 shrink-0 rounded-sm"
                                                style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                                            />
                                            <span className="type-body font-medium">
                                                {cat.categoryName}
                                            </span>
                                        </div>
                                        <span className="type-body font-semibold tabular-nums">
                                            {formatPrice(cat.revenue)}
                                        </span>
                                    </div>

                                    {/* Ligne 2 : top produit + badge commandes */}
                                    <div className="layout-inline justify-between pl-[18px]">
                                        <span className="type-caption truncate max-w-[60%]">
                                            {cat.topProduct
                                                ? `Top : ${cat.topProduct}`
                                                : '—'
                                            }
                                        </span>
                                        <Badge variant="secondary" className="type-caption shrink-0">
                                            {cat.ordersCount} cmd
                                        </Badge>
                                    </div>

                                    {/* Ligne 3 : barre de progression + % */}
                                    <div className="layout-inline gap-3 pl-[18px]">
                                        <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                                            <div
                                                className="h-full rounded-full transition-all"
                                                style={{
                                                    width: `${cat.percentage}%`,
                                                    backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                                                }}
                                            />
                                        </div>
                                        <span className="type-caption w-8 shrink-0 text-right tabular-nums">
                                            {cat.percentage}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </AppCard>
    )
}
