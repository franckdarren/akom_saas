'use client'

// components/dashboard/stats/TopCustomersTable.tsx

import { AppCard, CardContent, CardHeader, CardTitle } from '@/components/ui/app-card'
import { Badge } from '@/components/ui/badge'
import { formatPrice } from '@/lib/utils/format'
import type { CustomerStat } from '@/types/stats'

interface TopCustomersTableProps {
    customers: CustomerStat[]
}

export function TopCustomersTable({ customers }: TopCustomersTableProps) {
    return (
        <AppCard>
            <CardHeader>
                <CardTitle className="type-card-title">Top clients</CardTitle>
            </CardHeader>
            <CardContent>
                {customers.length === 0 ? (
                    <div className="layout-empty-state">
                        <p className="type-body-muted">Aucun client identifié sur la période</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="pb-2 text-left type-table-head">Client</th>
                                    <th className="pb-2 text-center type-table-head">Commandes</th>
                                    <th className="pb-2 text-right type-table-head">CA total</th>
                                    <th className="pb-2 text-right type-table-head">Statut</th>
                                </tr>
                            </thead>
                            <tbody>
                                {customers.map((c, idx) => (
                                    <tr key={c.phone ?? idx} className="border-b last:border-0">
                                        <td className="py-2 pr-4">
                                            <div className="type-body font-medium truncate max-w-[160px]">
                                                {c.name ?? c.phone ?? 'Anonyme'}
                                            </div>
                                            {c.name && c.phone && (
                                                <div className="type-caption text-muted-foreground">
                                                    {c.phone}
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-2 text-center type-body">
                                            {c.ordersCount}
                                        </td>
                                        <td className="py-2 text-right type-body font-medium">
                                            {formatPrice(c.totalRevenue)}
                                        </td>
                                        <td className="py-2 text-right">
                                            {c.isReturning ? (
                                                <Badge variant="outline" className="text-success border-success/40 bg-success-subtle">
                                                    Récurrent
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-info border-info/40 bg-info-subtle">
                                                    Nouveau
                                                </Badge>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </CardContent>
        </AppCard>
    )
}
