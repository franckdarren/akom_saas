// components/kitchen/OrderStatusBadge.tsx
import { Badge } from '@/components/ui/badge'
import type { OrderStatus } from '@prisma/client'

interface OrderStatusBadgeProps {
    status: OrderStatus
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
    const config = {
        pending: {
            label: 'Nouveau',
            variant: 'destructive' as const,
            className: 'bg-red-500 text-white',
        },
        preparing: {
            label: 'En préparation',
            variant: 'default' as const,
            className: 'bg-yellow-500 text-white',
        },
        ready: {
            label: 'Prête',
            variant: 'success' as const,
            className: 'bg-green-500 text-white',
        },
        delivered: {
            label: 'Servie',
            variant: 'secondary' as const,
            className: 'bg-gray-500 text-white',
        },
        cancelled: {
            label: 'Annulée',
            variant: 'outline' as const,
            className: 'bg-gray-200 text-gray-700',
        },
    }

    const { label, className } = config[status]

    return (
        <Badge className={className}>
            {label}
        </Badge>
    )
}