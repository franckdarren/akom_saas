// app/api/menu/[slug]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getPublicMenuData } from '@/lib/data/public-menu'

// Route conservée pour les rafraîchissements côté client (ex: après une action panier) ;
// le chargement initial du menu passe désormais par le SSR (voir page.tsx des routes /r/[slug]).
// Les données sont mises en cache — voir lib/data/public-menu.ts.
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params

        const menuData = await getPublicMenuData(slug)

        if (!menuData) {
            return NextResponse.json(
                { error: 'Restaurant non trouvé' },
                { status: 404 }
            )
        }

        return NextResponse.json(menuData)
    } catch (error) {
        console.error('Erreur API menu:', error)
        return NextResponse.json(
            { error: 'Erreur lors de la récupération du menu' },
            { status: 500 }
        )
    }
}