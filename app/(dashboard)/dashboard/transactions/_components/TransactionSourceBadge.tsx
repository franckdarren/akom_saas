// app/(dashboard)/dashboard/transactions/_components/TransactionSourceBadge.tsx
import {cn} from '@/lib/utils'
import {SOURCE_BADGE_CLASSES, SOURCE_LABELS} from '@/lib/transactions/constants'
import type {TransactionSource} from '@/types/transaction'

interface TransactionSourceBadgeProps {
    source: TransactionSource
    className?: string
}

export function TransactionSourceBadge({source, className}: TransactionSourceBadgeProps) {
    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full px-2 py-0.5 type-badge',
                SOURCE_BADGE_CLASSES[source],
                className,
            )}
        >
            {SOURCE_LABELS[source]}
        </span>
    )
}
