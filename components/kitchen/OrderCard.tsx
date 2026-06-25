// components/kitchen/OrderCard.tsx
'use client'

import {useState} from 'react'
import {AppCard, CardContent, CardHeader, CardTitle} from '@/components/ui/app-card'
import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {formatDate, formatPrice} from '@/lib/utils/format'
import {Clock, CheckCircle, Banknote, AlertCircle, type LucideIcon} from 'lucide-react'
import {useActivityLabels} from '@/lib/hooks/use-activity-labels'
import {useRestaurant} from '@/lib/hooks/use-restaurant'
import {
    getOrderStatusIcon,
    getOrderStatusBadgeClass,
    getNextStatus,
} from '@/lib/config/order-status'
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

type PaymentBadgeInfo = {
    label: string
    className: string
    Icon: LucideIcon
} | null

function getPaymentBadge(payments: OrderPayment[], orderStatus: OrderStatus): PaymentBadgeInfo {
    // Pas de badge pour les commandes annulées ou en attente de paiement
    if (orderStatus === 'cancelled' || orderStatus === 'awaiting_payment') return null

    if (payments.some(p => p.status === 'paid')) {
        return {label: 'Payé', className: 'bg-success text-success-foreground', Icon: CheckCircle}
    }

    if (payments.some(p => p.status === 'pending' && p.method === 'cash')) {
        return {label: 'Cash', className: 'bg-info text-info-foreground', Icon: Banknote}
    }

    if (payments.some(p => p.status === 'pending')) {
        return {label: 'Paiement en cours', className: 'bg-warning text-warning-foreground', Icon: Clock}
    }

    // Aucun paiement enregistré ou tous échoués
    return {label: 'Impayé', className: 'bg-destructive text-destructive-foreground', Icon: AlertCircle}
}

export function OrderCard({order}: OrderCardProps) {
    const [isUpdating, setIsUpdating] = useState(false)
    const labels = useActivityLabels()
    const {currentRestaurant} = useRestaurant()
    const activityType = currentRestaurant?.activityType
    const Icon = getOrderStatusIcon(activityType, order.status)
    const badgeClass = getOrderStatusBadgeClass(order.status)
    const statusLabel = labels.orderStatuses[order.status].label
    const nextStatus = getNextStatus(activityType, order.status)
    const nextLabel = nextStatus
        ? (labels.orderStatuses[nextStatus] as { actionLabel?: string }).actionLabel ?? null
        : null
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
        await handleStatusChange('cancelled')
        setLoading(null)
        setDeleteTarget(null)
        toast.success(`${labels.orderNameCapital} annulée avec succès.`)
    }

    return (
        <>
            <AppCard
                className={order.status === 'pending' ? 'border-status-pending shadow-lg hover:border-primary/50 hover:shadow-md' : 'hover:border-primary/50 hover:shadow-md'}>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-bold">
                            {order.orderNumber}
                        </CardTitle>
                        <Badge className={badgeClass}>
                            <Icon className="h-3 w-3 mr-1"/>
                            {statusLabel}
                        </Badge>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{labels.tableNameCapital} {order.table?.number || 'N/A'}</span>
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
                        {nextStatus && nextLabel && (
                            <Button
                                className="flex-1"
                                onClick={() => handleStatusChange(nextStatus)}
                                disabled={isUpdating}
                            >
                                {isUpdating ? 'Mise à jour...' : nextLabel}
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
                            Annuler la {labels.orderName} {deleteTarget?.orderNumber} ?
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
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            Confirmer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}