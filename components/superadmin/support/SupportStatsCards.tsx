// app/(dashboard)/superadmin/support/SupportStatsCards.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageSquare, AlertCircle, Clock, CheckCircle2 } from 'lucide-react'

export type SupportStats = {
    total: number
    open: number
    inProgress: number
    resolved: number
}

export default function SupportStatsCards({ stats }: { stats: SupportStats }) {
    return (
        <div className="grid gap-4 md:grid-cols-4">
            <Card>
                <CardHeader className="flex justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total</CardTitle>
                    <MessageSquare className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.total}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Ouverts</CardTitle>
                    <AlertCircle className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.open}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex justify-between pb-2">
                    <CardTitle className="text-sm font-medium">En cours</CardTitle>
                    <Clock className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.inProgress}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Résolus</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.resolved}</div>
                </CardContent>
            </Card>
        </div>
    )
}
