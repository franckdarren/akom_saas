// app/(dashboard)/dashboard/warehouse/products/new/page.tsx
import { Metadata } from 'next'
import prisma from '@/lib/prisma'
import { getCurrentUserAndRestaurant } from '@/lib/auth/session'
import { WarehouseProductForm } from '@/components/warehouse/WarehouseProductForm'

export const metadata: Metadata = {
    title: "Nouveau produit d'entrepôt | Akôm",
    description:
        'Ajoutez un nouveau produit à votre magasin de stockage',
}

export default async function NewWarehouseProductPage() {
    const { restaurantId } = await getCurrentUserAndRestaurant()

    // ⚠️ Suppression de `isActive`, on ne filtre que par restaurantId
    const menuProducts = await prisma.product.findMany({
        where: {
            restaurantId,
            // Si ton modèle a un champ pour indiquer l'activité, remplace ici :
            // isAvailable: true
        },
        select: {
            id: true,
            name: true,
            imageUrl: true,
        },
        orderBy: {
            name: 'asc',
        },
    })

    return (
        <div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    Nouveau produit d'entrepôt
                </h1>

                <p className="text-muted-foreground mt-1">
                    Ajoutez un produit que vous stockez en volume
                    dans votre entrepôt
                </p>
            </div>

            <WarehouseProductForm
                availableProducts={menuProducts}
            />
        </div>
    )
}
