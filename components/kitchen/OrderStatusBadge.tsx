// components/kitchen/OrderStatusBadge.tsx
'use client'

import {Badge} from '@/components/ui/badge'
import {useActivityLabels} from '@/lib/hooks/use-activity-labels'
import {useRestaurant} from '@/lib/hooks/use-restaurant'
import {getOrderStatusBadgeClass, getOrderStatusIcon} from '@/lib/config/order-status'
import type {OrderStatusKey} from '@/lib/config/activity-labels'

interface OrderStatusBadgeProps {
    status: OrderStatusKey
    showIcon?: boolean
}

export function OrderStatusBadge({status, showIcon = false}: OrderStatusBadgeProps) {
    const labels = useActivityLabels()
    const {currentRestaurant} = useRestaurant()
    const label = labels.orderStatuses[status].label
    const Icon = getOrderStatusIcon(currentRestaurant?.activityType, status)
    const className = getOrderStatusBadgeClass(status)

    return (
        <Badge className={`px-2 py-1 rounded-md ${className}`}>
            {showIcon && <Icon className="h-3 w-3 mr-1"/>}
            {label}
        </Badge>
    )
}
