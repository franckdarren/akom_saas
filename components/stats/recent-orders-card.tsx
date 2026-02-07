'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatPrice } from '@/lib/utils/format'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { RecentOrder } from '@/types/stats'

interface RecentOrdersCardProps {
    data: RecentOrder[]
}

const STATUS_CONFIG = {
    pending: { color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200', label: 'En attente' },
    preparing: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', label: 'En préparation' },
    ready: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', label: 'Prête' },
    delivered: { color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200', label: 'Livrée' },
    cancelled: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', label: 'Annulée' },
}

export function RecentOrdersCard({ data }: RecentOrdersCardProps) {
    if (data.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Commandes récentes</CardTitle>
                    <CardDescription>Aucune commande enregistrée</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground text-center py-8">
                        Les nouvelles commandes apparaîtront ici
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Commandes récentes</CardTitle>
                <CardDescription>Dernières commandes enregistrées</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {data.map((order) => (
                        <div
                            key={order.id}
                            className="flex items-center justify-between p-3 rounded-lg border bg-muted/50 hover:bg-muted transition-colors"
                        >
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <p className="text-sm font-semibold">
                                        {order.orderNumber || `#${order.id.slice(0, 8)}`}
                                    </p>
                                    {order.tableNumber && (
                                        <Badge variant="outline" className="text-xs">
                                            Table {order.tableNumber}
                                        </Badge>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span>{order.itemsCount} produit(s)</span>
                                    <span>•</span>
                                    <span>
                                        {formatDistanceToNow(new Date(order.createdAt), {
                                            addSuffix: true,
                                            locale: fr,
                                        })}
                                    </span>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <p className="text-sm font-bold">{formatPrice(order.totalAmount)}</p>
                                <Badge
                                    variant="secondary"
                                    className={STATUS_CONFIG[order.status].color}
                                >
                                    {STATUS_CONFIG[order.status].label}
                                </Badge>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}