'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RotateCcw } from 'lucide-react'

export default function DashboardError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error(error)
    }, [error])

    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 p-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div className="space-y-2">
                <h2 className="type-section-title">Une erreur est survenue</h2>
                <p className="type-body-muted">
                    Impossible de charger cette page. Veuillez réessayer.
                </p>
                {error.digest && (
                    <p className="type-caption">Code : {error.digest}</p>
                )}
            </div>
            <Button onClick={reset} variant="outline">
                <RotateCcw className="h-4 w-4" />
                Réessayer
            </Button>
        </div>
    )
}
