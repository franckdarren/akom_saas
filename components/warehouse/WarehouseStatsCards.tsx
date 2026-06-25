// components/warehouse/WarehouseStatsCards.tsx
'use client'

import { AppCard, CardContent } from '@/components/ui/app-card'
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
            iconColor: 'text-info',
            bgColor: 'bg-info-subtle',
            description: `${stats.totalProducts} références différentes`,
        },
        {
            title: 'Valeur totale',
            value: formatPrice(stats.totalValue),
            icon: DollarSign,
            iconColor: 'text-success',
            bgColor: 'bg-success-subtle',
            description: `Moyenne ${formatPrice(stats.averageStockValue)} par produit`,
        },
        {
            title: 'Alertes stock bas',
            value: stats.lowStockCount,
            icon: AlertTriangle,
            iconColor: stats.lowStockCount > 0 ? 'text-warning' : 'text-muted-foreground',
            bgColor: stats.lowStockCount > 0 ? 'bg-warning-subtle' : 'bg-muted',
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
            iconColor: 'text-chart-5',
            bgColor: 'bg-chart-5/10',
            description: stats.lastInventoryDate
                ? `Fait il y a ${getDaysSince(stats.lastInventoryDate)} jours`
                : 'Aucun inventaire enregistré',
        },
    ]

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {cards.map((card, index) => (
                <AppCard key={index} variant="stat">
                    <CardContent>
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
                </AppCard>
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