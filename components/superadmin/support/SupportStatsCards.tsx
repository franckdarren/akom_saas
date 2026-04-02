'use client'

import {AppCard, CardContent, CardHeader, CardTitle} from '@/components/ui/app-card'
import {
    MessageSquare,
    AlertCircle,
    Clock,
    CheckCircle2,
} from 'lucide-react'

export type SupportStats = {
    total: number
    open: number
    inProgress: number
    resolved: number
}

export default function SupportStatsCards({
                                              stats,
                                          }: {
    stats: SupportStats
}) {
    return (
        <div className="grid gap-2 sm:gap-4 grid-cols-2 lg:grid-cols-4">

            {/* Total */}
            <AppCard variant="stat">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        Total
                    </CardTitle>
                    <MessageSquare className="h-4 w-4 text-muted-foreground"/>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.total}</div>
                </CardContent>
            </AppCard>

            {/* Ouverts */}
            <AppCard variant="stat">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        Ouverts
                    </CardTitle>
                    <AlertCircle className="h-4 w-4 text-destructive"/>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-destructive">
                        {stats.open}
                    </div>
                </CardContent>
            </AppCard>

            {/* En cours */}
            <AppCard variant="stat">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        En cours
                    </CardTitle>
                    <Clock className="h-4 w-4 text-primary"/>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-primary">
                        {stats.inProgress}
                    </div>
                </CardContent>
            </AppCard>

            {/* Résolus */}
            <AppCard variant="stat">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        Résolus
                    </CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-primary"/>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-primary">
                        {stats.resolved}
                    </div>
                </CardContent>
            </AppCard>

        </div>
    )
}
