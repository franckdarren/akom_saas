// app/r/[slug]/t/[number]/public-menu.tsx
'use client'

import { useEffect, useState } from 'react'
import { ShoppingBag, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CartProvider, useCart } from './cart-context'
import { ProductCard } from './product-card'
import { CartDialog } from './cart-dialog'

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
    }
    categories: Category[]
}

interface PublicMenuProps {
    restaurantId: string
    restaurantName: string
    restaurantSlug: string
    tableId: string
    tableNumber: number
}

function MenuContent({
    restaurantId,
    restaurantName,
    restaurantSlug,
    tableId,
}: Omit<PublicMenuProps, 'tableNumber'>) {
    const [menuData, setMenuData] = useState<MenuData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [showCart, setShowCart] = useState(false)

    const { totalItems } = useCart()

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

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (error || !menuData) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="text-center">
                    <p className="text-lg text-red-500">{error || 'Menu introuvable'}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 pb-20">
            {/* Header fixe avec panier */}
            <header className="sticky top-0 z-50 bg-white dark:bg-zinc-800 border-b shadow-sm">
                <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div>
                        <h1 className="font-bold text-lg">{restaurantName}</h1>
                        <p className="text-xs text-muted-foreground">Menu en ligne</p>
                    </div>

                    <Button
                        size="lg"
                        onClick={() => setShowCart(true)}
                        className="relative"
                        disabled={totalItems === 0}
                    >
                        <ShoppingBag className="h-5 w-5 mr-2" />
                        Panier
                        {totalItems > 0 && (
                            <Badge className="ml-2 px-2 py-0.5 bg-red-500 text-white">
                                {totalItems}
                            </Badge>
                        )}
                    </Button>
                </div>
            </header>

            {/* Menu */}
            <main className="max-w-3xl mx-auto px-4 py-6">
                {menuData.categories.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">
                            Le menu est en cours de préparation...
                        </p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {menuData.categories.map((category) => (
                            <section key={category.id}>
                                <h2 className="text-2xl font-bold mb-4">{category.name}</h2>

                                {category.products.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                        Aucun produit dans cette catégorie
                                    </p>
                                ) : (
                                    <div className="grid gap-4">
                                        {category.products.map((product) => (
                                            <ProductCard key={product.id} product={product} />
                                        ))}
                                    </div>
                                )}
                            </section>
                        ))}
                    </div>
                )}
            </main>

            {/* Dialog panier */}
            <CartDialog
                open={showCart}
                onOpenChange={setShowCart}
                restaurantId={restaurantId}
                tableId={tableId}
            />
        </div>
    )
}

export function PublicMenu(props: PublicMenuProps) {
    return (
        <CartProvider>
            <MenuContent {...props} />
        </CartProvider>
    )
}