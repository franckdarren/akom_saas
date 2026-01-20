// app/r/[slug]/t/[number]/components/restaurant-info.tsx
'use client'

import { MapPin, Phone } from 'lucide-react'
import { Card } from '@/components/ui/card'

interface RestaurantInfoProps {
    restaurantName: string
    address?: string | null
    phone?: string | null
    tableNumber: number
}

export function RestaurantInfo({
    restaurantName,
    address,
    phone,
    tableNumber,
}: RestaurantInfoProps) {
    return (
        <div className="mx-4 -mt-8 relative z-10 shadow-lg bg-white rounded max-w-3xl mx-auto">
            <div className="p-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold">Menu du jour</h2>
                    {/* Numéro de table */}
                    <div className="bg-primary/10 px-3 py-1.5 rounded-full my-auto">
                        <span className="text-sm font-semibold text-primary">
                            Table {tableNumber}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}