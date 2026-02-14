// components/warehouse/WarehouseMovementsTimeline.tsx
'use client'

import { TrendingUp, TrendingDown, Package, Edit, AlertCircle } from 'lucide-react'
import { WarehouseMovement } from '@/types/warehouse'

interface WarehouseMovementsTimelineProps {
    movements: WarehouseMovement[]
}

/**
 * Timeline visuelle des mouvements de stock d'entrepôt.
 * 
 * Affiche chaque mouvement avec :
 * - Une icône colorée selon le type
 * - La date et l'heure
 * - La quantité et le changement de stock
 * - Les métadonnées (fournisseur, destination, raison)
 * - L'auteur de l'action
 * 
 * Design inspiré de GitHub Activity Feed et Linear Activity Log.
 */
export function WarehouseMovementsTimeline({ movements }: WarehouseMovementsTimelineProps) {
    if (movements.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-8 text-center">
                <Package className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">
                    Aucun mouvement de stock enregistré
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {movements.map((movement, index) => (
                <MovementItem
                    key={movement.id}
                    movement={movement}
                    isLast={index === movements.length - 1}
                />
            ))}
        </div>
    )
}

/**
 * Composant pour un item de mouvement individuel.
 */
function MovementItem({
    movement,
    isLast
}: {
    movement: WarehouseMovement
    isLast: boolean
}) {
    const config = getMovementConfig(movement.movementType)
    const isNegative = movement.quantity < 0

    return (
        <div className="relative flex gap-4 pb-4">
            {/* Ligne verticale de connexion */}
            {!isLast && (
                <div className="absolute left-[19px] top-10 w-[2px] h-full bg-border" />
            )}

            {/* Icône du type de mouvement */}
            <div className={`relative z-10 flex-shrink-0 w-10 h-10 rounded-full ${config.bgColor} flex items-center justify-center`}>
                <config.icon className={`h-5 w-5 ${config.iconColor}`} />
            </div>

            {/* Contenu du mouvement */}
            <div className="flex-1 min-w-0 pt-1">
                <div className="flex items-start justify-between gap-4">
                    {/* Description du mouvement */}
                    <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">
                            {config.label}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {formatDate(movement.createdAt)}
                        </p>
                    </div>

                    {/* Quantité */}
                    <div className="text-right">
                        <p className={`font-bold text-lg ${isNegative ? 'text-red-600' : 'text-green-600'}`}>
                            {isNegative ? '' : '+'}{movement.quantity}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Stock: {movement.newQty}
                        </p>
                    </div>
                </div>

                {/* Métadonnées spécifiques au type de mouvement */}
                {(movement.supplierName || movement.invoiceReference || movement.destination || movement.reason) && (
                    <div className="mt-2 p-3 rounded-lg border bg-muted/50 text-sm space-y-1">
                        {movement.supplierName && (
                            <p className="text-muted-foreground">
                                <strong>Fournisseur:</strong> {movement.supplierName}
                            </p>
                        )}
                        {movement.invoiceReference && (
                            <p className="text-muted-foreground font-mono text-xs">
                                <strong>Facture:</strong> {movement.invoiceReference}
                            </p>
                        )}
                        {movement.destination && (
                            <p className="text-muted-foreground">
                                <strong>Destination:</strong> {movement.destination}
                            </p>
                        )}
                        {movement.reason && (
                            <p className="text-muted-foreground">
                                <strong>Raison:</strong> {movement.reason}
                            </p>
                        )}
                    </div>
                )}

                {/* Notes optionnelles */}
                {movement.notes && (
                    <p className="mt-2 text-sm text-muted-foreground italic">
                        "{movement.notes}"
                    </p>
                )}
            </div>
        </div>
    )
}

/**
 * Configuration visuelle selon le type de mouvement.
 */
function getMovementConfig(type: string) {
    const configs = {
        entry: {
            icon: TrendingUp,
            iconColor: 'text-blue-600 dark:text-blue-400',
            bgColor: 'bg-blue-100 dark:bg-blue-900/20',
            label: 'Entrée de stock',
        },
        exit: {
            icon: TrendingDown,
            iconColor: 'text-orange-600 dark:text-orange-400',
            bgColor: 'bg-orange-100 dark:bg-orange-900/20',
            label: 'Sortie de stock',
        },
        transfer_to_ops: {
            icon: Package,
            iconColor: 'text-green-600 dark:text-green-400',
            bgColor: 'bg-green-100 dark:bg-green-900/20',
            label: 'Transfert vers restaurant',
        },
        adjustment: {
            icon: Edit,
            iconColor: 'text-purple-600 dark:text-purple-400',
            bgColor: 'bg-purple-100 dark:bg-purple-900/20',
            label: 'Ajustement d\'inventaire',
        },
        loss: {
            icon: AlertCircle,
            iconColor: 'text-red-600 dark:text-red-400',
            bgColor: 'bg-red-100 dark:bg-red-900/20',
            label: 'Perte ou casse',
        },
    }

    return configs[type as keyof typeof configs] || configs.adjustment
}

/**
 * Formate une date de manière lisible.
 */
function formatDate(date: Date): string {
    const d = new Date(date)
    const now = new Date()
    const diffInHours = (now.getTime() - d.getTime()) / (1000 * 60 * 60)

    // Si c'est aujourd'hui
    if (diffInHours < 24 && d.getDate() === now.getDate()) {
        return `Aujourd'hui à ${d.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        })}`
    }

    // Si c'est hier
    if (diffInHours < 48 && d.getDate() === now.getDate() - 1) {
        return `Hier à ${d.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        })}`
    }

    // Sinon, date complète
    return d.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
        hour: '2-digit',
        minute: '2-digit',
    })
}