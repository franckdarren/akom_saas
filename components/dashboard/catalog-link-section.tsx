'use client'

/**
 * CatalogLinkSection.tsx
 * À intégrer dans restaurant-settings-form.tsx
 * Juste après la section "URL menu QR par table"
 *
 * Dépendances déjà présentes dans le projet :
 * - shadcn/ui : Card, Button, Badge, Input
 * - lucide-react : Copy, Check, ExternalLink, QrCode, Share2, Globe
 * - sonner : toast
 * - qrcode.react : QRCodeSVG (déjà utilisé dans qrcode-dialog.tsx)
 */

import {useState, useRef} from 'react'
import {toast} from 'sonner'
import {QRCodeSVG} from 'qrcode.react'
import {
    Copy,
    Check,
    ExternalLink,
    QrCode,
    Share2,
    Globe,
    Download,
} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Badge} from '@/components/ui/badge'
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'

interface CatalogLinkSectionProps {
    restaurantSlug: string
    restaurantName: string
}

export function CatalogLinkSection({
                                       restaurantSlug,
                                       restaurantName,
                                   }: CatalogLinkSectionProps) {
    const [copied, setCopied] = useState(false)
    const [showQR, setShowQR] = useState(false)
    const qrRef = useRef<SVGSVGElement>(null)

    const catalogUrl = `${process.env.NEXT_PUBLIC_APP_URL}/r/${restaurantSlug}`

    function handleCopy() {
        navigator.clipboard.writeText(catalogUrl)
        setCopied(true)
        toast.success('Lien catalogue copié dans le presse-papier')
        setTimeout(() => setCopied(false), 2000)
    }

    function handleShare() {
        if (navigator.share) {
            navigator.share({
                title: `Menu de ${restaurantName}`,
                text: `Commandez en ligne chez ${restaurantName}`,
                url: catalogUrl,
            })
        } else {
            handleCopy()
        }
    }

    function handleDownloadQR() {
        const svg = document.getElementById('catalog-qr-svg')
        if (!svg) return

        const svgData = new XMLSerializer().serializeToString(svg)
        const canvas = document.createElement('canvas')
        canvas.width = 400
        canvas.height = 400
        const ctx = canvas.getContext('2d')
        const img = new Image()
        img.onload = () => {
            ctx?.drawImage(img, 0, 0, 400, 400)
            const link = document.createElement('a')
            link.download = `qr-catalogue-${restaurantSlug}.png`
            link.href = canvas.toDataURL('image/png')
            link.click()
        }
        img.src = `data:image/svg+xml;base64,${btoa(svgData)}`
    }

    return (
        <>
            <Card
                className="border-2 border-dashed border-orange-200 bg-orange-50/30 dark:border-orange-900/40 dark:bg-orange-950/10">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div
                                className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/40">
                                <Globe className="h-4 w-4 text-orange-600 dark:text-orange-400"/>
                            </div>
                            <div>
                                <CardTitle className="text-sm font-semibold">
                                    Lien catalogue public
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Partageable sur WhatsApp, réseaux sociaux, carte de visite
                                </CardDescription>
                            </div>
                        </div>
                        <Badge
                            variant="outline"
                            className="border-green-200 bg-green-50 text-green-700 text-xs dark:border-green-800 dark:bg-green-950 dark:text-green-400"
                        >
                            🟢 Actif
                        </Badge>
                    </div>
                </CardHeader>

                <CardContent className="space-y-3">
                    {/* URL + boutons */}
                    <div className="flex gap-2">
                        <Input
                            value={catalogUrl}
                            readOnly
                            className="font-mono text-xs bg-white dark:bg-neutral-900 border-orange-200 dark:border-orange-900/40"
                        />
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={handleCopy}
                            className="shrink-0 border-orange-200 hover:border-orange-400 hover:bg-orange-50"
                            title="Copier le lien"
                        >
                            {copied ? (
                                <Check className="h-4 w-4 text-green-500"/>
                            ) : (
                                <Copy className="h-4 w-4"/>
                            )}
                        </Button>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 flex-wrap">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="gap-1.5 text-xs border-orange-200 hover:border-orange-400 hover:bg-orange-50"
                            onClick={() => setShowQR(true)}
                        >
                            <QrCode className="h-3.5 w-3.5"/>
                            QR Code
                        </Button>

                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="gap-1.5 text-xs border-orange-200 hover:border-orange-400 hover:bg-orange-50"
                            onClick={handleShare}
                        >
                            <Share2 className="h-3.5 w-3.5"/>
                            Partager
                        </Button>

                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="gap-1.5 text-xs border-orange-200 hover:border-orange-400 hover:bg-orange-50"
                            asChild
                        >
                            <a href={catalogUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-3.5 w-3.5"/>
                                Aperçu
                            </a>
                        </Button>
                    </div>

                    {/* Info */}
                    <p className="text-[11px] text-muted-foreground leading-relaxed border-t border-orange-100 dark:border-orange-900/30 pt-3">
                        Ce lien permet à vos clients de commander à emporter ou de réserver une table, sans scanner de
                        QR. Les commandes issues de ce lien sont identifiées comme{' '}
                        <span className="font-semibold text-orange-600 dark:text-orange-400">
              Source : Catalogue public
            </span>{' '}
                        dans vos statistiques.
                    </p>
                </CardContent>
            </Card>

            {/* Dialog QR Code */}
            <Dialog open={showQR} onOpenChange={setShowQR}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>QR Code — Catalogue public</DialogTitle>
                    </DialogHeader>

                    <div className="flex flex-col items-center gap-4 py-2">
                        <div className="rounded-2xl border-2 border-orange-100 bg-white p-4 shadow-sm">
                            <QRCodeSVG
                                id="catalog-qr-svg"
                                value={catalogUrl}
                                size={200}
                                level="H"
                                includeMargin={false}
                                fgColor="#1C1008"
                            />
                        </div>

                        <div className="text-center space-y-1">
                            <p className="text-sm font-semibold">{restaurantName}</p>
                            <p className="text-xs text-muted-foreground">
                                Commandez & réservez en ligne
                            </p>
                        </div>

                        <div className="flex gap-2 w-full">
                            <Button
                                variant="outline"
                                className="flex-1 gap-2"
                                onClick={handleCopy}
                            >
                                {copied ? <Check className="h-4 w-4 text-green-500"/> : <Copy className="h-4 w-4"/>}
                                Copier le lien
                            </Button>
                            <Button
                                className="flex-1 gap-2 bg-orange-600 hover:bg-orange-700"
                                onClick={handleDownloadQR}
                            >
                                <Download className="h-4 w-4"/>
                                Télécharger
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}