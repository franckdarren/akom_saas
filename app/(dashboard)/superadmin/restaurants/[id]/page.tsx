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
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
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
    createdAt: string
    singpayConfig: {
        enabled: boolean
        isConfigured: boolean
        walletId: string | null
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
        users: restaurantRaw.users.map((user: RestaurantUser) => ({
            ...user,
            role: user.role ?? null,
        })),
    }

    return (
        <>
            {/* Header */}
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <Button variant="ghost" size="sm" asChild>
                        <Link href="/superadmin/restaurants">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Retour
                        </Link>
                    </Button>
                {/* <div className="flex justify-between w-full">
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/superadmin">Administration</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Gestion des Paiements</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div> */}
            </header>

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
