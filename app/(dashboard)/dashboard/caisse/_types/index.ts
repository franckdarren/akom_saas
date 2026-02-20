// app/dashboard/caisse/_types/index.ts
import type {Prisma} from '@prisma/client'

export type SessionWithRelations = Prisma.CashSessionGetPayload<{
    include: {
        manualRevenues: {
            include: { product: { select: { name: true } } }
        }
        expenses: {
            include: { product: { select: { name: true } } }
        }
    }
}>

export type SessionSummary = {
    id: string
    sessionDate: Date
    status: 'open' | 'closed'
    isHistorical: boolean
    openingBalance: number
    closingBalance: number | null
    theoreticalBalance: number | null
    balanceDifference: number | null
}

export type ProductWithStock = Prisma.ProductGetPayload<{
    include: { stock: true }
}>

export type BalanceData = {
    session: SessionWithRelations
    revenues: {
        manual: number
        akom: number
        total: number
        byMethod: { paymentMethod: string; _sum: { totalAmount: number | null } }[]
    }
    expenses: {
        total: number
        byMethod: { paymentMethod: string; _sum: { amount: number | null } }[]
        byCategory: { category: string; _sum: { amount: number | null } }[]
    }
    balance: {
        opening: number
        theoretical: number
        theoreticalCash: number
        actual: number | null
        difference: number | null
    }
}