'use client'

import {useState, useTransition} from 'react'
import {toast} from 'sonner'
import {Coins, Search, HandCoins, Ban} from 'lucide-react'
import {AppCard, CardContent, CardHeader, CardTitle} from '@/components/ui/app-card'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Badge} from '@/components/ui/badge'
import {EmptyState} from '@/components/ui/empty-state'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {listChangeDues} from '@/lib/actions/change-due'
import {SettleChangeDueDialog} from './SettleChangeDueDialog'
import {CancelChangeDueDialog} from './CancelChangeDueDialog'
import {
    CHANGE_DUE_SETTLEMENT_LABELS,
    type ChangeDueListResult,
    type ChangeDueRow,
    type ChangeDueStatus,
} from '@/types/change-due'

function formatAmount(n: number) {
    return new Intl.NumberFormat('fr-FR').format(n) + ' FCFA'
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    })
}

const TABS: {value: ChangeDueStatus; label: string}[] = [
    {value: 'outstanding', label: 'En cours'},
    {value: 'settled', label: 'Soldées'},
    {value: 'cancelled', label: 'Annulées'},
]

interface Props {
    initialData: ChangeDueListResult
    isAdmin: boolean
}

export function ChangeDueShell({initialData, isAdmin}: Props) {
    const [data, setData] = useState(initialData)
    const [status, setStatus] = useState<ChangeDueStatus>('outstanding')
    const [search, setSearch] = useState('')
    const [isPending, startTransition] = useTransition()

    const [toSettle, setToSettle] = useState<ChangeDueRow | null>(null)
    const [toCancel, setToCancel] = useState<ChangeDueRow | null>(null)

    function reload(nextStatus: ChangeDueStatus = status, nextSearch: string = search) {
        startTransition(async () => {
            const result = await listChangeDues({
                status: nextStatus,
                search: nextSearch.trim() || undefined,
            })
            if (!result.success) {
                toast.error(result.error)
                return
            }
            setData(result.data)
        })
    }

    function handleTabChange(value: string) {
        const next = value as ChangeDueStatus
        setStatus(next)
        reload(next)
    }

    const rows = data.rows.filter(row => row.status === status)

    return (
        <div className="layout-sections">

            {/* ── Passif total envers les clients ── */}
            <AppCard variant="stat">
                <CardContent className="layout-card-body">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="layout-inline">
                            <Coins className="h-5 w-5 text-warning"/>
                            <div>
                                <p className="type-label-meta">Monnaie due aux clients</p>
                                <p className="type-body-muted">
                                    Argent détenu dans le tiroir qui n&apos;appartient pas au commerce
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-bold tabular-nums text-warning">
                                {formatAmount(data.outstandingTotal)}
                            </p>
                            <p className="type-caption">
                                {data.outstandingCount} dette{data.outstandingCount > 1 ? 's' : ''} en cours
                            </p>
                        </div>
                    </div>
                </CardContent>
            </AppCard>

            {/* ── Liste ── */}
            <AppCard>
                <CardHeader>
                    <CardTitle className="type-card-title">Suivi des monnaies dues</CardTitle>
                </CardHeader>

                <CardContent className="layout-card-body">
                    {/* Recherche */}
                    <div className="layout-inline">
                        <div className="relative flex-1">
                            <Search
                                className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
                            <Input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && reload()}
                                placeholder="Code de retrait, téléphone ou nom du client"
                                className="pl-8"
                            />
                        </div>
                        <Button variant="outline" onClick={() => reload()} disabled={isPending}>
                            Rechercher
                        </Button>
                    </div>

                    <Tabs value={status} onValueChange={handleTabChange}>
                        <TabsList className="w-full">
                            {TABS.map(tab => (
                                <TabsTrigger key={tab.value} value={tab.value} className="flex-1">
                                    {tab.label}
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        {TABS.map(tab => (
                            <TabsContent key={tab.value} value={tab.value} className="mt-4">
                                {rows.length === 0 ? (
                                    <EmptyState
                                        icon={Coins}
                                        title={
                                            tab.value === 'outstanding'
                                                ? 'Aucune monnaie due'
                                                : `Aucune dette ${tab.label.toLowerCase()}`
                                        }
                                        description={
                                            tab.value === 'outstanding'
                                                ? 'Les monnaies non rendues enregistrées au comptoir apparaîtront ici.'
                                                : undefined
                                        }
                                    />
                                ) : (
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="type-table-head">Code</TableHead>
                                                    <TableHead className="type-table-head">Montant</TableHead>
                                                    <TableHead className="type-table-head">Client</TableHead>
                                                    <TableHead className="type-table-head">Date</TableHead>
                                                    <TableHead className="type-table-head">Traçabilité</TableHead>
                                                    {tab.value === 'outstanding' && (
                                                        <TableHead className="type-table-head text-right">
                                                            Actions
                                                        </TableHead>
                                                    )}
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {rows.map(row => (
                                                    <TableRow key={row.id}>
                                                        <TableCell className="type-code font-semibold">
                                                            {row.code}
                                                        </TableCell>

                                                        <TableCell className="font-semibold tabular-nums">
                                                            {formatAmount(row.amount)}
                                                        </TableCell>

                                                        <TableCell>
                                                            {row.customerName || row.customerPhone ? (
                                                                <div>
                                                                    {row.customerName && (
                                                                        <p className="text-sm">{row.customerName}</p>
                                                                    )}
                                                                    {row.customerPhone && (
                                                                        <p className="type-caption">
                                                                            {row.customerPhone}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <span className="type-caption">Non renseigné</span>
                                                            )}
                                                        </TableCell>

                                                        <TableCell>
                                                            <p className="text-sm">{formatDate(row.dueDate)}</p>
                                                            {row.orderNumber && (
                                                                <p className="type-caption">#{row.orderNumber}</p>
                                                            )}
                                                        </TableCell>

                                                        <TableCell>
                                                            <p className="type-caption">
                                                                Créée par {row.createdByEmail ?? 'inconnu'}
                                                            </p>
                                                            {row.status === 'settled' && (
                                                                <>
                                                                    <Badge variant="success" className="mt-1">
                                                                        {row.settlementMethod
                                                                            ? CHANGE_DUE_SETTLEMENT_LABELS[row.settlementMethod]
                                                                            : 'Soldée'}
                                                                    </Badge>
                                                                    <p className="type-caption mt-1">
                                                                        Par {row.settledByEmail ?? 'inconnu'}
                                                                        {row.settledDate && ` · ${formatDate(row.settledDate)}`}
                                                                    </p>
                                                                    {row.settledOrderNumber && (
                                                                        <p className="type-caption">
                                                                            Sur #{row.settledOrderNumber}
                                                                        </p>
                                                                    )}
                                                                </>
                                                            )}
                                                            {row.status === 'cancelled' && (
                                                                <>
                                                                    <Badge variant="outline" className="mt-1">
                                                                        Annulée
                                                                    </Badge>
                                                                    <p className="type-caption mt-1">
                                                                        {row.cancelReason}
                                                                    </p>
                                                                </>
                                                            )}
                                                        </TableCell>

                                                        {tab.value === 'outstanding' && (
                                                            <TableCell className="text-right">
                                                                <div className="flex justify-end gap-2">
                                                                    <Button
                                                                        size="sm"
                                                                        className="gap-1.5"
                                                                        onClick={() => setToSettle(row)}
                                                                    >
                                                                        <HandCoins className="h-3.5 w-3.5"/>
                                                                        Rendre
                                                                    </Button>
                                                                    {isAdmin && (
                                                                        <Button
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            className="gap-1.5 text-muted-foreground hover:text-destructive"
                                                                            onClick={() => setToCancel(row)}
                                                                        >
                                                                            <Ban className="h-3.5 w-3.5"/>
                                                                            Annuler
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                        )}
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </TabsContent>
                        ))}
                    </Tabs>

                    <p className="type-caption">
                        ℹ️ Une monnaie due peut aussi être déduite d&apos;un achat : saisissez le code
                        de retrait au moment de l&apos;encaissement au comptoir.
                    </p>
                </CardContent>
            </AppCard>

            <SettleChangeDueDialog
                changeDue={toSettle}
                onClose={() => setToSettle(null)}
                onSettled={() => {
                    setToSettle(null)
                    reload()
                }}
            />

            <CancelChangeDueDialog
                changeDue={toCancel}
                onClose={() => setToCancel(null)}
                onCancelled={() => {
                    setToCancel(null)
                    reload()
                }}
            />
        </div>
    )
}
