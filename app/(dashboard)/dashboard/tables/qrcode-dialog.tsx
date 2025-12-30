// app/(dashboard)/dashboard/tables/qrcode-dialog.tsx
'use client'

import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, Printer, Download } from 'lucide-react'
import { getTableQRCodeUrl } from '@/lib/actions/table'

type Table = {
    id: string
    number: number
}

export function QRCodeDialog({
    table,
    open,
    onOpenChange,
}: {
    table: Table
    open: boolean
    onOpenChange: (open: boolean) => void
}) {
    const [url, setUrl] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (open) {
            loadQRCodeUrl()
        }
    }, [open, table.id])

    async function loadQRCodeUrl() {
        setIsLoading(true)
        setError(null)

        const result = await getTableQRCodeUrl(table.id)

        if (result.error) {
            setError(result.error)
        } else {
            setUrl(result.url || null)
        }

        setIsLoading(false)
    }

    function handlePrint() {
        window.print()
    }

    function handleDownload() {
        if (!url) return

        // Récupérer le SVG du QR code
        const svg = document.getElementById('qr-code-svg')
        if (!svg) return

        // Convertir en canvas puis en image
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const svgData = new XMLSerializer().serializeToString(svg)
        const img = new Image()

        img.onload = () => {
            canvas.width = img.width
            canvas.height = img.height
            ctx?.drawImage(img, 0, 0)

            // Télécharger
            const link = document.createElement('a')
            link.download = `table-${table.number}-qrcode.png`
            link.href = canvas.toDataURL('image/png')
            link.click()
        }

        img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>QR Code - Table {table.number}</DialogTitle>
                    <DialogDescription>
                        Scannez ce code pour accéder au menu
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {isLoading && (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {!isLoading && !error && url && (
                        <>
                            {/* Zone imprimable */}
                            <div
                                id="qr-printable"
                                className="flex flex-col items-center justify-center p-8 bg-white rounded-lg border-2 border-dashed print:border-solid print:border-black"
                            >
                                <QRCodeSVG
                                    id="qr-code-svg"
                                    value={url}
                                    size={256}
                                    level="H"
                                    includeMargin
                                />
                                <div className="mt-4 text-center">
                                    <p className="text-2xl font-bold">Table {table.number}</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Scannez pour commander
                                    </p>
                                </div>
                            </div>

                            {/* URL (non imprimable) */}
                            <div className="print:hidden">
                                <p className="text-xs text-muted-foreground break-all">
                                    {url}
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 print:hidden">
                                <Button onClick={handlePrint} className="flex-1">
                                    <Printer className="h-4 w-4 mr-2" />
                                    Imprimer
                                </Button>
                                <Button onClick={handleDownload} variant="outline" className="flex-1">
                                    <Download className="h-4 w-4 mr-2" />
                                    Télécharger
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </DialogContent>

            {/* Style d'impression */}
            <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #qr-printable,
          #qr-printable * {
            visibility: visible;
          }
          #qr-printable {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
          }
        }
      `}</style>
        </Dialog>
    )
}