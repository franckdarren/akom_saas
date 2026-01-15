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

export function ExportStatsButton() {
    const [loading, setLoading] = useState(false)

    async function handleExport(period: 'day' | 'week' | 'month') {
        setLoading(true)

        try {
            const csv = await exportStatsToCSV(period)

            // Créer un blob et télécharger
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
            const link = document.createElement('a')
            link.href = URL.createObjectURL(blob)
            link.download = `akom-stats-${period}-${new Date().toISOString().split('T')[0]}.csv`
            link.click()

            toast.success('Export CSV réussi')
        } catch (error) {
            console.error('Erreur export:', error)
            toast.error('Erreur lors de l\'export')
        } finally {
            setLoading(false)
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button disabled={loading}>
                    {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Download className="h-4 w-4" />
                    )}
                    Export CSV
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport('day')}>
                    Par jour (30 derniers)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('week')}>
                    Par semaine (12 dernières)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('month')}>
                    Par mois (12 derniers)
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}