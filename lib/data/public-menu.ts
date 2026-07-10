// lib/data/public-menu.ts
import {unstable_cache} from 'next/cache'
import prisma from '@/lib/prisma'

export function menuCacheTag(restaurantId: string) {
    return `menu-${restaurantId}`
}

async function fetchMenuCategories(restaurantId: string) {
    const categories = await prisma.category.findMany({
        where: {
            restaurantId,
            isActive: true,
            // price: not null — un produit "sur devis" (includePrice: false) n'a pas de prix
            // fixe et ne peut pas être commandé en self-service (le checkout le rejette de
            // toute façon, voir app/api/catalog/orders/route.ts) : autant ne pas l'afficher.
            products: {
                some: {isAvailable: true, price: {not: null}},
            },
        },
        select: {
            id: true,
            name: true,
            products: {
                where: {isAvailable: true, price: {not: null}},
                select: {
                    id: true,
                    name: true,
                    description: true,
                    price: true,
                    imageUrl: true,
                    stock: {select: {quantity: true}},
                },
                orderBy: {name: 'asc'},
            },
        },
        orderBy: {position: 'asc'},
    })

    // Le `where: {price: {not: null}}` garantit price non-null à l'exécution,
    // mais Prisma ne peut pas le refléter dans le type généré — on le rend explicite ici.
    return categories.map((category) => ({
        ...category,
        products: category.products.map((product) => ({
            ...product,
            price: product.price as number,
        })),
    }))
}

/**
 * Données du menu public (restaurant + catégories + produits disponibles).
 * Le restaurant est résolu hors cache (lookup indexé sur `slug`), les catégories/produits
 * sont mis en cache par restaurantId : évite de retaper Postgres à chaque scan QR / visite.
 * Invalidé via updateTag(menuCacheTag(restaurantId)) par les actions produit/catégorie,
 * avec un filet de sécurité de 60s en revalidation temporelle.
 */
export async function getPublicMenuData(slug: string) {
    const restaurant = await prisma.restaurant.findUnique({
        where: {slug, isActive: true},
        select: {
            id: true,
            name: true,
            phone: true,
            address: true,
            logoUrl: true,
            coverImageUrl: true,
        },
    })

    if (!restaurant) return null

    const getCachedCategories = unstable_cache(
        () => fetchMenuCategories(restaurant.id),
        [`menu-categories-${restaurant.id}`],
        {tags: [menuCacheTag(restaurant.id)], revalidate: 60}
    )

    const categories = await getCachedCategories()

    return {restaurant, categories}
}

export type PublicMenuData = NonNullable<Awaited<ReturnType<typeof getPublicMenuData>>>
