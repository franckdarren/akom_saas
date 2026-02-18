// components/subscription/QuotaDisplay.tsx
'use client'

import {useEffect, useState} from 'react'
import {getQuotaStatus, type QuotaStatus} from '@/lib/services/subscription-checker'
import {useRestaurant} from '@/lib/hooks/use-restaurant'
import {Progress} from '@/components/ui/progress'
import {AlertTriangle} from 'lucide-react'
import {FEATURE_LABELS, type FeatureKey} from '@/lib/config/subscription-features'

interface QuotaDisplayProps {
    quota: Extract<FeatureKey, 'max_tables' | 'max_products' | 'max_categories' | 'max_orders_per_day'>
}

/**
 * Affiche visuellement l'utilisation d'un quota
 *
 * Utilisation :
 * <QuotaDisplay quota="max_tables" />
 */
export function QuotaDisplay({quota}: QuotaDisplayProps) {
    const {currentRestaurant} = useRestaurant()
    const [status, setStatus] = useState<QuotaStatus | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadStatus() {
            if (!currentRestaurant) return

            setLoading(true)
            const quotaStatus = await getQuotaStatus(currentRestaurant.id, quota)
            setStatus(quotaStatus)
            setLoading(false)
        }

        loadStatus()
    }, [currentRestaurant, quota])

    if (loading || !status) {
        return (
            <div className="animate-pulse">
                <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4 mb-2"/>
                <div className="h-2 bg-zinc-200 dark:bg-zinc-700 rounded"/>
            </div>
        )
    }

    const isUnlimited = status.limit === 'unlimited'

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-zinc-700 dark:text-zinc-300">
          {FEATURE_LABELS[quota]}
        </span>

                <span className={`font-mono ${
                    status.isAtLimit
                        ? 'text-red-600 dark:text-red-400'
                        : status.isNearLimit
                            ? 'text-orange-600 dark:text-orange-400'
                            : 'text-zinc-600 dark:text-zinc-400'
                }`}>
          {status.used} / {isUnlimited ? '∞' : status.limit}
        </span>
            </div>

            {!isUnlimited && (
                <>
                    <Progress
                        value={status.percentage}
                        className="h-2"
                        indicatorClassName={
                            status.isAtLimit
                                ? 'bg-red-500'
                                : status.isNearLimit
                                    ? 'bg-orange-500'
                                    : 'bg-blue-500'
                        }
                    />

                    {status.isNearLimit && (
                        <div className="flex items-center gap-2 text-xs text-orange-600 dark:text-orange-400">
                            <AlertTriangle className="h-3 w-3"/>
                            <span>
                {status.isAtLimit
                    ? 'Limite atteinte'
                    : 'Proche de la limite'
                }
              </span>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}