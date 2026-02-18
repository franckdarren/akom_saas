'use client'

import {useEffect, useState} from 'react'
import {getQuotaStatus, type QuotaStatus} from '@/lib/services/subscription-checker'
import {useRestaurant} from '@/lib/hooks/use-restaurant'
import {Progress} from '@/components/ui/progress'
import {AlertTriangle} from 'lucide-react'
import {FEATURE_LABELS, type FeatureKey} from '@/lib/config/subscription-features'

interface QuotaDisplayProps {
    quota: Extract<'max_tables' | 'max_products' | 'max_categories' | 'max_orders_per_day', FeatureKey>
}

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
            <div className="animate-pulse space-y-2">
                <div className="h-4 bg-muted rounded w-3/4"/>
                <div className="h-2 bg-muted rounded"/>
            </div>
        )
    }

    const isUnlimited = status.limit === 'unlimited'

    // Définir la couleur de la barre selon le quota
    const progressColor = status.isAtLimit
        ? 'bg-destructive'
        : status.isNearLimit
            ? 'bg-warning'
            : 'bg-primary'

    // Définir la couleur du texte selon le quota
    const textColor = status.isAtLimit
        ? 'text-destructive-foreground'
        : status.isNearLimit
            ? 'text-warning-foreground'
            : 'text-muted-foreground'

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">{FEATURE_LABELS[quota]}</span>

                <span className={`font-mono ${textColor}`}>
          {status.used} / {isUnlimited ? '∞' : status.limit}
        </span>
            </div>

            {!isUnlimited && (
                <>
                    <Progress
                        value={status.percentage}
                        className={`h-2 rounded ${progressColor}`}
                    />

                    {status.isNearLimit && (
                        <div className="flex items-center gap-2 text-xs text-warning-foreground">
                            <AlertTriangle className="h-3 w-3"/>
                            <span>{status.isAtLimit ? 'Limite atteinte' : 'Proche de la limite'}</span>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
