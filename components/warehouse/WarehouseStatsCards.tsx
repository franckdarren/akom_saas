// components/warehouse/WarehouseStatsCards.tsx
'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Package, DollarSign, AlertTriangle, Calendar } from 'lucide-react'
import { WarehouseStats } from '@/types/warehouse'
import { formatPrice } from '@/lib/utils/format'

interface WarehouseStatsCardsProps {
    stats: WarehouseStats | null
}

/**
 * Affiche 4 cartes KPI pour le dashboard entrepôt.
 * 
 * Inspiré de Shopify Admin et Odoo pour le design visuel.
 * Chaque carte affiche une métrique clé avec une icône colorée.
 */
export function WarehouseStatsCards({ stats }: WarehouseStatsCardsProps) {
    if (!stats) {
        return null
    }

    const cards = [
        {
            title: 'Produits en stock',
            value: stats.totalProducts,
            icon: Package,
            iconColor: 'text-blue-600 dark:text-blue-400',
            bgColor: 'bg-blue-100 dark:bg-blue-900/20',
            description: `${stats.totalProducts} références différentes`,
        },
        {
            title: 'Valeur totale',
            value: formatPrice(stats.totalValue),
            icon: DollarSign,
            iconColor: 'text-green-600 dark:text-green-400',
            bgColor: 'bg-green-100 dark:bg-green-900/20',
            description: `Moyenne ${formatPrice(stats.averageStockValue)} par produit`,
        },
        {
            title: 'Alertes stock bas',
            value: stats.lowStockCount,
            icon: AlertTriangle,
            iconColor: stats.lowStockCount > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400',
            bgColor: stats.lowStockCount > 0 ? 'bg-orange-100 dark:bg-orange-900/20' : 'bg-gray-100 dark:bg-gray-800',
            description: stats.lowStockCount > 0
                ? `${stats.lowStockCount} ${stats.lowStockCount === 1 ? 'produit' : 'produits'} à réapprovisionner`
                : 'Tous les produits ont un stock suffisant',
        },
        {
            title: 'Dernier inventaire',
            value: stats.lastInventoryDate
                ? new Date(stats.lastInventoryDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
                : 'Jamais',
            icon: Calendar,
            iconColor: 'text-purple-600 dark:text-purple-400',
            bgColor: 'bg-purple-100 dark:bg-purple-900/20',
            description: stats.lastInventoryDate
                ? `Fait il y a ${getDaysSince(stats.lastInventoryDate)} jours`
                : 'Aucun inventaire enregistré',
        },
    ]

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {cards.map((card, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <p className="text-sm font-medium text-muted-foreground">
                                    {card.title}
                                </p>
                                <p className="text-2xl font-bold mt-2">
                                    {card.value}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {card.description}
                                </p>
                            </div>

                            <div className={`p-3 rounded-lg ${card.bgColor}`}>
                                <card.icon className={`h-5 w-5 ${card.iconColor}`} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}

/**
 * Calcule le nombre de jours depuis une date donnée.
 */
function getDaysSince(date: Date): number {
    const now = new Date()
    const diff = now.getTime() - new Date(date).getTime()
    return Math.floor(diff / (1000 * 60 * 60 * 24))
}