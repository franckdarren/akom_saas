// app/(dashboard)/dashboard/inventory/page.tsx
import {Metadata} from 'next'
import Link from 'next/link'
import {ClipboardCheck} from 'lucide-react'

import {AppCard, CardContent} from '@/components/ui/app-card'
import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {EmptyState} from '@/components/ui/empty-state'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {PageHeader} from '@/components/ui/page-header'
import {AppInsetHeader} from '@/components/layout/AppInsetHeader'
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
} from '@/components/ui/breadcrumb'
import {getInventorySessions} from '@/lib/actions/inventory'
import {getCurrentUserAndRestaurant} from '@/lib/auth/session'
import {hasFeature} from '@/lib/services/subscription-checker'
import {formatDate, formatNumber, formatPrice} from '@/lib/utils/format'
import prisma from '@/lib/prisma'
import {NewInventorySessionDialog} from './new-inventory-session-dialog'
import {OpenSessionButton} from './open-session-button'
import type {InventoryScope} from '@prisma/client'

export const metadata: Metadata = {
    title: 'Inventaire | Akôm',
    description: 'Sessions de comptage de stock et rapports d\'écarts',
}

const SCOPE_LABELS: Record<InventoryScope, string> = {
    operational: 'Stock',
    warehouse: 'Entrepôt',
}

const STATUS_LABELS: Record<string, {label: string; variant: 'outline' | 'secondary' | 'success' | 'destructive'}> = {
    draft: {label: 'Brouillon', variant: 'outline'},
    in_progress: {label: 'En cours', variant: 'secondary'},
    completed: {label: 'Validé', variant: 'success'},
    cancelled: {label: 'Annulé', variant: 'destructive'},
}

export default async function InventoryPage({
    searchParams: searchParamsPromise,
}: {
    searchParams: Promise<{scope?: string}>
}) {
    const [{restaurantId}, searchParams] = await Promise.all([
        getCurrentUserAndRestaurant(),
        searchParamsPromise,
    ])

    const scope = searchParams.scope === 'operational' || searchParams.scope === 'warehouse'
        ? searchParams.scope
        : undefined

    const [sessionsResult, warehouseEnabled, categories, warehouseCategoriesRaw] = await Promise.all([
        getInventorySessions({scope}),
        hasFeature(restaurantId, 'warehouse_module'),
        prisma.category.findMany({
            where: {restaurantId, isActive: true},
            select: {id: true, name: true},
            orderBy: {name: 'asc'},
        }),
        prisma.warehouseProduct.findMany({
            where: {restaurantId, isActive: true, category: {not: null}},
            select: {category: true},
            distinct: ['category'],
        }),
    ])

    const sessions = sessionsResult.success ? sessionsResult.data : []
    const warehouseCategories = warehouseCategoriesRaw
        .map((w) => w.category)
        .filter((c): c is string => Boolean(c))

    return (
        <>
            <AppInsetHeader>
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbPage>Inventaire</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </AppInsetHeader>

            <div className="layout-page">
                <PageHeader
                    title="Inventaire"
                    description="Sessions de comptage de stock et rapports d'écarts"
                    action={
                        <NewInventorySessionDialog
                            warehouseEnabled={warehouseEnabled}
                            categories={categories}
                            warehouseCategories={warehouseCategories}
                        >
                            <Button className="gap-2">
                                <ClipboardCheck className="h-4 w-4"/>
                                Nouvel inventaire
                            </Button>
                        </NewInventorySessionDialog>
                    }
                />

                <div className="layout-inline">
                    <Button variant={!scope ? 'default' : 'outline'} size="sm" asChild>
                        <Link href="/dashboard/inventory">Tous</Link>
                    </Button>
                    <Button variant={scope === 'operational' ? 'default' : 'outline'} size="sm" asChild>
                        <Link href="/dashboard/inventory?scope=operational">Stock</Link>
                    </Button>
                    {warehouseEnabled && (
                        <Button variant={scope === 'warehouse' ? 'default' : 'outline'} size="sm" asChild>
                            <Link href="/dashboard/inventory?scope=warehouse">Entrepôt</Link>
                        </Button>
                    )}
                </div>

                <AppCard>
                    <CardContent className="layout-card-body">
                        {sessions.length === 0 ? (
                            <EmptyState
                                icon={ClipboardCheck}
                                title="Aucun inventaire pour le moment"
                                description="Lancez un premier comptage pour suivre les écarts de stock."
                            />
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Périmètre</TableHead>
                                        <TableHead>Statut</TableHead>
                                        <TableHead className="text-right">Produits</TableHead>
                                        <TableHead className="text-right">Écart total</TableHead>
                                        <TableHead className="text-right">Valorisation</TableHead>
                                        <TableHead></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sessions.map((session) => {
                                        const status = STATUS_LABELS[session.status]
                                        return (
                                            <TableRow key={session.id}>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span>{formatDate(session.createdAt)}</span>
                                                        {session.label && (
                                                            <span className="text-xs text-muted-foreground">{session.label}</span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>{SCOPE_LABELS[session.scope]}</TableCell>
                                                <TableCell>
                                                    <Badge variant={status.variant}>{status.label}</Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {session.countedCount}/{session.linesCount}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {session.status === 'completed' ? formatNumber(session.totalGapQty) : '—'}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {/* Depuis le suivi du CUMP, les sessions « stock »
                                                        sont valorisées elles aussi : on n'affiche donc
                                                        plus « — » selon le périmètre mais selon la
                                                        présence effective d'une valorisation. */}
                                                    {session.status === 'completed' && session.totalGapValue !== 0
                                                        ? formatPrice(session.totalGapValue)
                                                        : '—'}
                                                </TableCell>
                                                <TableCell>
                                                    <OpenSessionButton
                                                        sessionId={session.id}
                                                        label={session.status === 'completed' ? 'Voir' : 'Continuer'}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </AppCard>
            </div>
        </>
    )
}
