// components/kitchen/OrderCard.tsx
'use client'

import {useState} from 'react'
import {AppCard, CardContent, CardHeader, CardTitle} from '@/components/ui/app-card'
import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {formatDate, formatPrice} from '@/lib/utils/format'
import {Clock, CheckCircle, XCircle, ChefHat, Package, Banknote, AlertCircle, type LucideIcon} from 'lucide-react'
import {toast} from 'sonner'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {useRouter} from 'next/navigation'

type OrderStatus = 'awaiting_payment' | 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'
type PaymentMethod = 'cash' | 'mobile_money' | 'airtel_money' | 'moov_money' | 'card'

interface OrderPayment {
    id: string
    status: PaymentStatus
    method: PaymentMethod
}

interface OrderItem {
    id: string
    productName: string
    quantity: number
    unitPrice: number
}

interface Order {
    id: string
    orderNumber: string
    status: OrderStatus
    totalAmount: number
    createdAt: string
    table?: {
        number: number
    }
    orderItems: OrderItem[]
    payments: OrderPayment[]
    customerName?: string
    notes?: string
}

interface OrderCardProps {
    order: Order
}

// Mapping des statuts
const statusConfig = {
    awaiting_payment: {
        label: 'Attente paiement',
        color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
        icon: Clock,
        nextStatus: null,
        nextLabel: null,
    },
    pending: {
        label: 'En attente',
        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
        icon: Clock,
        nextStatus: 'preparing' as OrderStatus,
        nextLabel: 'Commencer',
    },
    preparing: {
        label: 'En préparation',
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        icon: ChefHat,
        nextStatus: 'ready' as OrderStatus,
        nextLabel: 'Marquer prête',
    },
    ready: {
        label: 'Prête',
        color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        icon: CheckCircle,
        nextStatus: 'delivered' as OrderStatus,
        nextLabel: 'Servie',
    },
    delivered: {
        label: 'Servie',
        color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
        icon: Package,
        nextStatus: null,
        nextLabel: null,
    },
    cancelled: {
        label: 'Annulée',
        color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        icon: XCircle,
        nextStatus: null,
        nextLabel: null,
    },
}

type PaymentBadgeInfo = {
    label: string
    className: string
    Icon: LucideIcon
} | null

function getPaymentBadge(payments: OrderPayment[], orderStatus: OrderStatus): PaymentBadgeInfo {
    // Pas de badge pour les commandes annulées ou en attente de paiement
    if (orderStatus === 'cancelled' || orderStatus === 'awaiting_payment') return null

    if (payments.some(p => p.status === 'paid')) {
        return {label: 'Payé', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', Icon: CheckCircle}
    }

    if (payments.some(p => p.status === 'pending' && p.method === 'cash')) {
        return {label: 'Cash', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', Icon: Banknote}
    }

    if (payments.some(p => p.status === 'pending')) {
        return {label: 'Paiement en cours', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200', Icon: Clock}
    }

    // Aucun paiement enregistré ou tous échoués
    return {label: 'Impayé', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', Icon: AlertCircle}
}

export function OrderCard({order}: OrderCardProps) {
    const [isUpdating, setIsUpdating] = useState(false)
    const config = statusConfig[order.status]
    const Icon = config.icon
    const paymentBadge = getPaymentBadge(order.payments ?? [], order.status)

    const router = useRouter()
    const [loading, setLoading] = useState<string | null>(null)

    const [deleteTarget, setDeleteTarget] = useState<{
        id: string
        orderNumber: string
    } | null>(null)

    // Fonction pour changer le statut
    async function handleStatusChange(newStatus: OrderStatus) {
        setIsUpdating(true)

        try {
            const res = await fetch(`/api/orders/${order.id}/status`, {
                method: 'PATCH',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({status: newStatus}),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Erreur lors de la mise à jour')
            }

            toast.success('Statut mis à jour')
            // ✅ Pas besoin de recharger : le Realtime va mettre à jour automatiquement
        } catch (error) {
            console.error('Erreur:', error)
            toast.error(error instanceof Error ? error.message : 'Erreur inconnue')
        } finally {
            setIsUpdating(false)
        }
    }

    // Fonction pour annuler
    async function handleCancel(id: string, orderNumber: string) {
        setDeleteTarget({id, orderNumber})
    }

    function handleDelete(id: string, orderNumber: string) {
        setDeleteTarget({id, orderNumber})
    }

    async function confirmCancel() {
        if (!deleteTarget) return

        setLoading(deleteTarget.id)
        const result = await handleStatusChange('cancelled')
        setLoading(null)
        setDeleteTarget(null)
        toast.success("La commande a été annulée avec succès.")
    }

    return (
        <>
            <AppCard
                className={order.status === 'pending' ? 'border-yellow-500 shadow-lg hover:border-primary/50 hover:shadow-md' : 'hover:border-primary/50 hover:shadow-md'}>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-bold">
                            {order.orderNumber}
                        </CardTitle>
                        <Badge className={config.color}>
                            <Icon className="h-3 w-3 mr-1"/>
                            {config.label}
                        </Badge>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>Table {order.table?.number || 'N/A'}</span>
                            <span>•</span>
                            <span>{formatDate(new Date(order.createdAt))}</span>
                        </div>
                        {paymentBadge && (
                            <Badge className={paymentBadge.className}>
                                <paymentBadge.Icon className="h-3 w-3 mr-1"/>
                                {paymentBadge.label}
                            </Badge>
                        )}
                    </div>
                </CardHeader>

                <CardContent className="layout-card-body">
                    {/* Liste des produits */}
                    <div className="space-y-2">
                        {order.orderItems.map((item) => (
                            <div
                                key={item.id}
                                className="flex items-center justify-between text-sm"
                            >
                                <span>
                                    <span className="font-medium">{item.quantity}x</span>{' '}
                                    {item.productName}
                                </span>
                                <span className="text-muted-foreground">
                                    {formatPrice(item.unitPrice * item.quantity)}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Notes */}
                    {order.notes && (
                        <div className="text-sm p-2 bg-muted rounded-md">
                            <span className="font-medium">Note :</span> {order.notes}
                        </div>
                    )}

                    {/* Total */}
                    <div className="pt-2 border-t flex items-center justify-between font-semibold">
                        <span>Total</span>
                        <span>{formatPrice(order.totalAmount)}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                        {config.nextStatus && (
                            <Button
                                className="flex-1"
                                onClick={() => handleStatusChange(config.nextStatus!)}
                                disabled={isUpdating}
                            >
                                {isUpdating ? 'Mise à jour...' : config.nextLabel}
                            </Button>
                        )}

                        {order.status !== 'delivered' && order.status !== 'cancelled' && (
                            <Button
                                variant="destructive"
                                onClick={() =>
                                    handleCancel(
                                        order.id,
                                        order.orderNumber
                                    )
                                }
                                disabled={isUpdating}
                            >
                                Annuler
                            </Button>
                        )}
                    </div>
                </CardContent>
            </AppCard>
            {/* AlertDialog suppression */}
            <AlertDialog
                open={!!deleteTarget}
                onOpenChange={() => setDeleteTarget(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Annuler la commande {deleteTarget?.orderNumber} ?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Cette action est irréversible.
                            {/* {deleteTarget && (
                                            <>
                                                <br />
                                                <span className="font-medium text-foreground">
                                                    {deleteTarget.name}
                                                </span>
                                            </>
                                        )} */}
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                        <AlertDialogCancel>
                            Annuler
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmCancel}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Confirmer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}