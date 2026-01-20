// app/r/[slug]/t/[number]/public-menu.tsx
'use client'

import { CartProvider } from './cart-context'
import { MenuLayout } from './components/menu-layout'
import { ActiveOrdersBanner } from '@/components/menu/ActiveOrdersBanner'

interface PublicMenuProps {
    restaurantId: string
    restaurantName: string
    restaurantSlug: string
    tableId: string
    tableNumber: number
}

export function PublicMenu({
    restaurantId,
    restaurantSlug,
    tableId,
    tableNumber,
}: PublicMenuProps) {
    return (
        <CartProvider>
            <MenuLayout
                restaurantId={restaurantId}
                restaurantSlug={restaurantSlug}
                tableId={tableId}
                tableNumber={tableNumber}
            />
        </CartProvider>
    )
}