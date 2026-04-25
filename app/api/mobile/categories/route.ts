import { NextRequest, NextResponse } from 'next/server'
import { validateMobileRequest } from '@/lib/mobile-auth'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
    const { ctx, error } = await validateMobileRequest(req)
    if (error) return error

    try {
        const categories = await prisma.category.findMany({
            where: { restaurantId: ctx.restaurantId, isActive: true },
            select: { id: true, name: true, position: true },
            orderBy: { position: 'asc' },
        })

        return NextResponse.json({ categories })
    } catch (err) {
        console.error('GET /api/mobile/categories:', err)
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }
}
