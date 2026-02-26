'use client'

import {useState, useMemo} from 'react'
import {ProductGrid} from '../_components/ProductGrid'
import {Cart} from '../_components/Cart'
import {ShoppingCart, ChevronUp, UtensilsCrossed} from 'lucide-react'
import {Sheet, SheetContent, SheetTrigger} from '@/components/ui/sheet'
import {Separator} from '@/components/ui/separator'
import {SidebarTrigger} from '@/components/ui/sidebar'
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {cn} from '@/lib/utils'
import type {CartItem, POSProduct, POSCategory} from '../_types/index'

interface POSShellProps {
    categories: POSCategory[]
    restaurantId: string
}

export function POSShell({categories, restaurantId}: POSShellProps) {
    const [cart, setCart] = useState<CartItem[]>([])
    const [activeCategory, setActiveCategory] = useState(categories[0]?.id ?? '')
    const [cartOpen, setCartOpen] = useState(false)

    const total = useMemo(
        () => cart.reduce((sum, i) => sum + i.price * i.quantity, 0),
        [cart]
    )
    const itemCount = useMemo(
        () => cart.reduce((sum, i) => sum + i.quantity, 0),
        [cart]
    )

    function addToCart(product: POSProduct) {
        if (product.price == null) return
        setCart(prev => {
            const existing = prev.find(i => i.productId === product.id)
            if (existing) {
                return prev.map(i =>
                    i.productId === product.id
                        ? {...i, quantity: i.quantity + 1}
                        : i
                )
            }
            return [...prev, {
                productId: product.id,
                name: product.name,
                price: product.price as number,
                quantity: 1,
                imageUrl: product.imageUrl,
            }]
        })
    }

    function updateQty(productId: string, qty: number) {
        if (qty <= 0) {
            setCart(prev => prev.filter(i => i.productId !== productId))
        } else {
            setCart(prev =>
                prev.map(i => i.productId === productId ? {...i, quantity: qty} : i)
            )
        }
    }

    function clearCart() {
        setCart([])
        setCartOpen(false)
    }

    const activeProducts = categories.find(c => c.id === activeCategory)?.products ?? []

    return (
        // flex-1 + overflow-hidden pour que la page prenne tout l'espace
        // sans déborder — même pattern que tes autres pages
        <div className="flex flex-1 flex-col overflow-hidden">

            {/* ══════════════════════════════════════════
                HEADER — identique à toutes tes pages
            ══════════════════════════════════════════ */}
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-background">
                <SidebarTrigger className="-ml-1"/>
                <Separator orientation="vertical" className="mr-2 h-4"/>
                <div className="flex w-full items-center justify-between">
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/dashboard">
                                    Dashboard
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator/>
                            <BreadcrumbItem>
                                <BreadcrumbPage>Nouvelle commande</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>

                    {/* Résumé panier visible sur desktop dans le header */}
                    {itemCount > 0 && (
                        <div className="hidden lg:flex items-center gap-2 text-sm text-muted-foreground">
                            <ShoppingCart className="h-4 w-4"/>
                            <span>{itemCount} article{itemCount > 1 ? 's' : ''}</span>
                            <Separator orientation="vertical" className="h-4"/>
                            <span className="font-semibold text-foreground">
                                {total.toLocaleString('fr-FR')} FCFA
                            </span>
                        </div>
                    )}
                </div>
            </header>

            {/* ══════════════════════════════════════════
                CORPS — catalogue + panier côte à côte
            ══════════════════════════════════════════ */}
            <div className="flex flex-1 overflow-hidden">

                {/* ── Colonne gauche : catalogue ── */}
                <div className="flex flex-1 flex-col min-w-0 overflow-hidden">

                    {/* Barre de catégories */}
                    <div className="bg-background border-b shrink-0">
                        <div className="overflow-x-auto scrollbar-none">
                            <div className="flex items-center gap-1.5 px-4 py-3 w-max min-w-full">
                                {categories.length === 0 ? (
                                    <p className="text-sm text-muted-foreground px-2">
                                        Aucune catégorie
                                    </p>
                                ) : (
                                    categories.map(cat => (
                                        <button
                                            key={cat.id}
                                            onClick={() => setActiveCategory(cat.id)}
                                            className={cn(
                                                'flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium',
                                                'transition-all duration-150',
                                                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                                                activeCategory === cat.id
                                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                            )}
                                        >
                                            {cat.name}
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Grille produits — prend tout l'espace restant */}
                    <div className="flex-1 overflow-y-auto bg-muted/20">
                        {categories.length === 0 ? (
                            <EmptyState message="Aucune catégorie de produit configurée."/>
                        ) : activeProducts.length === 0 ? (
                            <EmptyState message="Aucun produit disponible dans cette catégorie."/>
                        ) : (
                            <ProductGrid products={activeProducts} onAdd={addToCart}/>
                        )}
                    </div>
                </div>

                {/* ── Colonne droite : panier desktop (≥ lg) ── */}
                <aside className="hidden lg:flex w-[360px] xl:w-[400px] shrink-0 flex-col border-l bg-background">

                    {/* En-tête panier */}
                    <div className="flex items-center justify-between px-5 py-4 border-b bg-muted/30 shrink-0">
                        <div className="flex items-center gap-2">
                            <ShoppingCart className="h-4 w-4 text-muted-foreground"/>
                            <span className="font-semibold text-sm">Commande en cours</span>
                        </div>
                        {itemCount > 0 && (
                            <span
                                className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-medium">
                                {itemCount} article{itemCount > 1 ? 's' : ''}
                            </span>
                        )}
                    </div>

                    {/* Corps du panier */}
                    <div className="flex-1 overflow-hidden flex flex-col">
                        <Cart
                            items={cart}
                            total={total}
                            onUpdateQty={updateQty}
                            onClear={clearCart}
                            onOrderComplete={clearCart}
                        />
                    </div>
                </aside>
            </div>

            {/* ══════════════════════════════════════════
                BARRE FLOTTANTE — panier mobile (< lg)
                Slide-up depuis le bas, visible si panier non vide
            ══════════════════════════════════════════ */}
            <div className="lg:hidden">
                <Sheet open={cartOpen} onOpenChange={setCartOpen}>
                    <SheetTrigger asChild>
                        <div
                            role="button"
                            tabIndex={0}
                            aria-label="Voir le panier"
                            onKeyDown={e => e.key === 'Enter' && setCartOpen(true)}
                            className={cn(
                                'fixed bottom-0 inset-x-0 z-50 cursor-pointer',
                                'flex items-center justify-between px-5 py-4',
                                'bg-primary text-primary-foreground',
                                'shadow-[0_-2px_16px_rgba(0,0,0,0.15)]',
                                'transition-transform duration-300 ease-out',
                                itemCount > 0 ? 'translate-y-0' : 'translate-y-full'
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <ShoppingCart className="h-5 w-5"/>
                                    <span
                                        className="absolute -top-2 -right-2 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center bg-primary-foreground text-primary">
                                        {itemCount}
                                    </span>
                                </div>
                                <span className="text-sm font-semibold">
                                    {itemCount} article{itemCount > 1 ? 's' : ''}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-bold">
                                    {total.toLocaleString('fr-FR')} FCFA
                                </span>
                                <ChevronUp className="h-4 w-4 opacity-75"/>
                            </div>
                        </div>
                    </SheetTrigger>

                    <SheetContent
                        side="bottom"
                        className="h-[90dvh] rounded-t-2xl p-0 flex flex-col overflow-hidden"
                    >
                        <div className="flex-shrink-0 flex items-center justify-between px-5 pt-5 pb-4 border-b">
                            <div className="flex items-center gap-2">
                                <ShoppingCart className="h-4 w-4 text-muted-foreground"/>
                                <span className="font-semibold text-sm">Commande en cours</span>
                            </div>
                            {itemCount > 0 && (
                                <span
                                    className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                                    {itemCount} article{itemCount > 1 ? 's' : ''}
                                </span>
                            )}
                        </div>
                        <div className="flex-1 overflow-hidden flex flex-col">
                            <Cart
                                items={cart}
                                total={total}
                                onUpdateQty={updateQty}
                                onClear={clearCart}
                                onOrderComplete={() => {
                                    clearCart()
                                    setCartOpen(false)
                                }}
                            />
                        </div>
                    </SheetContent>
                </Sheet>
            </div>

        </div>
    )
}

// ── État vide ───────────────────────────────────────────────
function EmptyState({message}: { message: string }) {
    return (
        <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground py-24">
            <UtensilsCrossed className="h-10 w-10 opacity-25"/>
            <p className="text-sm">{message}</p>
        </div>
    )
}