// app/r/[slug]/t/[number]/components/menu-layout.tsx
'use client'

import { useEffect, useState, useMemo } from 'react'
import { Loader2, MapPin, Phone } from 'lucide-react'
import { useCart } from '../cart-context'
import { CartDialog } from '../cart-dialog'
import { RestaurantHeader } from './restaurant-header'
import { RestaurantInfo } from './restaurant-info'
import { SearchFilterBar } from './search-filter-bar'
import { ProductCard } from '../product-card'
import { FixedBottomBar } from './fixed-bottom-bar'

interface Product {
    id: string
    name: string
    description: string | null
    price: number
    imageUrl: string | null
    stock: { quantity: number } | null
}

interface Category {
    id: string
    name: string
    products: Product[]
}

interface MenuData {
    restaurant: {
        id: string
        name: string
        address: string | null
        phone: string | null
        coverImageUrl: string | null
        logoUrl: string | null
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

    // États de recherche et filtres
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

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

    // Filtrer les catégories et produits
    const filteredCategories = useMemo(() => {
        if (!menuData) return []

        let categories = menuData.categories

        // Filtrer par catégorie sélectionnée
        if (selectedCategory) {
            categories = categories.filter((cat) => cat.id === selectedCategory)
        }

        // Filtrer par recherche
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase()
            categories = categories
                .map((category) => ({
                    ...category,
                    products: category.products.filter(
                        (product) =>
                            product.name.toLowerCase().includes(query) ||
                            product.description?.toLowerCase().includes(query) ||
                            category.name.toLowerCase().includes(query)
                    ),
                }))
                .filter((category) => category.products.length > 0)
        }

        return categories
    }, [menuData, selectedCategory, searchQuery])

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
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 pb-3">
            {/* Header avec image */}
            <RestaurantHeader
                restaurantName={menuData.restaurant.name}
                coverImageUrl={menuData.restaurant.coverImageUrl}
                itemCount={totalItems}
                onCartClick={() => setShowCartDialog(true)}
            />

            {/* Card infos restaurant */}
            <RestaurantInfo
                restaurantName={menuData.restaurant.name}
                address={menuData.restaurant.address}
                phone={menuData.restaurant.phone}
                tableNumber={tableNumber}
            />

            {/* Barre de recherche et filtres */}
            <SearchFilterBar
                categories={menuData.categories.map((c) => ({
                    id: c.id,
                    name: c.name,
                }))}
                selectedCategory={selectedCategory}
                onCategorySelect={setSelectedCategory}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
            />

            {/* Contenu principal */}
            <div className="max-w-3xl mx-auto">

                {/* Menu par catégories */}
                <div className="mt-6 px-2 space-y-6">
                    {filteredCategories.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground">
                                {searchQuery
                                    ? 'Aucun produit trouvé pour cette recherche'
                                    : 'Aucun produit disponible'}
                            </p>
                        </div>
                    ) : (
                        filteredCategories.map((category) => (
                            <div key={category.id}>
                                <h2 className="text-xl font-bold mb-3 px-2">
                                    {category.name}
                                </h2>
                                <div className="space-y-3">
                                    {category.products.map((product) => (
                                        <ProductCard key={product.id} product={product} />
                                    ))}
                                </div>
                            </div>
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

            {/* Footer */}
            <footer className="bg-white dark:bg-zinc-800 mt-10 border-t border-zinc-200 dark:border-zinc-700">
                <div className="w-full max-w-screen-xl mx-auto py-4 md:py-8">
                    <div className="flex justify-center items-center gap-2 mb-3">
                        {menuData.restaurant.logoUrl && (
                            <img
                                src={menuData.restaurant.logoUrl}
                                className="h-5"
                                alt="Logo"
                            />
                        )}
                        <span className="text-xl font-semibold whitespace-nowrap">
                            {menuData.restaurant.name}
                        </span>
                    </div>
                    <div className="flex gap-3 justify-center">
                        {menuData.restaurant.phone && (
                            <div className="flex gap-2 items-center text-xs">
                                <Phone className="h-4 w-4" />
                                <span>{menuData.restaurant.phone}</span>
                            </div>
                        )}
                        {menuData.restaurant.address && (
                            <div className="flex gap-2 items-center text-xs">
                                <MapPin className="h-4 w-4" />
                                <span>{menuData.restaurant.address}</span>
                            </div>
                        )}
                    </div>
                </div>
            </footer>
        </div>
    )
}