// app/(dashboard)/dashboard/pos/_types/index.ts

export interface POSProduct {
    id: string
    name: string
    price: number | null   // null = produit sur devis
    imageUrl: string | null
    isAvailable: boolean
    hasStock: boolean
}

export interface POSCategory {
    id: string
    name: string
    products: POSProduct[]
}

export interface CartItem {
    productId: string
    name: string
    price: number
    quantity: number
    imageUrl?: string | null
}

export type POSPaymentMethod = 'cash' | 'airtel_money' | 'moov_money'

export interface POSOrderPayload {
    items: CartItem[]
    paymentMethod: POSPaymentMethod
    amountPaid: number
    note?: string
}