// app/(dashboard)/dashboard/warehouse/transfers/page.tsx
import {Metadata} from 'next'
import {Suspense} from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {Package, ArrowRight} from 'lucide-react'

import {Button} from '@/components/ui/button'
import {Card} from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Breadcrumb,
    BreadcrumbList,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {Separator} from '@/components/ui/separator'
import {SidebarTrigger} from '@/components/ui/sidebar'
import {Badge} from '@/components/ui/badge'
import {getCurrentUserAndRestaurant} from '@/lib/auth/session'
import {FeatureGuard} from '@/components/guards/FeatureGuard'
import prisma from '@/lib/prisma'

export const metadata: Metadata = {
    title: 'Historique des transferts | Akôm',
    description: 'Suivi de tous les transferts du magasin vers le stock opérationnel',
}

export default async function WarehouseTransfersPage() {
    const {restaurantId} = await getCurrentUserAndRestaurant()

    // Récupérer tous les transferts
    const transfers = await prisma.warehouseToOpsTransfer.findMany({
        where: {restaurantId},
        include: {
            warehouseProduct: {
                select: {
                    id: true,
                    name: true,
                    imageUrl: true,
                    storageUnit: true,
                },
            },
            opsProduct: {
                select: {
                    id: true,
                    name: true,
                    imageUrl: true,
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
        take: 100,
    })

    const totalTransfers = transfers.length
    const last7Days = transfers.filter(t => {
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        return new Date(t.createdAt) >= weekAgo
    }).length

    // ============================================================
    // PROTECTION : Vérifier que l'utilisateur a accès au module warehouse
    // ============================================================

    return (
        <FeatureGuard
            restaurantId={restaurantId}
            requiredFeature="warehouse_module"
            showError={true}
        >
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1"/>
                <Separator orientation="vertical" className="mr-2 h-4"/>
                <div className="flex justify-between w-full">
                    <div className='my-auto'>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/dashboard/warehouse">Magasin</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator/>
                            <BreadcrumbItem>
                                <BreadcrumbPage>Historique des transferts</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </div>
                </div>
            </header>

            <div className="flex flex-1 flex-col gap-4 p-4">
                {/* Reste du contenu inchangé */}
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold tracking-tight">
                                Historique des transferts
                            </h1>
                        </div>
                        <p className="text-muted-foreground mt-1">
                            Tous les transferts du magasin vers votre stock opérationnel
                        </p>
                    </div>
                </div>

                {/* Statistiques et tableau - contenu identique */}
                {/* ... (garder tout le reste du code inchangé) ... */}
            </div>
        </FeatureGuard>
    )
}