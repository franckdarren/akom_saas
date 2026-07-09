// app/(dashboard)/dashboard/inventory/[id]/page.tsx
import {Metadata} from 'next'
import {notFound} from 'next/navigation'
import Link from 'next/link'
import {FileText} from 'lucide-react'

import {AppCard, CardContent} from '@/components/ui/app-card'
import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {PageHeader} from '@/components/ui/page-header'
import {AppInsetHeader} from '@/components/layout/AppInsetHeader'
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {getInventorySessionDetail} from '@/lib/actions/inventory'
import {formatDate} from '@/lib/utils/format'
import {InventoryCountTable} from '@/components/inventory/InventoryCountTable'
import type {InventoryLineForClient} from '@/components/inventory/InventoryCountTable'

export const metadata: Metadata = {
    title: 'Comptage inventaire | Akôm',
}

const SCOPE_LABELS = {
    operational: 'Stock opérationnel',
    warehouse: 'Entrepôt',
} as const

const STATUS_LABELS: Record<string, {label: string; variant: 'outline' | 'secondary' | 'success' | 'destructive'}> = {
    draft: {label: 'Brouillon', variant: 'outline'},
    in_progress: {label: 'En cours', variant: 'secondary'},
    completed: {label: 'Validé', variant: 'success'},
    cancelled: {label: 'Annulé', variant: 'destructive'},
}

export default async function InventorySessionPage({
    params,
}: {
    params: Promise<{id: string}>
}) {
    const {id} = await params
    const result = await getInventorySessionDetail(id)

    if (!result.success) {
        notFound()
    }

    const session = result.data
    const status = STATUS_LABELS[session.status]

    const lines: InventoryLineForClient[] = session.lines.map((line) => ({
        id: line.id,
        name: line.product?.name ?? line.warehouseProduct?.name ?? 'Produit supprimé',
        unit: line.warehouseProduct?.storageUnit ?? null,
        expectedQty: Number(line.expectedQty),
        countedQty: line.countedQty !== null ? Number(line.countedQty) : null,
        unitCost: line.unitCost !== null ? Number(line.unitCost) : null,
    }))

    return (
        <>
            <AppInsetHeader>
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/dashboard/inventory">Inventaire</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator/>
                        <BreadcrumbItem>
                            <BreadcrumbPage>{session.label || formatDate(session.createdAt)}</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </AppInsetHeader>

            <div className="layout-page">
                <PageHeader
                    title={session.label || `Inventaire du ${formatDate(session.createdAt)}`}
                    description={SCOPE_LABELS[session.scope]}
                    titleBadge={<Badge variant={status.variant}>{status.label}</Badge>}
                    action={
                        session.status === 'completed' ? (
                            <Button variant="outline" asChild className="gap-2">
                                <Link href={`/dashboard/inventory/${session.id}/report`}>
                                    <FileText className="h-4 w-4"/>
                                    Voir le rapport
                                </Link>
                            </Button>
                        ) : undefined
                    }
                />

                <AppCard>
                    <CardContent className="layout-card-body">
                        <InventoryCountTable
                            sessionId={session.id}
                            scope={session.scope}
                            status={session.status}
                            lines={lines}
                        />
                    </CardContent>
                </AppCard>
            </div>
        </>
    )
}
