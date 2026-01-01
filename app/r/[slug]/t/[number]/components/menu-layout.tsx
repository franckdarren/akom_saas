// app/r/[slug]/t/[number]/components/menu-layout.tsx
'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useCart } from '../cart-context'
import { CartDialog } from '../cart-dialog'
import { RestaurantHeader } from './restaurant-header'
import { RestaurantInfo } from './restaurant-info'
import { CategorySection } from './category-section'
import { FixedBottomBar } from './fixed-bottom-bar'

interface Category {
    id: string
    name: string
    products: Array<{
        id: string
        name: string
        description: string | null
        price: number
        imageUrl: string | null
        stock: { quantity: number } | null
    }>
}

interface MenuData {
    restaurant: {
        id: string
        name: string
        address: string | null
        phone: string | null
        coverImageUrl: string | null
    }
    categories: Category[]
}

interface MenuLayoutProps {
    restaurantId: string
    restaurantSlug: string
    tableId: string
    tableNumber: number
}

export function MenuLayout({
    restaurantId,
    restaurantSlug,
    tableId,
    tableNumber,
}: MenuLayoutProps) {
    const [menuData, setMenuData] = useState<MenuData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [showCartDialog, setShowCartDialog] = useState(false)

    const { totalItems, totalAmount } = useCart()

    // Charger le menu
    useEffect(() => {
        async function loadMenu() {
            try {
                const response = await fetch(`/api/menu/${restaurantSlug}`)
                if (!response.ok) throw new Error('Erreur chargement menu')

                const data = await response.json()
                setMenuData(data)
            } catch (err) {
                setError('Impossible de charger le menu')
                console.error(err)
            } finally {
                setIsLoading(false)
            }
        }

        loadMenu()
    }, [restaurantSlug])

    // États de chargement et d'erreur
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-900">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Chargement du menu...</p>
                </div>
            </div>
        )
    }

    if (error || !menuData) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-zinc-900">
                <div className="text-center">
                    <p className="text-lg text-red-500 mb-4">
                        {error || 'Menu introuvable'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Veuillez scanner à nouveau le QR code de votre table
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 pb-24">
            {/* Header avec image */}
            <RestaurantHeader
                restaurantName={menuData.restaurant.name}
                coverImageUrl={menuData.restaurant.coverImageUrl}
                itemCount={totalItems}
                onCartClick={() => setShowCartDialog(true)}
            />

            {/* Contenu principal */}
            <div className="max-w-3xl mx-auto">
                {/* Card infos restaurant */}
                <RestaurantInfo
                    restaurantName={menuData.restaurant.name}
                    address={menuData.restaurant.address}
                    phone={menuData.restaurant.phone}
                    tableNumber={tableNumber}
                />

                {/* Menu par catégories */}
                <div className="mt-6 space-y-8">
                    {menuData.categories.length === 0 ? (
                        <div className="text-center py-12 px-4">
                            <p className="text-muted-foreground">
                                Le menu est en cours de préparation...
                            </p>
                        </div>
                    ) : (
                        menuData.categories.map((category) => (
                            <CategorySection
                                key={category.id}
                                categoryName={category.name}
                                products={category.products}
                            />
                        ))
                    )}
                </div>
            </div>

            {/* Barre fixe en bas */}
            <FixedBottomBar
                itemCount={totalItems}
                totalAmount={totalAmount}
                onViewCart={() => setShowCartDialog(true)}
            />

            {/* Dialog panier */}
            <CartDialog
                open={showCartDialog}
                onOpenChange={setShowCartDialog}
                restaurantId={restaurantId}
                tableId={tableId}
            />
        </div>
    )
}