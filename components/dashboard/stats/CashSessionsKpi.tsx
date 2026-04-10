// components/dashboard/stats/CashSessionsKpi.tsx

import { AppCard, CardContent, CardHeader, CardTitle } from '@/components/ui/app-card'
import { AlertTriangle, Landmark } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CashSessionsKpiProps {
    sessionsCount: number
    sessionsWithGap: number
}

export function CashSessionsKpi({ sessionsCount, sessionsWithGap }: CashSessionsKpiProps) {
    const hasGaps = sessionsWithGap > 0

    return (
        <AppCard variant="stat">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="type-description">Sessions de caisse</CardTitle>
                <div className={cn(
                    'p-2 rounded-lg',
                    hasGaps
                        ? 'bg-warning-subtle text-warning'
                        : 'bg-success-subtle text-success',
                )}>
                    <Landmark className="h-4 w-4" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{sessionsCount}</div>
                <div className="mt-2 flex items-center gap-1.5 text-xs">
                    {hasGaps ? (
                        <>
                            <AlertTriangle className="h-3 w-3 text-warning shrink-0" />
                            <span className="text-warning font-medium">
                                {sessionsWithGap} écart{sessionsWithGap > 1 ? 's' : ''} détecté{sessionsWithGap > 1 ? 's' : ''}
                            </span>
                        </>
                    ) : (
                        <span className="text-muted-foreground">Aucun écart de caisse</span>
                    )}
                </div>
            </CardContent>
        </AppCard>
    )
}
