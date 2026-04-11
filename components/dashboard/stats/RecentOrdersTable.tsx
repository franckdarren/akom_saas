// components/dashboard/stats/RecentOrdersTable.tsx
'use client'

import { AppCard, CardContent, CardHeader, CardTitle } from '@/components/ui/app-card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import type { RecentOrder } from '@/types/stats'
import { formatPrice, formatDate } from '@/lib/utils/format'
import { useActivityLabels } from '@/lib/hooks/use-activity-labels'
import type { OrderStatusKey } from '@/lib/config/activity-labels'

interface RecentOrdersTableProps {
    data: RecentOrder[]
}

const STATUS_VARIANTS: Record<string, 'secondary' | 'default' | 'success' | 'destructive'> = {
    awaiting_payment: 'secondary',
    pending: 'default',
    preparing: 'default',
    ready: 'success',
    delivered: 'success',
    cancelled: 'destructive',
}

export function RecentOrdersTable({ data }: RecentOrdersTableProps) {
    const labels = useActivityLabels()
    const s = labels.orderStatuses
    return (
        <AppCard>
            <CardHeader>
                <CardTitle className="text-base font-semibold">
                    Commandes récentes
                </CardTitle>
            </CardHeader>
            <CardContent>
                {data.length === 0 ? (
                    <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                        Aucune commande trouvée
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>N°</TableHead>
                                <TableHead className="hidden sm:table-cell">Table</TableHead>
                                <TableHead className="hidden sm:table-cell">Client</TableHead>
                                <TableHead className="hidden lg:table-cell">Articles</TableHead>
                                <TableHead>Montant</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead className="hidden lg:table-cell text-right">Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((order) => (
                                <TableRow key={order.id}>
                                    <TableCell className="font-medium">
                                        {order.orderNumber || '-'}
                                    </TableCell>
                                    <TableCell className="hidden sm:table-cell">
                                        {order.tableNumber ? `Table ${order.tableNumber}` : '-'}
                                    </TableCell>
                                    <TableCell className="hidden sm:table-cell max-w-[150px] truncate">
                                        {order.customerName || '-'}
                                    </TableCell>
                                    <TableCell className="hidden lg:table-cell">{order.itemsCount}</TableCell>
                                    <TableCell className="font-medium">
                                        {formatPrice(order.totalAmount)}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={STATUS_VARIANTS[order.status] ?? 'default'}>
                                            {s[order.status as OrderStatusKey].label}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="hidden lg:table-cell text-right text-xs text-muted-foreground">
                                        {formatDate(order.createdAt)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </AppCard>
    )
}