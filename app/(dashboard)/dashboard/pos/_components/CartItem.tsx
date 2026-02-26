'use client'
import {Minus, Plus} from 'lucide-react'
import type {CartItem} from '../_types'

export function CartItem({item, onUpdate}: { item: CartItem, onUpdate: (id: string, qty: number) => void }) {
    return (
        <div className="flex items-center gap-3 p-2 rounded-lg border bg-muted/30">
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.name}</p>
                <p className="text-xs text-muted-foreground">{item.price.toLocaleString()} FCFA</p>
            </div>
            <div className="flex items-center gap-2">
                <button onClick={() => onUpdate(item.productId, item.quantity - 1)}
                        className="w-6 h-6 rounded-full border flex items-center justify-center hover:bg-muted">
                    <Minus className="h-3 w-3"/>
                </button>
                <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                <button onClick={() => onUpdate(item.productId, item.quantity + 1)}
                        className="w-6 h-6 rounded-full border flex items-center justify-center hover:bg-muted">
                    <Plus className="h-3 w-3"/>
                </button>
            </div>
            <p className="text-sm font-semibold w-16 text-right">
                {(item.price * item.quantity).toLocaleString()}
            </p>
        </div>
    )
}