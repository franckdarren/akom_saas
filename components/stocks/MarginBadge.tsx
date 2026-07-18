// components/stocks/MarginBadge.tsx
'use client'

import {TrendingDown, TrendingUp, AlertTriangle} from 'lucide-react'
import {cn} from '@/lib/utils'
import {formatPrice} from '@/lib/utils/format'
import {computeMargin, getMarginLevel} from '@/lib/stock/costing'

// ============================================================
// Badge de marge
// ------------------------------------------------------------
// Affiche le taux de marge et, optionnellement, le montant unitaire.
// La couleur porte l'information : rouge = vente a perte, ambre = marge
// faible, vert = marge saine. Rend `null` si la marge est incalculable —
// on n'affiche jamais une marge devinee.
// ============================================================

const LEVEL_STYLES = {
    negative: 'bg-destructive-subtle text-destructive border-destructive/20',
    low: 'bg-warning-subtle text-warning border-warning/20',
    healthy: 'bg-success-subtle text-success border-success/20',
} as const

const LEVEL_ICONS = {
    negative: AlertTriangle,
    low: TrendingDown,
    healthy: TrendingUp,
} as const

export function MarginBadge({
    sellingPrice,
    costPrice,
    showAmount = false,
    className,
}: {
    sellingPrice: number | null
    costPrice: number | null
    showAmount?: boolean
    className?: string
}) {
    const margin = computeMargin(sellingPrice, costPrice)
    if (!margin) return null

    const level = getMarginLevel(margin.rate)
    const Icon = LEVEL_ICONS[level]

    return (
        <span
            className={cn(
                'inline-flex w-fit items-center gap-1 rounded-full border px-2 py-0.5 type-badge',
                LEVEL_STYLES[level],
                className
            )}
        >
            <Icon className="h-3 w-3 shrink-0"/>
            {margin.rate.toFixed(0)}&nbsp;%
            {showAmount && <span className="opacity-80">({formatPrice(margin.amount)})</span>}
        </span>
    )
}
