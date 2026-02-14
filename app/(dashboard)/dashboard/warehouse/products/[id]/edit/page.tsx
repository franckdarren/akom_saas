// app/(dashboard)/dashboard/warehouse/products/[id]/edit/page.tsx
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { getCurrentUserAndRestaurant } from '@/lib/auth/session'
import prisma from '@/lib/prisma'
import { WarehouseProductForm } from '@/components/warehouse/WarehouseProductForm'

export const metadata: Metadata = {
    title: 'Modifier produit d\'entrepôt | Akôm',
    description: 'Modifiez les informations d\'un produit de votre magasin de stockage',
}

interface PageProps {
    params: Promise<{ id: string }> // ✅ IMPORTANT : params est une Promise depuis Next.js 15
}

export default async function EditWarehouseProductPage({ params }: PageProps) {
    // ✅ CORRECTION 1 : await params pour récupérer l'id
    const { id } = await params
    const { restaurantId } = await getCurrentUserAndRestaurant()

    // Récupérer le produit avec toutes ses informations
    const productFromDb = await prisma.warehouseProduct.findUnique({
        where: {
            id,
            restaurantId,
        },
        include: {
            stock: true,
            linkedProduct: true,
        },
    })

    if (!productFromDb) {
        notFound()
    }

    // ✅ CORRECTION 2 : Convertir les types Decimal en number
    // Cette transformation est nécessaire car les Client Components ne peuvent
    // pas recevoir des objets Decimal de Prisma. Nous devons les convertir
    // en types JavaScript natifs avant de les passer au composant.
    const product = {
        ...productFromDb,
        // Convertir conversionRatio de Decimal vers number
        conversionRatio: Number(productFromDb.conversionRatio),
    }

    // Récupérer la liste des produits du menu
    const menuProducts = await prisma.product.findMany({
        where: {
            restaurantId,
            isAvailable: true,
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
            {/* Header avec navigation */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" asChild>
                    <Link href={`/dashboard/warehouse/products/${product.id}`}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Retour au produit
                    </Link>
                </Button>
            </div>

            {/* Titre de la page */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    Modifier le produit d'entrepôt
                </h1>
                <p className="text-muted-foreground mt-1">
                    Mettez à jour les informations de {product.name}
                </p>
            </div>

            {/* Message informatif */}
            <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20 p-4">
                <div className="flex gap-3">
                    <div className="flex-shrink-0">
                        <svg
                            className="h-5 w-5 text-blue-600 dark:text-blue-400"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path
                                fillRule="evenodd"
                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                            À propos des modifications de stock
                        </h3>
                        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                            Le stock et le coût unitaire ne peuvent pas être modifiés directement ici.
                            Pour ajuster le stock, utilisez les actions "Entrée de stock" ou "Ajustement d'inventaire"
                            depuis la page du produit. Cela garantit la traçabilité complète de tous les mouvements.
                        </p>
                    </div>
                </div>
            </div>

            {/* Formulaire de modification avec les données nettoyées */}
            <WarehouseProductForm
                initialData={product}
                availableProducts={menuProducts}
            />
        </div>
    )
}