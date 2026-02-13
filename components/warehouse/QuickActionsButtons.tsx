// components/warehouse/QuickActionsButtons.tsx
'use client'

import { useState } from 'react'
import { TrendingUp, Package, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WarehouseProduct, WarehouseStock } from '@/types/warehouse'
import { TransferModal } from './TransferModal'
import { StockEntryModal } from './StockEntryModal'
import { StockAdjustmentModal } from './StockAdjustmentModal'

interface QuickActionsButtonsProps {
    product: WarehouseProduct & {
        stock: WarehouseStock[]
        linkedProduct?: {
            id: string
            name: string
            imageUrl: string | null
            stock: Array<{ quantity: number }>
        }
    }
    stock: WarehouseStock
}

/**
 * Boutons d'actions rapides pour la page de détail d'un produit.
 * 
 * Affiche 3 actions principales selon le contexte :
 * - Entrée de stock (toujours disponible)
 * - Transfert vers restaurant (si produit lié configuré)
 * - Ajustement inventaire (toujours disponible)
 * 
 * Chaque bouton ouvre le modal correspondant pour effectuer l'action.
 */
export function QuickActionsButtons({ product, stock }: QuickActionsButtonsProps) {
    const [activeModal, setActiveModal] = useState<'entry' | 'transfer' | 'adjust' | null>(null)

    const productWithStock = {
        ...product,
        stock,
        isLowStock: stock.quantity < stock.alertThreshold,
        linkedProduct: product.linkedProduct ? {
            ...product.linkedProduct,
            currentStock: product.linkedProduct.stock[0]?.quantity || 0,
        } : undefined,
    }

    return (
        <>
            <div>
                <h3 className="font-semibold mb-3">Actions rapides</h3>
                <div className="flex flex-wrap gap-3">
                    {/* Entrée de stock */}
                    <Button
                        onClick={() => setActiveModal('entry')}
                        variant="outline"
                        className="gap-2"
                    >
                        <TrendingUp className="h-4 w-4" />
                        Entrée de stock
                    </Button>

                    {/* Transfert (visible uniquement si produit lié) */}
                    {product.linkedProduct && (
                        <Button
                            onClick={() => setActiveModal('transfer')}
                            variant="default"
                            className="gap-2"
                        >
                            <Package className="h-4 w-4" />
                            Transférer au restaurant
                        </Button>
                    )}

                    {/* Ajustement */}
                    <Button
                        onClick={() => setActiveModal('adjust')}
                        variant="outline"
                        className="gap-2"
                    >
                        <Edit className="h-4 w-4" />
                        Ajuster inventaire
                    </Button>
                </div>
            </div>

            {/* Modals */}
            {activeModal === 'entry' && (
                <StockEntryModal
                    warehouseProduct={productWithStock}
                    onClose={() => setActiveModal(null)}
                    onSuccess={() => setActiveModal(null)}
                />
            )}

            {activeModal === 'transfer' && product.linkedProduct && (
                <TransferModal
                    warehouseProduct={productWithStock}
                    onClose={() => setActiveModal(null)}
                    onSuccess={() => setActiveModal(null)}
                />
            )}

            {activeModal === 'adjust' && (
                <StockAdjustmentModal
                    warehouseProduct={productWithStock}
                    onClose={() => setActiveModal(null)}
                    onSuccess={() => setActiveModal(null)}
                />
            )}
        </>
    )
}