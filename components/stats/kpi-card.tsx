'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowDown, ArrowUp, TrendingUp } from 'lucide-react'
import { formatPrice } from '@/lib/utils/format'

interface KpiCardProps {
    title: string
    value: string | number
    description?: string
    trend?: {
        value: number
        isPositive: boolean
    }
    icon?: React.ReactNode
    format?: 'currency' | 'number' | 'text'
}

export function KpiCard({ title, value, description, trend, icon, format = 'text' }: KpiCardProps) {
    // Formater la valeur selon le type
    const formattedValue =
        format === 'currency'
            ? formatPrice(Number(value))
            : format === 'number'
                ? Number(value).toLocaleString('fr-FR')
                : value

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{formattedValue}</div>
                {trend && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        {trend.isPositive ? (
                            <ArrowUp className="h-3 w-3 text-green-500" />
                        ) : (
                            <ArrowDown className="h-3 w-3 text-red-500" />
                        )}
                        <span className={trend.isPositive ? 'text-green-500' : 'text-red-500'}>
                            {Math.abs(trend.value).toFixed(1)}%
                        </span>
                        <span>vs période précédente</span>
                    </div>
                )}
                {description && !trend && (
                    <p className="text-xs text-muted-foreground mt-1">{description}</p>
                )}
            </CardContent>
        </Card>
    )
}