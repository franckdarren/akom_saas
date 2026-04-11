// app/r/[slug]/t/[number]/orders/[orderId]/page.tsx
import { notFound, redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { OrderTracker } from '@/components/orders/OrderTracker'

// ========================
// TYPES POUR LES ITEMS
// ========================

// Type de chaque item provenant de Prisma
type OrderItemData = {
    id: string
    productName: string
    quantity: number
    unitPrice: number
}

// Type attendu par le composant OrderTracker
type OrderTrackerItem = {
    id: string
    product_name: string
    quantity: number
    unit_price: number
}

// ========================
// PROPS DE LA PAGE
// ========================
interface PageProps {
    params: Promise<{
        slug: string      // Slug du restaurant
        number: string    // Numéro de table
        orderId: string   // UUID de la commande
    }>
}

// ========================
// PAGE PRINCIPALE
// ========================
export default async function OrderTrackingPage({ params }: PageProps) {
    try {
        const { slug, number, orderId } = await params

        console.log('🔍 Suivi de commande', { slug, number, orderId })

        // ------------------------
        // 1️⃣ Validation des paramètres
        // ------------------------
        const slugRegex = /^[a-z0-9-]+$/
        if (!slug || !slugRegex.test(slug)) notFound()

        const tableNumber = parseInt(number, 10)
        if (isNaN(tableNumber) || tableNumber <= 0) notFound()

        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        if (!orderId || !uuidRegex.test(orderId)) notFound()

        // ------------------------
        // 2️⃣ Récupération du restaurant
        // ------------------------
        const restaurant = await prisma.restaurant.findUnique({
            where: { slug, isActive: true },
            select: { id: true, name: true, slug: true, logoUrl: true, phone: true, activityType: true },
        })
        if (!restaurant) notFound()

        // ------------------------
        // 3️⃣ Récupération de la table
        // ------------------------
        const table = await prisma.table.findFirst({
            where: { restaurantId: restaurant.id, number: tableNumber, isActive: true },
            select: { id: true, number: true },
        })
        if (!table) notFound()

        // ------------------------
        // 4️⃣ Récupération de la commande
        // ------------------------
        const order = await prisma.order.findFirst({
            where: { id: orderId, restaurantId: restaurant.id, tableId: table.id },
            include: {
                orderItems: { select: { id: true, productName: true, quantity: true, unitPrice: true } },
            },
        })

        if (!order?.orderNumber) notFound()

        // CAS SPÉCIAL : redirection si la commande existe mais pour un autre restaurant/table
        if (!order) {
            const realOrder = await prisma.order.findUnique({
                where: { id: orderId },
                include: {
                    restaurant: { select: { slug: true } },
                    table: { select: { number: true } },
                },
            })
            if (realOrder?.restaurant && realOrder?.table) {
                redirect(`/r/${realOrder.restaurant.slug}/t/${realOrder.table.number}/orders/${orderId}`)
            }
            notFound()
        }

        // ------------------------
        // 5️⃣ Transformation des données pour le composant
        // ------------------------

        // Typage explicite des items pour TypeScript
        const orderItems: OrderTrackerItem[] = (order.orderItems as OrderItemData[]).map(
            (item: OrderItemData): OrderTrackerItem => ({
                id: item.id,
                product_name: item.productName,
                quantity: item.quantity,
                unit_price: item.unitPrice,
            })
        )

        const orderData = {
            id: order.id,
            order_number: order.orderNumber,
            status: order.status as 'pending' | 'preparing' | 'ready' | 'delivered',
            total_amount: order.totalAmount,
            customer_name: order.customerName,
            created_at: order.createdAt.toISOString(),
            updated_at: order.updatedAt.toISOString(),
            order_items: orderItems,
        }

        const restaurantData = {
            slug: restaurant.slug,
            name: restaurant.name,
            logo_url: restaurant.logoUrl,
            phone: restaurant.phone,
            activityType: restaurant.activityType,
        }

        const tableData = {
            number: table.number,
        }

        // ------------------------
        // 6️⃣ Rendu du composant
        // ------------------------
        return (
            <OrderTracker
                order={orderData}
                restaurant={restaurantData}
                table={tableData}
            />
        )
    } catch (error) {
        console.error('💥 Erreur inattendue:', error)

        const digest = (error as {digest?: string})?.digest
        if (digest?.includes('NEXT_NOT_FOUND') || digest?.includes('NEXT_REDIRECT')) throw error

        notFound()
    }
}

// ========================
// MÉTADATA SEO
// ========================
export async function generateMetadata({ params }: PageProps) {
    const { slug, orderId } = await params

    const restaurant = await prisma.restaurant.findUnique({ where: { slug }, select: { name: true } })
    const order = await prisma.order.findUnique({ where: { id: orderId }, select: { orderNumber: true } })

    if (!restaurant || !order) {
        return { title: 'Commande - Akôm', description: 'Suivez votre commande en temps réel', robots: 'noindex,nofollow' }
    }

    return {
        title: `${order.orderNumber} - ${restaurant.name} | Akôm`,
        description: `Suivez votre commande en temps réel chez ${restaurant.name}`,
        robots: 'noindex,nofollow',
    }
}
