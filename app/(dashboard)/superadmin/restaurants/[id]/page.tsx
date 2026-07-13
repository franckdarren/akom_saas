import { getRestaurantDetails } from '@/lib/actions/superadmin'
import type { RestaurantUser } from '@/types/restaurant'
import RestaurantDetailsClient from './RestaurantDetailsClient'
import {
    Breadcrumb,
    BreadcrumbList,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbSeparator,
    BreadcrumbPage,
} from '@/components/ui/breadcrumb'
import { Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { AppInsetHeader } from '@/components/layout/AppInsetHeader'
import { ToggleRestaurantStatus } from '@/components/superadmin/ToggleRestaurantStatus'
import { ArrowLeft, Building2, ShoppingCart, TrendingUp } from 'lucide-react'
import Link from 'next/link'

// ----------------------------
// Types
// ----------------------------

export type RestaurantUserType = RestaurantUser

export type RestaurantDetailsType = {
    id: string
    name: string
    slug: string
    phone?: string | null
    address?: string | null
    isActive: boolean
    activityType: string
    createdAt: string
    singpayConfig: {
        enabled: boolean
        isConfigured: boolean
        walletId: string | null
    } | null
    subscription: {
        id: string
        plan: string
        status: string
        trialStartsAt: string
        trialEndsAt: string
        currentPeriodStart: string | null
        currentPeriodEnd: string | null
        activeUsersCount: number
        basePlanPrice: number
        billingCycle: number
        createdAt: string
        payments: {
            id: string
            amount: number
            method: string
            status: string
            billingCycle: number
            createdAt: string
        }[]
    } | null
    _count: {
        products: number
        tables: number
        orders: number
    }
    stats: {
        totalOrders: number
        totalRevenue: number
        ordersThisMonth: number
    }
    users: RestaurantUserType[]
}

function toIsoString(date: Date | string): string {
    return date instanceof Date ? date.toISOString() : date
}

// ----------------------------
// Page
// ----------------------------

interface PageProps {
    params: Promise<{ id?: string }>
}

export default async function RestaurantDetailsPage({ params }: PageProps) {
    // ⚡ On attend le paramètre avant de l’utiliser
    const { id } = await params

    const restaurantRaw = await getRestaurantDetails(id)

    const restaurant: RestaurantDetailsType = {
        ...restaurantRaw,
        createdAt:
            restaurantRaw.createdAt instanceof Date
                ? restaurantRaw.createdAt.toISOString()
                : restaurantRaw.createdAt,
        singpayConfig: restaurantRaw.singpayConfig ?? null,
        subscription: restaurantRaw.subscription
            ? {
                ...restaurantRaw.subscription,
                trialStartsAt: toIsoString(restaurantRaw.subscription.trialStartsAt),
                trialEndsAt: toIsoString(restaurantRaw.subscription.trialEndsAt),
                currentPeriodStart: restaurantRaw.subscription.currentPeriodStart
                    ? toIsoString(restaurantRaw.subscription.currentPeriodStart)
                    : null,
                currentPeriodEnd: restaurantRaw.subscription.currentPeriodEnd
                    ? toIsoString(restaurantRaw.subscription.currentPeriodEnd)
                    : null,
                createdAt: toIsoString(restaurantRaw.subscription.createdAt),
                payments: restaurantRaw.subscription.payments.map((payment) => ({
                    ...payment,
                    createdAt: toIsoString(payment.createdAt),
                })),
            }
            : null,
        users: restaurantRaw.users.map((user: RestaurantUser) => ({
            ...user,
            role: user.role ?? null,
        })),
    }

    return (
        <>
            {/* Header */}
            <AppInsetHeader>
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/superadmin/restaurants">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Retour
                    </Link>
                </Button>
            </AppInsetHeader>

            <div className='layout-page'>
                {/* <div>
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Gestion des Paiements</h1>
                    <p className="text-muted-foreground mt-2">
                        Validez ou refusez les paiements manuels
                    </p>
                </div> */}

                <RestaurantDetailsClient restaurant={restaurant} />

            </div>
        </>
    )
}
