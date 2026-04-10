// components/dashboard/stats/NetResultCard.tsx

import { AppCard, CardContent, CardHeader, CardTitle } from '@/components/ui/app-card'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { formatPrice } from '@/lib/utils/format'
import { cn } from '@/lib/utils'
import type { FinancialPeriodStats } from '@/types/stats'

interface NetResultCardProps {
    financial: FinancialPeriodStats
}

export function NetResultCard({ financial }: NetResultCardProps) {
    const { netResult, totalRevenue, totalExpenses } = financial
    const isPositive = netResult > 0
    const isZero = netResult === 0

    return (
        <AppCard variant="stat" className={cn(
            isPositive && 'border-success',
            !isPositive && !isZero && 'border-destructive',
        )}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="type-description">Résultat net</CardTitle>
                <div className={cn(
                    'p-2 rounded-lg',
                    isZero && 'bg-muted text-muted-foreground',
                    isPositive && 'bg-success-subtle text-success',
                    !isPositive && !isZero && 'bg-destructive/10 text-destructive',
                )}>
                    {isZero
                        ? <Minus className="h-4 w-4" />
                        : isPositive
                            ? <TrendingUp className="h-4 w-4" />
                            : <TrendingDown className="h-4 w-4" />
                    }
                </div>
            </CardHeader>
            <CardContent>
                <div className={cn(
                    'text-2xl font-bold',
                    isPositive && 'text-success',
                    !isPositive && !isZero && 'text-destructive',
                )}>
                    {isPositive ? '+' : ''}{formatPrice(netResult)}
                </div>
                <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Recettes</span>
                        <span className="font-medium text-success">{formatPrice(totalRevenue)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Dépenses</span>
                        <span className="font-medium text-destructive">−{formatPrice(totalExpenses)}</span>
                    </div>
                </div>
            </CardContent>
        </AppCard>
    )
}
