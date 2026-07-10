// app/r/[slug]/t/[number]/components/menu-layout.tsx
'use client'

import {useState, useMemo} from 'react'
import {MapPin, Phone} from 'lucide-react'
import Image from 'next/image'
import {useCart} from '../cart-context'
import {CartDialog} from '../cart-dialog'
import {RestaurantHeader} from './restaurant-header'
import {RestaurantInfo} from './restaurant-info'
import {SearchFilterBar} from './search-filter-bar'
import {ProductCard} from '../product-card'
import {FixedBottomBar} from './fixed-bottom-bar'
import {ActiveOrdersBanner} from '@/components/menu/ActiveOrdersBanner'
import {ActiveCatalogOrdersBanner} from '@/components/menu/ActiveCatalogOrdersBanner'
import type {PublicMenuData} from '@/lib/data/public-menu'

interface MenuLayoutProps {
    restaurantId: string
    restaurantSlug: string
    tableId: string
    tableNumber: number
    onCartOpen?: () => void
    initialMenuData: PublicMenuData
}

export function MenuLayout({
                               restaurantId,
                               restaurantSlug,
                               tableId,
                               tableNumber,
                               onCartOpen,
                               initialMenuData,
                           }: MenuLayoutProps) {
    // Le menu est chargé côté serveur (voir page.tsx des routes /r/[slug]) et passé en props :
    // plus de fetch client au montage, plus d'écran de chargement systématique.
    const menuData = initialMenuData
    const [showCartDialog, setShowCartDialog] = useState(false)

    // États de recherche et filtres
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

    const {totalItems, totalAmount} = useCart()

    // Détection automatique : si pas de tableId, on est en mode catalogue
    const isPublicCatalog = !tableId || tableId === null

    // Filtrer les catégories et produits
    const filteredCategories = useMemo(() => {
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

    return (
        <div className="min-h-screen bg-muted pb-3">
            {/* Header avec image */}
            <RestaurantHeader
                restaurantName={menuData.restaurant.name}
                coverImageUrl={menuData.restaurant.coverImageUrl}
                itemCount={totalItems}
                onCartClick={() => onCartOpen ? onCartOpen() : setShowCartDialog(true)}
            />

            {/*
                Card infos restaurant - Affichée seulement si on a une table
                Logique : Dans le catalogue public, pas besoin d'afficher
                "Table 0" car le client n'est pas physiquement au restaurant
            */}
            {!isPublicCatalog && (
                <RestaurantInfo
                    restaurantName={menuData.restaurant.name}
                    address={menuData.restaurant.address}
                    phone={menuData.restaurant.phone}
                    tableNumber={tableNumber}
                />
            )}

            {/* 
                Bandeau des commandes actives
                Ce composant s'affiche automatiquement si le client a des commandes
                en cours (pending, preparing, ready) sur cette table.
                Il permet au client de voir rapidement ses commandes actives et
                d'y accéder en un clic pour suivre leur progression.
            */}
            <div className="max-w-3xl mx-auto px-4 mt-6">
                {tableId ? (
                    <ActiveOrdersBanner
                        tableId={tableId}
                        tableNumber={tableNumber}
                        restaurantSlug={restaurantSlug}
                        restaurantId={restaurantId}
                    />
                ) : (
                    <ActiveCatalogOrdersBanner
                        restaurantSlug={restaurantSlug}
                        restaurantId={restaurantId}
                    />
                )}
            </div>

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
                <div className="mt-10 px-2 space-y-10">
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
                                        <ProductCard key={product.id} product={product}/>
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
                onViewCart={() => onCartOpen ? onCartOpen() : setShowCartDialog(true)}
            />

            {/* Dialog panier — masqué en mode catalogue (le parent gère son propre dialog) */}
            {!onCartOpen && (
                <CartDialog
                    open={showCartDialog}
                    onOpenChange={setShowCartDialog}
                    restaurantId={restaurantId}
                    restaurantSlug={restaurantSlug}
                    tableId={tableId}
                    tableNumber={tableNumber}
                />
            )}

            {/* Footer */}
            <footer className="bg-card mt-10 border-t border-border">
                <div className="w-full max-w-screen-xl mx-auto py-4 md:py-8">
                    <div className="flex justify-center items-center gap-2 mb-3">
                        {menuData.restaurant.logoUrl && (
                            <Image
                                src={menuData.restaurant.logoUrl}
                                width={20}
                                height={20}
                                className="h-5 w-auto"
                                alt="Logo"
                            />
                        )}
                        <span className="text-xl font-semibold whitespace-nowrap">
                            {menuData.restaurant.name}
                        </span>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center items-center">
                        {menuData.restaurant.phone && (
                            <div className="flex gap-2 items-center text-xs sm:text-sm">
                                <Phone className="h-4 w-4 shrink-0"/>
                                <span>{menuData.restaurant.phone}</span>
                            </div>
                        )}
                        {menuData.restaurant.address && (
                            <div className="flex gap-2 items-center text-xs sm:text-sm">
                                <MapPin className="h-4 w-4 shrink-0"/>
                                <span>{menuData.restaurant.address}</span>
                            </div>
                        )}
                    </div>
                </div>
            </footer>
        </div>
    )
}