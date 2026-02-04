import { getRestaurantDetails } from '@/lib/actions/superadmin'
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

export type RestaurantUserType = {
    id: string
    userId: string
    role: string
    createdAt: Date
}

export type RestaurantDetailsType = {
    id: string
    name: string
    slug: string
    phone?: string | null
    address?: string | null
    isActive: boolean
    createdAt: string
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
    params: { id?: string }
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
        users: restaurantRaw.users.map((user: any) => ({
            ...user,
            role: user.role ?? '',
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

            <div className='flex flex-col gap-6 p-6'>
                {/* <div>
                    <h1 className="text-3xl font-bold tracking-tight">Gestion des Paiements</h1>
                    <p className="text-muted-foreground mt-2">
                        Validez ou refusez les paiements manuels
                    </p>
                </div> */}

                <RestaurantDetailsClient restaurant={restaurant} />

            </div>
        </>
    )
}
