// components/dashboard/stats/StatsCard.tsx
'use client'

import { AppCard, CardContent, CardHeader, CardTitle } from '@/components/ui/app-card'
import { ArrowDown, ArrowUp, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type ReactNode } from 'react'

interface StatsCardProps {
    title: string
    value: string | number
    icon: ReactNode
    description?: string
    trend?: {
        value: number // Variation en %
        isPositive: boolean
    }
    variant?: 'default' | 'success' | 'warning' | 'danger'
}

export function StatsCard({
    title,
    value,
    icon,
    description,
    trend,
    variant = 'default',
}: StatsCardProps) {
    const variantStyles = {
        default: 'text-info bg-info-subtle',
        success: 'text-success bg-success-subtle',
        warning: 'text-warning bg-warning-subtle',
        danger: 'text-destructive bg-destructive-subtle',
    }

    return (
        <AppCard variant="stat">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="type-description">
                    {title}
                </CardTitle>
                <div
                    className={cn(
                        'p-2 rounded-lg',
                        variantStyles[variant]
                    )}
                >
                    {icon}
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>

                {/* Trend ou description */}
                <div className="mt-2 flex items-center gap-2 text-xs">
                    {trend ? (
                        <>
                            {trend.value === 0 ? (
                                <div className="flex items-center gap-1 text-muted-foreground">
                                    <Minus className="h-3 w-3" />
                                    <span>Aucune variation</span>
                                </div>
                            ) : (
                                <div
                                    className={cn(
                                        'flex items-center gap-1',
                                        trend.isPositive
                                            ? 'text-success'
                                            : 'text-destructive'
                                    )}
                                >
                                    {trend.isPositive ? (
                                        <ArrowUp className="h-3 w-3" />
                                    ) : (
                                        <ArrowDown className="h-3 w-3" />
                                    )}
                                    <span className="font-medium">
                                        {Math.abs(trend.value).toFixed(1)}%
                                    </span>
                                </div>
                            )}
                            <span className="text-muted-foreground">
                                vs période précédente
                            </span>
                        </>
                    ) : description ? (
                        <p className="text-muted-foreground">
                            {description}
                        </p>
                    ) : null}
                </div>
            </CardContent>
        </AppCard>
    )
}