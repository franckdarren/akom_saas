// app/(public)/r/[slug]/page.tsx
import {notFound} from 'next/navigation'
import prisma from '@/lib/prisma'
import {PublicCatalogMenu} from './public-catalog-menu'

/**
 * Page catalogue public du restaurant
 * Route: /r/[slug]
 *
 * Cette page affiche le même menu que celui accessible via QR table,
 * mais sans association à une table physique. Le client doit choisir
 * son mode de fulfillment au checkout (emporter ou réservation).
 */
export default async function PublicCatalogPage({
                                                    params,
                                                }: {
    params: Promise<{ slug: string }>
}) {
    const {slug} = await params

    // Récupérer le restaurant
    const restaurant = await prisma.restaurant.findUnique({
        where: {slug, isActive: true},
        select: {
            id: true,
            name: true,
            slug: true,
            address: true,
            phone: true,
            coverImageUrl: true,
            logoUrl: true,
        },
    })

    if (!restaurant) {
        notFound()
    }

    return (
        <PublicCatalogMenu
            restaurantId={restaurant.id}
            restaurantSlug={restaurant.slug}
            restaurantName={restaurant.name}
            restaurantAddress={restaurant.address}
            restaurantPhone={restaurant.phone}
            coverImageUrl={restaurant.coverImageUrl}
            logoUrl={restaurant.logoUrl}
        />
    )
}

export async function generateMetadata({
                                           params,
                                       }: {
    params: Promise<{ slug: string }>
}) {
    const {slug} = await params

    const restaurant = await prisma.restaurant.findUnique({
        where: {slug},
        select: {name: true},
    })

    return {
        title: restaurant ? `${restaurant.name} - Menu en ligne` : 'Menu',
        description: restaurant
            ? `Commandez en ligne chez ${restaurant.name} ou réservez votre table`
            : 'Menu en ligne',
    }
}