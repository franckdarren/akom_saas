// app/(public)/r/[slug]/page.tsx
import {cache} from 'react'
import {notFound} from 'next/navigation'
import prisma from '@/lib/prisma'
import {PublicCatalogMenu} from './public-catalog-menu'

// cache() déduplique la requête : generateMetadata et le composant page
// partagent le même appel dans le même cycle de rendu Next.js
const getRestaurantBySlug = cache(async (slug: string) =>
    prisma.restaurant.findUnique({
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
)

/**
 * Page catalogue public du restaurant
 * Route: /r/[slug]
 */
export default async function PublicCatalogPage({
                                                    params,
                                                }: {
    params: Promise<{ slug: string }>
}) {
    const {slug} = await params
    const restaurant = await getRestaurantBySlug(slug)

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
    const restaurant = await getRestaurantBySlug(slug)

    return {
        title: restaurant ? `${restaurant.name} - Menu en ligne` : 'Menu',
        description: restaurant
            ? `Commandez en ligne chez ${restaurant.name} ou réservez votre table`
            : 'Menu en ligne',
    }
}