// app/r/[slug]/t/[number]/components/restaurant-header.tsx
'use client'

import Image from 'next/image'
import { CartButton } from './cart-button'

interface RestaurantHeaderProps {
    restaurantName: string
    coverImageUrl?: string | null
    itemCount: number
    onCartClick: () => void
}

export function RestaurantHeader({
    restaurantName,
    coverImageUrl,
    itemCount,
    onCartClick,
}: RestaurantHeaderProps) {
    // Image placeholder (celle de ta maquette)
    const defaultCover = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop'

    return (
        <div className="relative h-48 md:h-64 w-full">
            {/* Image de fond */}
            <div className="absolute inset-0">
                <Image
                    src={coverImageUrl || defaultCover}
                    alt={restaurantName}
                    fill
                    className="object-cover"
                    priority
                />
                {/* Overlay sombre */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/60" />
            </div>

            {/* Nom du restaurant (optionnel, sur l'image) */}
            {/* <div className="absolute bottom-10 left-4 right-4">
                <h1 className="text-white text-2xl md:text-3xl font-bold drop-shadow-lg">
                    {restaurantName}
                </h1>
            </div> */}

            {/* Bouton panier fixé en haut à droite */}
            <div className="absolute top-4 right-4 z-10">
                <CartButton itemCount={itemCount} onClick={onCartClick} />
            </div>
        </div>
    )
}