// components/stocks/MarginPreview.tsx
'use client'

import {AlertTriangle} from 'lucide-react'
import {formatPrice} from '@/lib/utils/format'
import {computeMargin, getMarginLevel} from '@/lib/stock/costing'
import {MarginBadge} from './MarginBadge'

// ============================================================
// Apercu de marge sous les champs de prix
// ------------------------------------------------------------
// Se met a jour a chaque frappe. Reste discret quand la marge est saine et
// se fait explicite quand l'utilisateur est sur le point de vendre a perte :
// c'est le moment ou l'information a de la valeur.
// ============================================================

export function MarginPreview({
    sellingPrice,
    purchasePrice,
}: {
    sellingPrice: number | null
    purchasePrice: number | null
}) {
    const margin = computeMargin(sellingPrice, purchasePrice)

    if (!margin) {
        return (
            <p className="type-caption text-muted-foreground">
                Saisissez les deux prix pour voir la marge.
            </p>
        )
    }

    const level = getMarginLevel(margin.rate)

    return (
        <div className="rounded-lg bg-muted/50 p-3 space-y-2">
            <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">Marge unitaire</span>
                <div className="layout-inline">
                    <span className="font-semibold">{formatPrice(margin.amount)}</span>
                    <MarginBadge sellingPrice={sellingPrice} costPrice={purchasePrice}/>
                </div>
            </div>

            {level === 'negative' && (
                <p className="layout-inline text-xs text-destructive">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0"/>
                    Vous vendez à perte : le prix de vente est inférieur au prix d&apos;achat.
                </p>
            )}
            {level === 'low' && (
                <p className="text-xs text-warning">
                    Marge faible — vérifiez que vos frais sont bien couverts.
                </p>
            )}
        </div>
    )
}
