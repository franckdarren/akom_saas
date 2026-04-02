// app/(dashboard)/dashboard/warehouse/transfers/page.tsx
import {Metadata} from 'next'
import Image from 'next/image'
import {Package, ArrowRight, ArrowLeftRight} from 'lucide-react'

import {AppCard, CardContent, CardHeader, CardTitle} from '@/components/ui/app-card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
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
import {BackToWarehouseButton} from './back-button'
import {PageHeader} from '@/components/ui/page-header'

export const metadata: Metadata = {
    title: 'Historique des transferts | Akôm',
    description: 'Suivi de tous les transferts du magasin vers le stock opérationnel',
}

function formatDate(date: Date) {
    return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(date))
}

export default async function WarehouseTransfersPage() {
    const {restaurantId} = await getCurrentUserAndRestaurant()

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

            <div className="layout-page">
                <PageHeader
                    title="Historique des transferts"
                    description="Tous les transferts du magasin vers votre stock opérationnel"
                    action={<BackToWarehouseButton/>}
                />

                {totalTransfers === 0 ? (
                    <div className="flex flex-1 items-center justify-center">
                        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
                            <div className="rounded-full bg-muted p-6">
                                <ArrowLeftRight className="h-10 w-10 text-muted-foreground"/>
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold">Aucun transfert effectué</h2>
                                <p className="text-muted-foreground text-sm mt-1">
                                    Les transferts du magasin vers le stock opérationnel apparaîtront ici.
                                </p>
                            </div>
                            <BackToWarehouseButton/>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="grid gap-4 md:grid-cols-2">
                            <AppCard>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">
                                        Total des transferts
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-2xl font-bold">{totalTransfers}</p>
                                </CardContent>
                            </AppCard>
                            <AppCard>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">
                                        7 derniers jours
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-2xl font-bold">{last7Days}</p>
                                </CardContent>
                            </AppCard>
                        </div>

                        <AppCard>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Produit magasin</TableHead>
                                        <TableHead></TableHead>
                                        <TableHead>Produit opérationnel</TableHead>
                                        <TableHead className="text-right">Quantité</TableHead>
                                        <TableHead className="text-right">Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transfers.map((transfer) => (
                                        <TableRow key={transfer.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    {transfer.warehouseProduct.imageUrl ? (
                                                        <Image
                                                            src={transfer.warehouseProduct.imageUrl}
                                                            alt={transfer.warehouseProduct.name}
                                                            width={32}
                                                            height={32}
                                                            className="rounded object-cover"
                                                        />
                                                    ) : (
                                                        <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                                                            <Package className="h-4 w-4 text-muted-foreground"/>
                                                        </div>
                                                    )}
                                                    <span className="font-medium">{transfer.warehouseProduct.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <ArrowRight className="h-4 w-4 text-muted-foreground"/>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    {transfer.opsProduct.imageUrl ? (
                                                        <Image
                                                            src={transfer.opsProduct.imageUrl}
                                                            alt={transfer.opsProduct.name}
                                                            width={32}
                                                            height={32}
                                                            className="rounded object-cover"
                                                        />
                                                    ) : (
                                                        <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                                                            <Package className="h-4 w-4 text-muted-foreground"/>
                                                        </div>
                                                    )}
                                                    <span>{transfer.opsProduct.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Badge variant="secondary">
                                                    {transfer.warehouseQuantity.toString()} {transfer.warehouseProduct.storageUnit} → {transfer.opsQuantity.toString()}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right text-muted-foreground text-sm">
                                                {formatDate(transfer.createdAt)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </AppCard>
                    </>
                )}
            </div>
        </FeatureGuard>
    )
}
