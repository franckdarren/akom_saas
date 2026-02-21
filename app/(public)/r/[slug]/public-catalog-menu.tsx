// app/(public)/r/[slug]/public-catalog-menu.tsx
'use client'

import {useState} from 'react'
import {MenuLayout} from './t/[number]/components/menu-layout'
import {CartProvider} from './t/[number]/cart-context'
import {CatalogCartDialog} from './catalog-cart-dialog'

/**
 * Menu catalogue public
 *
 * Ce composant réutilise intégralement le MenuLayout existant du menu QR table,
 * car l'expérience de navigation dans le menu doit être identique.
 *
 * La seule différence est au moment du checkout : puisqu'il n'y a pas de table,
 * on utilise CatalogCartDialog au lieu de CartDialog pour demander le fulfillment.
 */

interface PublicCatalogMenuProps {
    restaurantId: string
    restaurantSlug: string
    restaurantName: string
    restaurantAddress: string | null
    restaurantPhone: string | null
    coverImageUrl: string | null
    logoUrl: string | null
}

export function PublicCatalogMenu(props: PublicCatalogMenuProps) {
    const [showCart, setShowCart] = useState(false)

    return (
        <CartProvider>
            {/*
                On réutilise MenuLayout tel quel.
                On passe tableId=null et tableNumber=0 car il n'y a pas de table.
                MenuLayout va afficher le menu, gérer la recherche, les filtres, etc.
            */}
            <MenuLayout
                restaurantId={props.restaurantId}
                restaurantSlug={props.restaurantSlug}
                tableId={null as any} // Pas de table dans le contexte catalogue
                tableNumber={0} // Pas de numéro de table
            />

            {/*
                Le CartDialog personnalisé pour le catalogue public.
                Il reprend le design du CartDialog existant mais ajoute
                l'étape de sélection du fulfillment avant validation.
            */}
            <CatalogCartDialog
                restaurantSlug={props.restaurantSlug}
                restaurantName={props.restaurantName}
                open={showCart}
                onOpenChange={setShowCart}
            />
        </CartProvider>
    )
}