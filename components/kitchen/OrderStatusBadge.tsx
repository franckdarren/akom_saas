// components/kitchen/OrderStatusBadge.tsx
import { Badge } from '@/components/ui/badge'

// Définir un type local correspondant à ton enum Prisma
type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled'


interface OrderStatusBadgeProps {
    status: OrderStatus
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
    const STATUS_CONFIG: Record<OrderStatus, { label: string; className: string }> = {
        pending: { label: 'Nouveau', className: 'bg-red-500 text-white' },
        preparing: { label: 'En préparation', className: 'bg-yellow-500 text-white' },
        ready: { label: 'Prête', className: 'bg-green-500 text-white' },
        delivered: { label: 'Servie', className: 'bg-gray-500 text-white' },
        cancelled: { label: 'Annulée', className: 'bg-gray-200 text-gray-700' },
    }

    const { label, className } = STATUS_CONFIG[status]

    return <Badge className={`px-2 py-1 rounded-md text-sm font-medium ${className}`}>{label}</Badge>
}
