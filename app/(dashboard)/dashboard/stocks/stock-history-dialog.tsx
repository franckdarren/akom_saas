// app/(dashboard)/dashboard/stocks/stock-history-dialog.tsx
'use client'

import { useEffect, useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Loader2, TrendingUp, TrendingDown, RefreshCw, ShoppingCart } from 'lucide-react'
import { getProductStockHistory } from '@/lib/actions/stock'
import { formatNumber } from '@/lib/utils/slug'
import { formatDate } from '@/lib/utils/format'

type Stock = {
    product: {
        id: string
        name: string
    }
}

type StockMovement = {
    id: string
    type: string
    quantity: number
    previousQty: number
    newQty: number
    reason: string | null
    createdAt: Date
}

export function StockHistoryDialog({
    product,
    open,
    onOpenChange,
}: {
    product: Stock
    open: boolean
    onOpenChange: (open: boolean) => void
}) {
    const [movements, setMovements] = useState<StockMovement[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (open) {
            loadHistory()
        }
    }, [open, product.product.id])

    async function loadHistory() {
        setIsLoading(true)
        setError(null)

        const result = await getProductStockHistory(product.product.id)

        if (result.error) {
            setError(result.error)
        } else {
            setMovements(result.movements || [])
        }

        setIsLoading(false)
    }

    const getMovementIcon = (type: string) => {
        switch (type) {
            case 'manual_in':
                return <TrendingUp className="h-4 w-4 text-green-500" />
            case 'manual_out':
                return <TrendingDown className="h-4 w-4 text-red-500" />
            case 'adjustment':
                return <RefreshCw className="h-4 w-4 text-blue-500" />
            case 'order_out':
                return <ShoppingCart className="h-4 w-4 text-orange-500" />
            default:
                return null
        }
    }

    const getMovementLabel = (type: string) => {
        switch (type) {
            case 'manual_in':
                return 'Entrée'
            case 'manual_out':
                return 'Sortie'
            case 'adjustment':
                return 'Ajustement'
            case 'order_out':
                return 'Commande'
            default:
                return type
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh]">
                <DialogHeader>
                    <DialogTitle>Historique des mouvements</DialogTitle>
                    <DialogDescription>{product.product.name}</DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto">
                    {isLoading && (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {!isLoading && !error && movements.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                            Aucun mouvement pour ce produit
                        </div>
                    )}

                    {!isLoading && !error && movements.length > 0 && (
                        <div className="space-y-3">
                            {movements.map((movement) => (
                                <div
                                    key={movement.id}
                                    className="border rounded-lg p-4 space-y-2"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            {getMovementIcon(movement.type)}
                                            <Badge variant="outline">
                                                {getMovementLabel(movement.type)}
                                            </Badge>
                                        </div>
                                        <span className="text-sm text-muted-foreground">
                                            {formatDate(new Date(movement.createdAt))}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="text-muted-foreground">
                                            {formatNumber(movement.previousQty)}
                                        </span>
                                        <span>→</span>
                                        <span className="font-semibold">
                                            {formatNumber(movement.newQty)}
                                        </span>
                                        <span
                                            className={
                                                movement.quantity > 0
                                                    ? 'text-green-600'
                                                    : 'text-red-600'
                                            }
                                        >
                                            ({movement.quantity > 0 ? '+' : ''}
                                            {formatNumber(movement.quantity)})
                                        </span>
                                    </div>

                                    {movement.reason && (
                                        <p className="text-sm text-muted-foreground italic">
                                            {movement.reason}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}