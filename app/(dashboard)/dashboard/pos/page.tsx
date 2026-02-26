// app/(dashboard)/dashboard/pos/page.tsx
import {getCurrentUserAndRestaurant} from '@/lib/auth/session'
import {redirect} from 'next/navigation'
import prisma from '@/lib/prisma'
import {POSShell} from './_components/POSShell'

export default async function POSPage() {
    // ✅ FIX 1 : la fonction retourne { userId, restaurantId } — pas { user, restaurant }
    const {userId, restaurantId} = await getCurrentUserAndRestaurant()

    if (!userId || !restaurantId) redirect('/login')

    // ✅ FIX 2 : le rôle n'est pas dans la session, on le récupère depuis la BDD
    const restaurantUser = await prisma.restaurantUser.findUnique({
        where: {
            userId_restaurantId: {userId, restaurantId},
        },
        select: {role: true},
    })

    if (!restaurantUser || !['admin', 'cashier'].includes(restaurantUser.role ?? '')) {
        redirect('/dashboard')
    }

    // ✅ FIX 3 : `isActive` n'existe pas sur Product — le bon champ est `isAvailable`
    //            On utilise `select` pour ne retourner que les champs dont POSShell a besoin,
    //            ce qui garantit la compatibilité avec POSCategory / POSProduct
    const categories = await prisma.category.findMany({
        where: {restaurantId},
        include: {
            products: {
                where: {
                    isAvailable: true,   // ← champ correct sur le modèle Product
                },
                orderBy: {name: 'asc'},
                // ✅ FIX 4 : select explicite → Prisma retourne exactement POSProduct
                //            sans champs supplémentaires qui causeraient un mismatch de type
                select: {
                    id: true,
                    name: true,
                    price: true,
                    imageUrl: true,
                    isAvailable: true,
                    hasStock: true,
                },
            },
        },
        orderBy: {position: 'asc'},
    })

    return (
        <POSShell
            categories={categories}
            restaurantId={restaurantId}
        />
    )
}