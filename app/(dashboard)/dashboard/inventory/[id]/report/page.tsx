// app/(dashboard)/dashboard/inventory/[id]/report/page.tsx
import {Metadata} from 'next'
import {notFound, redirect} from 'next/navigation'

import {AppCard, CardContent} from '@/components/ui/app-card'
import {EmptyState} from '@/components/ui/empty-state'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
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
import {ClipboardCheck} from 'lucide-react'
import {getInventorySessionDetail} from '@/lib/actions/inventory'
import {formatDate, formatNumber, formatPrice} from '@/lib/utils/format'
import {CsvExportButton} from '@/components/dashboard/stats/CsvExportButton'
import {InventoryPdfExportButton} from '@/components/inventory/InventoryPdfExportButton'

export const metadata: Metadata = {
    title: "Rapport d'inventaire | Akôm",
}

const SCOPE_LABELS = {
    operational: 'Stock opérationnel',
    warehouse: 'Entrepôt',
} as const

export default async function InventoryReportPage({
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
    if (session.status !== 'completed') {
        redirect(`/dashboard/inventory/${id}`)
    }

    const gapLines = session.lines
        .filter((line) => line.countedQty !== null)
        .map((line) => {
            const expected = Number(line.expectedQty)
            const counted = Number(line.countedQty)
            const gap = counted - expected
            const unitCost = line.unitCost !== null ? Number(line.unitCost) : null
            return {
                name: line.product?.name ?? line.warehouseProduct?.name ?? 'Produit supprimé',
                unit: line.warehouseProduct?.storageUnit ?? null,
                expected,
                counted,
                gap,
                gapValue: unitCost !== null ? gap * unitCost : null,
            }
        })
        .filter((line) => line.gap !== 0)

    const countedCount = session.lines.filter((l) => l.countedQty !== null).length
    const positiveGaps = gapLines.filter((l) => l.gap > 0).length
    const negativeGaps = gapLines.filter((l) => l.gap < 0).length
    const totalGapValue = gapLines.reduce((sum, l) => sum + (l.gapValue ?? 0), 0)

    // La valorisation s'affiche dès qu'un coût de revient est connu, quel que soit
    // le périmètre : le stock opérationnel est valorisé au CUMP depuis le suivi
    // des prix d'achat.
    const hasValuation = session.lines.some((l) => l.unitCost !== null)
    const unvaluedGapLines = gapLines.filter((l) => l.gapValue === null).length

    const csvRows: string[][] = [
        ['Produit', 'Unité', 'Qté théorique', 'Qté comptée', 'Écart', 'Valorisation écart (FCFA)'],
        ...gapLines.map((l) => [
            l.name,
            l.unit ?? '',
            String(l.expected),
            String(l.counted),
            String(l.gap),
            l.gapValue !== null ? String(l.gapValue) : '',
        ]),
    ]

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
                            <BreadcrumbLink href={`/dashboard/inventory/${session.id}`}>
                                {session.label || formatDate(session.createdAt)}
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator/>
                        <BreadcrumbItem>
                            <BreadcrumbPage>Rapport</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </AppInsetHeader>

            <div className="layout-page">
                <PageHeader
                    title="Rapport d'inventaire"
                    description={`${SCOPE_LABELS[session.scope]} · ${formatDate(session.createdAt)}`}
                    action={
                        <div className="layout-inline">
                            <CsvExportButton
                                rows={csvRows}
                                filename={`inventaire-${session.id.slice(0, 8)}.csv`}
                            />
                            <InventoryPdfExportButton
                                sessionLabel={session.label || formatDate(session.createdAt)}
                                scopeLabel={SCOPE_LABELS[session.scope]}
                                lines={gapLines}
                                showValuation={hasValuation}
                            />
                        </div>
                    }
                />

                <div className="layout-kpi-grid">
                    <AppCard variant="stat">
                        <CardContent className="layout-card-body">
                            <span className="type-caption text-muted-foreground">Produits comptés</span>
                            <p className="text-2xl font-bold">{countedCount}/{session.lines.length}</p>
                        </CardContent>
                    </AppCard>
                    <AppCard variant="stat">
                        <CardContent className="layout-card-body">
                            <span className="type-caption text-muted-foreground">Écarts positifs</span>
                            <p className="text-2xl font-bold text-success">{positiveGaps}</p>
                        </CardContent>
                    </AppCard>
                    <AppCard variant="stat">
                        <CardContent className="layout-card-body">
                            <span className="type-caption text-muted-foreground">Écarts négatifs</span>
                            <p className="text-2xl font-bold text-destructive">{negativeGaps}</p>
                        </CardContent>
                    </AppCard>
                    {hasValuation && (
                        <AppCard variant="stat">
                            <CardContent className="layout-card-body">
                                <span className="type-caption text-muted-foreground">
                                    {totalGapValue < 0 ? 'Démarque constatée' : 'Valorisation écart'}
                                </span>
                                <p className={'text-2xl font-bold ' + (totalGapValue < 0 ? 'text-destructive' : 'text-success')}>
                                    {totalGapValue > 0 ? '+' : ''}{formatPrice(totalGapValue)}
                                </p>
                                {unvaluedGapLines > 0 && (
                                    <span className="type-caption text-muted-foreground">
                                        {unvaluedGapLines} écart{unvaluedGapLines > 1 ? 's' : ''} non valorisé
                                        {unvaluedGapLines > 1 ? 's' : ''}
                                    </span>
                                )}
                            </CardContent>
                        </AppCard>
                    )}
                </div>

                <AppCard>
                    <CardContent className="layout-card-body">
                        {gapLines.length === 0 ? (
                            <EmptyState
                                icon={ClipboardCheck}
                                title="Aucun écart constaté"
                                description="Le stock théorique correspondait au comptage physique."
                            />
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Produit</TableHead>
                                        <TableHead className="text-right">Qté théorique</TableHead>
                                        <TableHead className="text-right">Qté comptée</TableHead>
                                        <TableHead className="text-right">Écart</TableHead>
                                        {hasValuation && (
                                            <TableHead className="text-right">Valorisation</TableHead>
                                        )}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {gapLines.map((line, index) => (
                                        <TableRow key={index}>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{line.name}</span>
                                                    {line.unit && (
                                                        <span className="text-xs text-muted-foreground">{line.unit}</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">{formatNumber(line.expected)}</TableCell>
                                            <TableCell className="text-right">{formatNumber(line.counted)}</TableCell>
                                            <TableCell
                                                className={
                                                    'text-right font-medium ' +
                                                    (line.gap > 0 ? 'text-success' : 'text-destructive')
                                                }
                                            >
                                                {(line.gap > 0 ? '+' : '') + formatNumber(line.gap)}
                                            </TableCell>
                                            {hasValuation && (
                                                <TableCell
                                                    className={
                                                        'text-right ' +
                                                        (line.gapValue === null
                                                            ? 'text-muted-foreground'
                                                            : line.gapValue < 0
                                                                ? 'text-destructive'
                                                                : 'text-success')
                                                    }
                                                >
                                                    {line.gapValue !== null
                                                        ? (line.gapValue > 0 ? '+' : '') + formatPrice(line.gapValue)
                                                        : '—'}
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </AppCard>
            </div>
        </>
    )
}
