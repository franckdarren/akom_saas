// app/r/[slug]/t/[number]/page.tsx
import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getPublicMenuData } from '@/lib/data/public-menu'
import { PublicMenu } from './public-menu'

export default async function PublicMenuPage({
    params,
}: {
    params: Promise<{ slug: string; number: string }>
}) {
    const { slug, number } = await params
    const tableNumber = parseInt(number)

    // Le menu (restaurant + catégories + produits) et la table sont indépendants : en parallèle.
    const [menuData, table] = await Promise.all([
        getPublicMenuData(slug),
        prisma.table.findFirst({
            where: {
                restaurant: { slug, isActive: true },
                number: tableNumber,
                isActive: true,
            },
            select: { id: true },
        }),
    ])

    if (!menuData || !table) {
        notFound()
    }

    return (
        <PublicMenu
            restaurantId={menuData.restaurant.id}
            restaurantName={menuData.restaurant.name}
            restaurantSlug={slug}
            tableId={table.id}
            tableNumber={tableNumber}
            initialMenuData={menuData}
        />
    )
}