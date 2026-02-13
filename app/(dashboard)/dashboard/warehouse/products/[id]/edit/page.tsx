// app/(dashboard)/dashboard/warehouse/products/[id]/edit/page.tsx
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { getCurrentUserAndRestaurant } from '@/lib/auth/session'
import { prisma } from '@/lib/prisma'
import { WarehouseProductForm } from '@/components/warehouse/WarehouseProductForm'

export const metadata: Metadata = {
    title: 'Modifier produit d\'entrepôt | Akôm',
    description: 'Modifiez les informations d\'un produit de votre magasin de stockage',
}

interface PageProps {
    params: {
        id: string
    }
}

/**
 * Page de modification d'un produit d'entrepôt.
 * 
 * Cette page permet de modifier toutes les informations d'un produit existant :
 * - Informations de base (nom, SKU, description, image, catégorie)
 * - Configuration de l'unité de stockage
 * - Lien avec produit menu et ratio de conversion
 * - Seuil d'alerte
 * 
 * Note importante : Le stock initial et le coût unitaire ne sont pas modifiables ici.
 * Pour ajuster le stock, l'utilisateur doit utiliser les actions "Entrée de stock"
 * ou "Ajustement d'inventaire" depuis la page de détail du produit.
 * Pour modifier le coût unitaire, il peut le faire lors de la prochaine entrée de stock.
 * 
 * Cette séparation est volontaire pour maintenir la traçabilité des mouvements
 * et éviter les modifications de stock sans enregistrement dans l'historique.
 */
export default async function EditWarehouseProductPage({ params }: PageProps) {
    const { restaurantId } = await getCurrentUserAndRestaurant()

    // Récupérer le produit avec toutes ses informations
    const product = await prisma.warehouseProduct.findUnique({
        where: {
            id: params.id,
            restaurantId, // Sécurité : vérifier que le produit appartient au restaurant
        },
        include: {
            stock: true,
            linkedProduct: true,
        },
    })

    // Si le produit n'existe pas ou n'appartient pas au restaurant, afficher 404
    if (!product) {
        notFound()
    }

    // Récupérer la liste des produits du menu pour le sélecteur de lien
    // On exclut le produit actuellement lié pour éviter les doublons dans la liste
    const menuProducts = await prisma.product.findMany({
        where: {
            restaurantId,
            isActive: true,
            // Optionnel : on peut inclure le produit actuellement lié
            // pour permettre de le garder dans la sélection
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

            {/* Message informatif sur ce qui n'est pas modifiable */}
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

            {/* Formulaire de modification */}
            {/* 
        Le composant WarehouseProductForm détecte automatiquement qu'on est en mode édition
        grâce à la présence de la prop initialData. Il adapte son comportement :
        - Les champs de stock initial et coût unitaire sont masqués
        - Le bouton de soumission affiche "Enregistrer les modifications"
        - L'action appelée est updateWarehouseProduct au lieu de createWarehouseProduct
      */}
            <WarehouseProductForm
                initialData={product}
                availableProducts={menuProducts}
            />
        </div>
    )
}