// app/(dashboard)/dashboard/pos/_types/index.ts

export interface POSProduct {
    id: string
    name: string
    price: number | null  // null = produit sur devis
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

// ── Mode de commande POS ─────────────────────────────────────────────
//
// pay_now   : Le client paie immédiatement à la commande.
//             Cas typique → fast-food, vente à emporter, achat direct.
//             → Paiement créé avec status = paid
//             → Stock décrémenté à la création (stockDeducted = true)
//             → Statut initial = pending (la caissière peut le passer
//               directement à "delivered" en un clic)
//
// pay_later : Le client commande, est servi, puis paie.
//             Cas typique → restaurant avec service à table.
//             → Paiement créé avec status = pending
//             → Stock décrémenté par le trigger SQL (pending → preparing)
//             → La caissière utilise "Encaisser" quand le client est prêt
//
export type POSOrderMode = 'pay_now' | 'pay_later'

export interface POSOrderPayload {
    items: CartItem[]
    mode: POSOrderMode

    // Obligatoire uniquement si mode = 'pay_now'
    paymentMethod?: POSPaymentMethod

    // Label affiché sur la commande (ex: "Table 3", "À emporter", "Comptoir")
    tableLabel?: string

    note?: string
}