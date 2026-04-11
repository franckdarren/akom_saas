// components/kitchen/OrderStatusBadge.tsx
'use client'

import { Badge } from '@/components/ui/badge'
import { useActivityLabels } from '@/lib/hooks/use-activity-labels'

type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled'

const STATUS_STYLE: Record<OrderStatus, string> = {
    pending: 'bg-red-500 text-white',
    preparing: 'bg-yellow-500 text-white',
    ready: 'bg-green-500 text-white',
    delivered: 'bg-gray-500 text-white',
    cancelled: 'bg-gray-200 text-gray-700',
}

interface OrderStatusBadgeProps {
    status: OrderStatus
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
    const labels = useActivityLabels()
    const label = labels.orderStatuses[status].label

    return <Badge className={`px-2 py-1 rounded-md text-sm font-medium ${STATUS_STYLE[status]}`}>{label}</Badge>
}
