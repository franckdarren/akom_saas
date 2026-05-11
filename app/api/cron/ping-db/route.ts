import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '')

        if (!token || token !== process.env.CRON_SECRET) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
        }

        // Requête minimale pour maintenir la connexion Supabase active
        await prisma.$queryRaw`SELECT 1`

        console.log('✅ DB ping OK —', new Date().toISOString())

        return NextResponse.json({
            success: true,
            message: 'Base de données active',
            pingedAt: new Date().toISOString(),
        })
    } catch (error) {
        console.error('❌ DB ping échoué:', error)
        return NextResponse.json(
            {
                error: 'Ping échoué',
                details: error instanceof Error ? error.message : 'Erreur inconnue',
            },
            { status: 500 }
        )
    }
}
