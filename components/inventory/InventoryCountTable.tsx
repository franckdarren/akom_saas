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
import {Loader2} from 'lucide-react'
import {formatNumber, formatPrice} from '@/lib/utils/format'
import {
    saveInventoryCounts,
    completeInventorySession,
    cancelInventorySession,
} from '@/lib/actions/inventory'
import {useNavigationLoading} from '@/lib/hooks/use-navigation-loading'
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
    const {startLoading} = useNavigationLoading()
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

    // Démarque totale : somme des écarts valorisés au coût de revient. Les lignes
    // sans coût connu sont exclues et signalées à part — mieux vaut un total
    // partiel annoncé qu'un total complet mais faux.
    const hasAnyUnitCost = lines.some((l) => l.unitCost !== null)
    let totalGapValue = 0
    let unvaluedCountedLines = 0

    for (const line of lines) {
        const gap = getGap(line.id, line.expectedQty)
        if (gap === null) continue
        if (line.unitCost === null) {
            if (gap !== 0) unvaluedCountedLines++
            continue
        }
        totalGapValue += gap * line.unitCost
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
            // `isCompleting` reste à true jusqu'au démontage : le bouton continue
            // d'indiquer une action en cours pendant le rendu du rapport.
            startLoading()
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
                        {hasAnyUnitCost && <TableHead className="text-right">Valeur écart</TableHead>}
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
                                            // Une saisie pendant l'enregistrement serait perdue :
                                            // le payload est figé au moment du clic.
                                            disabled={isSaving || isCompleting || isCancelling}
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
                                {hasAnyUnitCost && (
                                    <TableCell
                                        className={
                                            'text-right ' +
                                            (gap === null || line.unitCost === null || gap === 0
                                                ? 'text-muted-foreground'
                                                : gap > 0
                                                    ? 'text-success font-medium'
                                                    : 'text-destructive font-medium')
                                        }
                                    >
                                        {gap === null || line.unitCost === null
                                            ? '—'
                                            : (gap > 0 ? '+' : '') + formatPrice(gap * line.unitCost)}
                                    </TableCell>
                                )}
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>

            {/* Impact financier du comptage — la conclusion que le gérant attend */}
            {hasAnyUnitCost && (
                <div className="rounded-lg border bg-muted/50 p-4 space-y-1">
                    <div className="flex items-center justify-between gap-4">
                        <span className="text-sm text-muted-foreground">
                            {totalGapValue < 0 ? 'Démarque constatée' : 'Écart de valorisation'}
                        </span>
                        <span
                            className={
                                'text-xl font-bold ' +
                                (totalGapValue < 0
                                    ? 'text-destructive'
                                    : totalGapValue > 0
                                        ? 'text-success'
                                        : '')
                            }
                        >
                            {totalGapValue > 0 ? '+' : ''}
                            {formatPrice(totalGapValue)}
                        </span>
                    </div>
                    {unvaluedCountedLines > 0 && (
                        <p className="type-caption text-muted-foreground">
                            {formatNumber(unvaluedCountedLines)} produit
                            {unvaluedCountedLines > 1 ? 's' : ''} en écart sans coût de revient
                            {unvaluedCountedLines > 1 ? ' ne sont' : " n'est"} pas compté
                            {unvaluedCountedLines > 1 ? 's' : ''} dans ce total.
                        </p>
                    )}
                </div>
            )}

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
                                    {/* preventDefault : sans ça Radix referme le dialog au clic et
                                        l'indicateur d'attente disparaît avant la fin de l'action. */}
                                    <AlertDialogAction
                                        onClick={(e) => {
                                            e.preventDefault()
                                            handleCancel()
                                        }}
                                        disabled={isCancelling}
                                    >
                                        {isCancelling ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin"/>
                                                Annulation…
                                            </>
                                        ) : (
                                            "Confirmer l'annulation"
                                        )}
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
                                    <AlertDialogAction
                                        onClick={(e) => {
                                            e.preventDefault()
                                            handleComplete()
                                        }}
                                        disabled={isCompleting}
                                    >
                                        {isCompleting ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin"/>
                                                Validation…
                                            </>
                                        ) : (
                                            'Confirmer la validation'
                                        )}
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
