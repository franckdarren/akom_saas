// app/api/menu/[slug]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params

        // Récupérer le restaurant par son slug
        const restaurant = await prisma.restaurant.findUnique({
            where: {
                slug,
                isActive: true,
            },
            select: {
                id: true,
                name: true,
                phone: true,
                address: true,
                logoUrl: true,
            },
        })

        if (!restaurant) {
            return NextResponse.json(
                { error: 'Restaurant non trouvé' },
                { status: 404 }
            )
        }

        // Récupérer les catégories et produits disponibles
        const categories = await prisma.category.findMany({
            where: {
                restaurantId: restaurant.id,
                isActive: true,
            },
            include: {
                products: {
                    where: {
                        isAvailable: true,
                    },
                    include: {
                        stock: {
                            select: {
                                quantity: true,
                            },
                        },
                    },
                    orderBy: {
                        name: 'asc',
                    },
                },
            },
            orderBy: {
                position: 'asc',
            },
        })

        return NextResponse.json({
            restaurant,
            categories,
        })
    } catch (error) {
        console.error('Erreur API menu:', error)
        return NextResponse.json(
            { error: 'Erreur lors de la récupération du menu' },
            { status: 500 }
        )
    }
}