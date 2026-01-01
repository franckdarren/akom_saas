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
        <div className="mx-4 -mt-8 relative z-10 shadow-lg bg-white rounded">
            <div className="p-4">
                <div className="flex justify-between items-start">
                    {/* <div className="flex-1">
                        <h2 className="text-xl font-bold">{restaurantName}</h2>
                        
                        <div className="flex flex-col gap-2 mt-3 text-sm text-muted-foreground">
                            {address && (
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 flex-shrink-0" />
                                    <span>{address}</span>
                                </div>
                            )}
                            
                            {phone && (
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 flex-shrink-0" />
                                    <span>{phone}</span>
                                </div>
                            )}
                        </div>
                    </div> */}
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