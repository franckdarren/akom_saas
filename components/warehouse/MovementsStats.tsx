// components/warehouse/MovementsStats.tsx
import { Card, CardContent } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Package, Activity } from 'lucide-react'

interface MovementsStatsProps {
    stats: {
        totalMovements: number
        entries: number
        exits: number
        transfers: number
        adjustments: number
        totalQuantityIn: number
        totalQuantityOut: number
    }
}

/**
 * Cartes de statistiques pour la page des mouvements.
 * 
 * Affiche un résumé des mouvements sur la période filtrée :
 * - Total des mouvements
 * - Nombre d'entrées
 * - Nombre de sorties/transferts
 * - Nombre d'ajustements
 * 
 * Design cohérent avec les autres stats cards du module.
 */
export function MovementsStats({ stats }: MovementsStatsProps) {
    const cards = [
        {
            title: 'Total mouvements',
            value: stats.totalMovements,
            icon: Activity,
            iconColor: 'text-gray-600 dark:text-gray-400',
            bgColor: 'bg-gray-100 dark:bg-gray-800',
            description: 'Sur la période sélectionnée',
        },
        {
            title: 'Entrées de stock',
            value: stats.entries,
            icon: TrendingUp,
            iconColor: 'text-blue-600 dark:text-blue-400',
            bgColor: 'bg-blue-100 dark:bg-blue-900/20',
            description: `+${stats.totalQuantityIn} unités au total`,
        },
        {
            title: 'Sorties et transferts',
            value: stats.exits + stats.transfers,
            icon: TrendingDown,
            iconColor: 'text-orange-600 dark:text-orange-400',
            bgColor: 'bg-orange-100 dark:bg-orange-900/20',
            description: `${stats.totalQuantityOut} unités au total`,
        },
        {
            title: 'Ajustements',
            value: stats.adjustments,
            icon: Package,
            iconColor: 'text-purple-600 dark:text-purple-400',
            bgColor: 'bg-purple-100 dark:bg-purple-900/20',
            description: 'Inventaires et corrections',
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