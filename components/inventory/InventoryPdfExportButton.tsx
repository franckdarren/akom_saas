// components/inventory/InventoryPdfExportButton.tsx
'use client'

import {FileDown} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {formatNumber, formatPrice} from '@/lib/utils/format'

interface InventoryPdfLine {
    name: string
    unit: string | null
    expected: number
    counted: number
    gap: number
    gapValue: number | null
}

interface InventoryPdfExportButtonProps {
    sessionLabel: string
    scopeLabel: string
    lines: InventoryPdfLine[]
    /**
     * Affiche la colonne de valorisation. Piloté par la présence effective de
     * coûts de revient, pas par le périmètre : depuis le suivi du CUMP, le stock
     * opérationnel est valorisé lui aussi.
     */
    showValuation: boolean
}

export function InventoryPdfExportButton({
    sessionLabel,
    scopeLabel,
    lines,
    showValuation,
}: InventoryPdfExportButtonProps) {
    async function handleExport() {
        const [{default: jsPDF}, autoTable] = await Promise.all([
            import('jspdf'),
            import('jspdf-autotable'),
        ])

        const doc = new jsPDF()

        doc.setFontSize(16)
        doc.text("Rapport d'inventaire", 14, 18)
        doc.setFontSize(10)
        doc.setTextColor(100)
        doc.text(`${scopeLabel} · ${sessionLabel}`, 14, 25)

        const head = showValuation
            ? [['Produit', 'Qté théorique', 'Qté comptée', 'Écart', 'Valorisation (FCFA)']]
            : [['Produit', 'Qté théorique', 'Qté comptée', 'Écart']]

        const body = lines.map((line) => {
            const name = line.unit ? `${line.name} (${line.unit})` : line.name
            const row = [
                name,
                formatNumber(line.expected),
                formatNumber(line.counted),
                (line.gap > 0 ? '+' : '') + formatNumber(line.gap),
            ]
            if (showValuation) {
                row.push(line.gapValue !== null ? formatPrice(line.gapValue) : '—')
            }
            return row
        })

        // Ligne de total : l'impact financier doit être lisible sans additionner
        // les lignes à la main.
        const totalGapValue = lines.reduce((sum, l) => sum + (l.gapValue ?? 0), 0)
        const foot = showValuation
            ? [['Total', '', '', '', (totalGapValue > 0 ? '+' : '') + formatPrice(totalGapValue)]]
            : undefined

        autoTable.default(doc, {
            head,
            body,
            foot,
            startY: 32,
            styles: {fontSize: 9},
            headStyles: {fillColor: [24, 24, 27]},
            footStyles: {fillColor: [24, 24, 27]},
        })

        doc.save(`inventaire-${sessionLabel.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.pdf`)
    }

    return (
        <Button variant="outline" size="sm" onClick={handleExport} className="layout-inline">
            <FileDown className="h-4 w-4"/>
            Exporter PDF
        </Button>
    )
}
