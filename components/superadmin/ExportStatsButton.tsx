'use client'

import { useState } from 'react'
import { exportStatsToCSV } from '@/lib/actions/superadmin-stats'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface ExportStatsButtonProps {
    period?: 'day' | 'week' | 'month'
}

export function ExportStatsButton({ period }: ExportStatsButtonProps) {
    const [loading, setLoading] = useState(false)

    async function handleExport(p: 'day' | 'week' | 'month') {
        setLoading(true)

        try {
            const csv = await exportStatsToCSV(p)

            // Créer un blob et télécharger
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
            const link = document.createElement('a')
            link.href = URL.createObjectURL(blob)
            link.download = `akom-stats-${p}-${new Date().toISOString().split('T')[0]}.csv`
            link.click()

            toast.success('Export CSV réussi')
        } catch (error) {
            console.error('Erreur export:', error)
            toast.error("Erreur lors de l'export")
        } finally {
            setLoading(false)
        }
    }

    // Si une période est passée en prop, on déclenche directement le téléchargement au click
    const onClickHandler = period ? () => handleExport(period) : undefined

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button disabled={loading} onClick={onClickHandler}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    Export CSV
                </Button>
            </DropdownMenuTrigger>
            {!period && (
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleExport('day')}>Par jour (30 derniers)</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport('week')}>Par semaine (12 dernières)</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport('month')}>Par mois (12 derniers)</DropdownMenuItem>
                </DropdownMenuContent>
            )}
        </DropdownMenu>
    )
}
