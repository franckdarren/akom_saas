// app/orders/[orderId]/page.tsx
import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import { OrderTracker } from './order-tracker'

export default async function OrderTrackingPage({
    params,
}: {
    params: Promise<{ orderId: string }>
}) {
    const { orderId } = await params

    // Récupérer la commande
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
            restaurant: {
                select: {
                    name: true,
                    logoUrl: true,
                    phone: true,
                },
            },
            table: {
                select: {
                    number: true,
                },
            },
            orderItems: {
                include: {
                    product: {
                        select: {
                            imageUrl: true,
                        },
                    },
                },
            },
        },
    })

    if (!order) {
        notFound()
    }

    return (
        <OrderTracker
            orderId={order.id}
            orderNumber={order.orderNumber || ''}
            restaurantName={order.restaurant.name}
            restaurantLogo={order.restaurant.logoUrl}
            restaurantPhone={order.restaurant.phone}
            tableNumber={order.table?.number || 0}
            status={order.status}
            totalAmount={order.totalAmount}
            items={order.orderItems.map((item) => ({
                name: item.productName,
                quantity: item.quantity,
                price: item.unitPrice,
                imageUrl: item.product.imageUrl,
            }))}
            createdAt={order.createdAt.toISOString()}
        />
    )
}