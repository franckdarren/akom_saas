// app/orders/[orderId]/page.tsx
import { notFound } from 'next/navigation'
import { OrderTracker } from './order-tracker'

export default async function OrderTrackingPage({
    params,
}: {
    params: Promise<{ orderId: string }>
}) {
    const { orderId } = await params

    try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        // ⚠️ Utiliser /api/orders/[id] car le dossier s'appelle [id]
        const apiUrl = `${baseUrl}/api/orders/${orderId}`

        const response = await fetch(apiUrl, {
            cache: 'no-store',
            headers: {
                'Content-Type': 'application/json',
            },
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            console.error('❌ [PAGE] Erreur API:', errorData)
            notFound()
        }

        const order = await response.json()

        if (!order || !order.id) {
            console.error('❌ [PAGE] Données invalides:', order)
            notFound()
        }

        return (
            <OrderTracker
                orderId={order.id}
                orderNumber={order.orderNumber}
                restaurantName={order.restaurantName}
                restaurantLogo={order.restaurantLogo}
                restaurantPhone={order.restaurantPhone}
                tableNumber={order.tableNumber}
                status={order.status}
                totalAmount={order.totalAmount}
                items={order.items}
                createdAt={order.createdAt}
            />
        )
    } catch (error) {
        console.error('💥 [PAGE] Erreur catch:', error)
        console.error('💥 [PAGE] Type erreur:', error instanceof Error ? error.message : typeof error)
        console.error('💥 [PAGE] Stack:', error instanceof Error ? error.stack : 'N/A')
        notFound()
    }
}