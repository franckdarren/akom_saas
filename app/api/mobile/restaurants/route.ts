import { NextRequest, NextResponse } from 'next/server'
import { validateToken } from '@/lib/mobile-auth'
import prisma from '@/lib/prisma'

// Liste des restaurants accessibles à l'utilisateur connecté.
// Cette route ne requiert pas x-restaurant-id — c'est justement ce qu'on vient chercher.
export async function GET(req: NextRequest) {
    const { userId, error } = await validateToken(req)
    if (error) return error

    try {
        const memberships = await prisma.restaurantUser.findMany({
            where: { userId: userId! },
            include: {
                restaurant: {
                    select: { id: true, name: true, logoUrl: true, slug: true, isActive: true },
                },
            },
        })

        const restaurants = memberships
            .filter((m) => m.restaurant.isActive)
            .map((m) => ({
                id: m.restaurant.id,
                name: m.restaurant.name,
                logoUrl: m.restaurant.logoUrl,
                slug: m.restaurant.slug,
            }))

        return NextResponse.json({ restaurants })
    } catch (err) {
        console.error('GET /api/mobile/restaurants:', err)
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }
}
