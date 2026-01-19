// app/r/[slug]/t/[number]/page.tsx
import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import { PublicMenu } from './public-menu'

export default async function PublicMenuPage({
    params,
}: {
    params: Promise<{ slug: string; number: string }>
}) {
    const { slug, number } = await params

    // Récupérer le restaurant
    const restaurant = await prisma.restaurant.findUnique({
        where: { slug, isActive: true },
    })

    if (!restaurant) {
        notFound()
    }

    // Récupérer la table
    const tableNumber = parseInt(number)
    const table = await prisma.table.findFirst({
        where: {
            restaurantId: restaurant.id,
            number: tableNumber,
            isActive: true,
        },
    })

    if (!table) {
        notFound()
    }

    return (
        <PublicMenu
            restaurantId={restaurant.id}
            restaurantName={restaurant.name}
            restaurantSlug={slug}
            tableId={table.id}
            tableNumber={tableNumber}
        />
    )
}