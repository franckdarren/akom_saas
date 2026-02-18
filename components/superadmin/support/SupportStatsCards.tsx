'use client'

import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
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
        <div className="grid gap-4 md:grid-cols-4">

            {/* Total */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        Total
                    </CardTitle>
                    <MessageSquare className="h-4 w-4 text-muted-foreground"/>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.total}</div>
                </CardContent>
            </Card>

            {/* Ouverts */}
            <Card>
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
            </Card>

            {/* En cours */}
            <Card>
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
            </Card>

            {/* Résolus */}
            <Card>
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
            </Card>

        </div>
    )
}
