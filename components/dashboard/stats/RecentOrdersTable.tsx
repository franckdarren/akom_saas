// components/dashboard/stats/RecentOrdersTable.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

interface RecentOrdersTableProps {
    data: RecentOrder[]
}

const statusVariants = {
    pending: { label: 'En attente', variant: 'default' as const },
    preparing: { label: 'En préparation', variant: 'default' as const },
    ready: { label: 'Prête', variant: 'success' as const },
    delivered: { label: 'Livrée', variant: 'success' as const },
    cancelled: { label: 'Annulée', variant: 'destructive' as const },
}

export function RecentOrdersTable({ data }: RecentOrdersTableProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base font-semibold">
                    Commandes récentes
                </CardTitle>
            </CardHeader>
            <CardContent>
                {data.length === 0 ? (
                    <div className="flex h-32 items-center justify-center text-sm text-zinc-500">
                        Aucune commande trouvée
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>N°</TableHead>
                                <TableHead>Table</TableHead>
                                <TableHead>Client</TableHead>
                                <TableHead>Articles</TableHead>
                                <TableHead>Montant</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead className="text-right">Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((order) => (
                                <TableRow key={order.id}>
                                    <TableCell className="font-medium">
                                        {order.orderNumber || '-'}
                                    </TableCell>
                                    <TableCell>
                                        {order.tableNumber ? `Table ${order.tableNumber}` : '-'}
                                    </TableCell>
                                    <TableCell className="max-w-[150px] truncate">
                                        {order.customerName || '-'}
                                    </TableCell>
                                    <TableCell>{order.itemsCount}</TableCell>
                                    <TableCell className="font-medium">
                                        {formatPrice(order.totalAmount)}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={statusVariants[order.status].variant}>
                                            {statusVariants[order.status].label}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right text-xs text-zinc-500">
                                        {formatDate(order.createdAt)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    )
}