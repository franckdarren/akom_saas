import {notFound} from 'next/navigation'
import prisma from '@/lib/prisma'
import {OrderTracker} from '@/components/orders/OrderTracker'

interface PageProps {
    params: Promise<{
        slug: string
        orderId: string
    }>
}

export default async function CatalogOrderTrackingPage({params}: PageProps) {
    const {slug, orderId} = await params

    // Validation des paramètres
    const slugRegex = /^[a-z0-9-]+$/
    if (!slug || !slugRegex.test(slug)) notFound()

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!orderId || !uuidRegex.test(orderId)) notFound()

    // Récupérer le restaurant
    const restaurant = await prisma.restaurant.findUnique({
        where: {slug, isActive: true},
        select: {id: true, name: true, slug: true, logoUrl: true, phone: true, activityType: true},
    })
    if (!restaurant) notFound()

    // Récupérer la commande (sans filtre tableId car commande catalogue)
    const order = await prisma.order.findFirst({
        where: {id: orderId, restaurantId: restaurant.id},
        include: {
            orderItems: {select: {id: true, productName: true, quantity: true, unitPrice: true}},
        },
    })
    if (!order?.orderNumber) notFound()

    const orderData = {
        id: order.id,
        order_number: order.orderNumber,
        status: order.status as 'pending' | 'preparing' | 'ready' | 'delivered',
        total_amount: order.totalAmount,
        customer_name: order.customerName,
        created_at: order.createdAt.toISOString(),
        updated_at: order.updatedAt.toISOString(),
        order_items: order.orderItems.map((item) => ({
            id: item.id,
            product_name: item.productName,
            quantity: item.quantity,
            unit_price: item.unitPrice,
        })),
    }

    return (
        <OrderTracker
            order={orderData}
            restaurant={{
                slug: restaurant.slug,
                name: restaurant.name,
                logo_url: restaurant.logoUrl,
                phone: restaurant.phone,
                activityType: restaurant.activityType,
            }}
        />
    )
}

export async function generateMetadata({params}: PageProps) {
    const {slug, orderId} = await params

    const restaurant = await prisma.restaurant.findUnique({where: {slug}, select: {name: true}})
    const order = await prisma.order.findUnique({where: {id: orderId}, select: {orderNumber: true}})

    if (!restaurant || !order) {
        return {title: 'Commande - Akom', description: 'Suivez votre commande en temps réel', robots: 'noindex,nofollow'}
    }

    return {
        title: `${order.orderNumber} - ${restaurant.name} | Akom`,
        description: `Suivez votre commande en temps réel chez ${restaurant.name}`,
        robots: 'noindex,nofollow',
    }
}
