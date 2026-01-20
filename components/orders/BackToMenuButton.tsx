'use client'

import Link from 'next/link'
import { ArrowLeft, ChefHat } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BackToMenuButtonProps {
    restaurantSlug: string
    tableNumber: number
}

/**
 * Bouton permettant de retourner au menu depuis la page de tracking
 * Utile pour passer une commande complémentaire ou consulter le menu
 */
export function BackToMenuButton({ restaurantSlug, tableNumber }: BackToMenuButtonProps) {
    return (
        <Link href={`/r/${restaurantSlug}/t/${tableNumber}`}>
            <Button 
                variant="outline" 
                className="w-full gap-2"
                size="lg"
            >
                <ChefHat className="w-5 h-5" />
                <span>Retour au menu</span>
            </Button>
        </Link>
    )
}