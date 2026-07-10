// app/r/[slug]/t/[number]/public-menu.tsx
'use client'

import { CartProvider } from './cart-context'
import { MenuLayout } from './components/menu-layout'
import type { PublicMenuData } from '@/lib/data/public-menu'

interface PublicMenuProps {
    restaurantId: string
    restaurantName: string
    restaurantSlug: string
    tableId: string
    tableNumber: number
    initialMenuData: PublicMenuData
}

export function PublicMenu({
    restaurantId,
    restaurantSlug,
    tableId,
    tableNumber,
    initialMenuData,
}: PublicMenuProps) {
    return (
        <CartProvider>
            <MenuLayout
                restaurantId={restaurantId}
                restaurantSlug={restaurantSlug}
                tableId={tableId}
                tableNumber={tableNumber}
                initialMenuData={initialMenuData}
            />
        </CartProvider>
    )
}