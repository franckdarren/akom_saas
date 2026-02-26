'use client'
import {useState} from 'react'
import {Trash2, ShoppingCart} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {CartItem as CartItemComp} from './CartItem'
import {PaymentDialog} from './PaymentDialog'
import type {CartItem} from '../_types'

interface CartProps {
    items: CartItem[]
    total: number
    onUpdateQty: (id: string, qty: number) => void
    onClear: () => void
    onOrderComplete: () => void
}

export function Cart({items, total, onUpdateQty, onClear, onOrderComplete}: CartProps) {
    const [showPayment, setShowPayment] = useState(false)

    return (
        <div className="w-80 xl:w-96 flex flex-col bg-background">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
                {/*    <div className="flex items-center gap-2">*/}
                {/*        <ShoppingCart className="h-4 w-4"/>*/}
                {/*        <span className="font-semibold">Commande</span>*/}
                {/*        {items.length > 0 && (*/}
                {/*            <span*/}
                {/*                className="bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">*/}
                {/*  {items.reduce((s, i) => s + i.quantity, 0)}*/}
                {/*</span>*/}
                {/*        )}*/}
                {/*    </div>*/}
                {items.length > 0 && (
                    <button onClick={onClear}
                            className="border p-2 rounded-lg text-foreground hover:text-destructive hover:border-destructive transition flex gap-2 items-center ali">
                        <span className="font-semibold">Annuler</span><Trash2 className="h-4 w-4"/>
                    </button>
                )}
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                        <ShoppingCart className="h-10 w-10 opacity-20"/>
                        <p className="text-sm">Panier vide</p>
                    </div>
                ) : (
                    items.map(item => (
                        <CartItemComp key={item.productId} item={item} onUpdate={onUpdateQty}/>
                    ))
                )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t space-y-3">
                <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">Total</span>
                    <span className="text-xl font-bold">{total.toLocaleString()} FCFA</span>
                </div>
                <Button
                    className="w-full"
                    size="lg"
                    disabled={items.length === 0}
                    onClick={() => setShowPayment(true)}
                >
                    Encaisser
                </Button>
            </div>

            <PaymentDialog
                open={showPayment}
                onClose={() => setShowPayment(false)}
                items={items}
                total={total}
                onSuccess={() => {
                    setShowPayment(false)
                    onOrderComplete()
                }}
            />
        </div>
    )
}