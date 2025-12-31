// app/r/[slug]/t/[number]/cart-context.tsx
'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

export interface CartItem {
    productId: string
    name: string
    price: number
    quantity: number
    imageUrl?: string | null
}

interface CartContextType {
    items: CartItem[]
    addItem: (item: Omit<CartItem, 'quantity'>) => void
    removeItem: (productId: string) => void
    updateQuantity: (productId: string, quantity: number) => void
    clearCart: () => void
    totalItems: number
    totalAmount: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([])

    // Ajouter un produit (ou incrémenter si existe déjà)
    const addItem = (newItem: Omit<CartItem, 'quantity'>) => {
        setItems((prev) => {
            const existing = prev.find((item) => item.productId === newItem.productId)

            if (existing) {
                // Incrémenter la quantité
                return prev.map((item) =>
                    item.productId === newItem.productId
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                )
            }

            // Ajouter un nouvel item
            return [...prev, { ...newItem, quantity: 1 }]
        })
    }

    // Retirer complètement un produit
    const removeItem = (productId: string) => {
        setItems((prev) => prev.filter((item) => item.productId !== productId))
    }

    // Mettre à jour la quantité (ou retirer si 0)
    const updateQuantity = (productId: string, quantity: number) => {
        if (quantity <= 0) {
            removeItem(productId)
            return
        }

        setItems((prev) =>
            prev.map((item) =>
                item.productId === productId ? { ...item, quantity } : item
            )
        )
    }

    // Vider le panier
    const clearCart = () => {
        setItems([])
    }

    // Calculer le nombre total d'items
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)

    // Calculer le montant total
    const totalAmount = items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
    )

    return (
        <CartContext.Provider
            value={{
                items,
                addItem,
                removeItem,
                updateQuantity,
                clearCart,
                totalItems,
                totalAmount,
            }}
        >
            {children}
        </CartContext.Provider>
    )
}

// Hook pour utiliser le cart dans les composants
export function useCart() {
    const context = useContext(CartContext)
    if (!context) {
        throw new Error('useCart doit être utilisé dans un CartProvider')
    }
    return context
}