// components/ui/pagination-controls.tsx
import Link from 'next/link'
import {Button} from '@/components/ui/button'
import {ChevronLeft, ChevronRight} from 'lucide-react'

interface PaginationControlsProps {
    page: number
    totalPages: number
    basePath: string
    // Paramètres de recherche/filtre à conserver d'une page à l'autre (ex: {q: "burger"})
    searchParams?: Record<string, string | undefined>
}

function buildHref(basePath: string, page: number, searchParams?: Record<string, string | undefined>) {
    const params = new URLSearchParams()
    if (searchParams) {
        for (const [key, value] of Object.entries(searchParams)) {
            if (value) params.set(key, value)
        }
    }
    params.set('page', String(page))
    return `${basePath}?${params.toString()}`
}

export function PaginationControls({page, totalPages, basePath, searchParams}: PaginationControlsProps) {
    if (totalPages <= 1) return null

    const prevHref = page > 1 ? buildHref(basePath, page - 1, searchParams) : null
    const nextHref = page < totalPages ? buildHref(basePath, page + 1, searchParams) : null

    return (
        <div className="flex items-center justify-between">
            <p className="type-caption text-muted-foreground">
                Page {page} sur {totalPages}
            </p>
            <div className="layout-inline">
                {prevHref ? (
                    <Button variant="outline" size="sm" asChild>
                        <Link href={prevHref}>
                            <ChevronLeft className="h-4 w-4"/>
                            Précédent
                        </Link>
                    </Button>
                ) : (
                    <Button variant="outline" size="sm" disabled>
                        <ChevronLeft className="h-4 w-4"/>
                        Précédent
                    </Button>
                )}
                {nextHref ? (
                    <Button variant="outline" size="sm" asChild>
                        <Link href={nextHref}>
                            Suivant
                            <ChevronRight className="h-4 w-4"/>
                        </Link>
                    </Button>
                ) : (
                    <Button variant="outline" size="sm" disabled>
                        Suivant
                        <ChevronRight className="h-4 w-4"/>
                    </Button>
                )}
            </div>
        </div>
    )
}
