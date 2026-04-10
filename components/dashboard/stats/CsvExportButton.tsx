'use client'

// components/dashboard/stats/CsvExportButton.tsx

import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CsvExportButtonProps {
    /** Lignes du CSV (première ligne = en-têtes) */
    rows: string[][]
    filename: string
    label?: string
}

function rowsToCsv(rows: string[][]): string {
    return rows
        .map((cols) =>
            cols
                .map((cell) => {
                    // Échapper les guillemets et encadrer si nécessaire
                    const escaped = cell.replace(/"/g, '""')
                    return /[,"\n\r]/.test(cell) ? `"${escaped}"` : escaped
                })
                .join(','),
        )
        .join('\r\n')
}

export function CsvExportButton({ rows, filename, label = 'Exporter CSV' }: CsvExportButtonProps) {
    function handleDownload() {
        const csv = rowsToCsv(rows)
        // BOM UTF-8 pour que Excel ouvre correctement les accents
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
    }

    return (
        <Button variant="outline" size="sm" onClick={handleDownload} className="layout-inline">
            <Download className="h-4 w-4" />
            {label}
        </Button>
    )
}
