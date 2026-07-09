// components/inventory/InventoryCountTable.tsx
'use client'

import {useState} from 'react'
import {useRouter} from 'next/navigation'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {Button} from '@/components/ui/button'
import {LoadingButton} from '@/components/ui/loading-button'
import {Input} from '@/components/ui/input'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {formatNumber} from '@/lib/utils/format'
import {
    saveInventoryCounts,
    completeInventorySession,
    cancelInventorySession,
} from '@/lib/actions/inventory'
import type {InventoryScope, InventoryStatus} from '@prisma/client'

export interface InventoryLineForClient {
    id: string
    name: string
    unit: string | null
    expectedQty: number
    countedQty: number | null
    unitCost: number | null
}

interface InventoryCountTableProps {
    sessionId: string
    scope: InventoryScope
    status: InventoryStatus
    lines: InventoryLineForClient[]
}

export function InventoryCountTable({sessionId, status, lines}: InventoryCountTableProps) {
    const router = useRouter()
    const [counts, setCounts] = useState<Record<string, string>>(() =>
        Object.fromEntries(lines.map((l) => [l.id, l.countedQty !== null ? String(l.countedQty) : '']))
    )
    const [isSaving, setIsSaving] = useState(false)
    const [isCompleting, setIsCompleting] = useState(false)
    const [isCancelling, setIsCancelling] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const isEditable = status === 'draft' || status === 'in_progress'
    const countedLinesCount = Object.values(counts).filter((v) => v !== '').length

    function getGap(lineId: string, expected: number): number | null {
        const raw = counts[lineId]
        if (raw === '' || raw === undefined) return null
        const value = Number(raw)
        if (Number.isNaN(value)) return null
        return value - expected
    }

    async function handleSave() {
        setIsSaving(true)
        setError(null)

        const payload = Object.entries(counts)
            .filter(([, value]) => value !== '' && !Number.isNaN(Number(value)))
            .map(([lineId, value]) => ({lineId, countedQty: Number(value)}))

        const result = await saveInventoryCounts(sessionId, payload)

        if (result.error) {
            setError(result.error)
        } else {
            router.refresh()
        }
        setIsSaving(false)
    }

    async function handleComplete() {
        setIsCompleting(true)
        setError(null)

        await handleSave()
        const result = await completeInventorySession(sessionId)

        if (result.error) {
            setError(result.error)
            setIsCompleting(false)
        } else {
            router.push(`/dashboard/inventory/${sessionId}/report`)
        }
    }

    async function handleCancel() {
        setIsCancelling(true)
        setError(null)

        const result = await cancelInventorySession(sessionId)

        if (result.error) {
            setError(result.error)
            setIsCancelling(false)
        } else {
            router.refresh()
        }
    }

    return (
        <div className="layout-card-body">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Produit</TableHead>
                        <TableHead className="text-right">Qté théorique</TableHead>
                        <TableHead className="text-right">Qté comptée</TableHead>
                        <TableHead className="text-right">Écart</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {lines.map((line) => {
                        const gap = getGap(line.id, line.expectedQty)
                        return (
                            <TableRow key={line.id}>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-medium">{line.name}</span>
                                        {line.unit && (
                                            <span className="text-xs text-muted-foreground">{line.unit}</span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">{formatNumber(line.expectedQty)}</TableCell>
                                <TableCell className="text-right">
                                    {isEditable ? (
                                        <Input
                                            type="text"
                                            inputMode="decimal"
                                            className="ml-auto w-28 text-right"
                                            value={counts[line.id]}
                                            onChange={(e) =>
                                                setCounts((prev) => ({...prev, [line.id]: e.target.value}))
                                            }
                                            placeholder="—"
                                        />
                                    ) : (
                                        formatNumber(line.countedQty ?? 0)
                                    )}
                                </TableCell>
                                <TableCell
                                    className={
                                        'text-right font-medium ' +
                                        (gap === null
                                            ? 'text-muted-foreground'
                                            : gap === 0
                                                ? 'text-muted-foreground'
                                                : gap > 0
                                                    ? 'text-success'
                                                    : 'text-destructive')
                                    }
                                >
                                    {gap === null ? '—' : (gap > 0 ? '+' : '') + formatNumber(gap)}
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>

            {error && (
                <div className="bg-destructive-subtle text-destructive p-3 rounded-lg text-sm">{error}</div>
            )}

            {isEditable && (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <span className="type-caption text-muted-foreground">
                        {countedLinesCount}/{lines.length} produits comptés
                    </span>

                    <div className="flex gap-2">
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="outline" disabled={isSaving || isCompleting || isCancelling}>
                                    Annuler l&apos;inventaire
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Annuler cet inventaire ?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Le comptage sera abandonné, aucune modification ne sera apportée au stock.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel disabled={isCancelling}>Retour</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleCancel} disabled={isCancelling}>
                                        Confirmer l&apos;annulation
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>

                        <LoadingButton
                            variant="outline"
                            isLoading={isSaving}
                            loadingText="Enregistrement..."
                            onClick={handleSave}
                            disabled={isCompleting || isCancelling}
                        >
                            Enregistrer
                        </LoadingButton>

                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button disabled={isSaving || isCompleting || isCancelling}>
                                    Valider l&apos;inventaire
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Valider cet inventaire ?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Le stock réel sera ajusté selon les écarts constatés
                                        ({countedLinesCount}/{lines.length} produits comptés). Cette action est
                                        tracée mais ne peut pas être annulée.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel disabled={isCompleting}>Retour</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleComplete} disabled={isCompleting}>
                                        {isCompleting ? 'Validation...' : 'Confirmer la validation'}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>
            )}
        </div>
    )
}
