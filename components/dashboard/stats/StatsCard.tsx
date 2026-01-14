// components/dashboard/stats/StatsCard.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowDown, ArrowUp, LucideIcon, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatsCardProps {
    title: string
    value: string | number
    icon: LucideIcon
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
    icon: Icon,
    description,
    trend,
    variant = 'default',
}: StatsCardProps) {
    const variantStyles = {
        default: 'text-blue-500 bg-blue-50 dark:bg-blue-950',
        success: 'text-green-500 bg-green-50 dark:bg-green-950',
        warning: 'text-amber-500 bg-amber-50 dark:bg-amber-950',
        danger: 'text-red-500 bg-red-50 dark:bg-red-950',
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    {title}
                </CardTitle>
                <div
                    className={cn(
                        'p-2 rounded-lg',
                        variantStyles[variant]
                    )}
                >
                    <Icon className="h-4 w-4" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>

                {/* Trend ou description */}
                <div className="mt-2 flex items-center gap-2 text-xs">
                    {trend ? (
                        <>
                            {trend.value === 0 ? (
                                <div className="flex items-center gap-1 text-zinc-500">
                                    <Minus className="h-3 w-3" />
                                    <span>Aucune variation</span>
                                </div>
                            ) : (
                                <div
                                    className={cn(
                                        'flex items-center gap-1',
                                        trend.isPositive
                                            ? 'text-green-600 dark:text-green-500'
                                            : 'text-red-600 dark:text-red-500'
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
                            <span className="text-zinc-500 dark:text-zinc-400">
                                vs période précédente
                            </span>
                        </>
                    ) : description ? (
                        <p className="text-zinc-600 dark:text-zinc-400">
                            {description}
                        </p>
                    ) : null}
                </div>
            </CardContent>
        </Card>
    )
}