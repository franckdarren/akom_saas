'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default function SuperadminError({
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
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6">
            <AlertTriangle className="h-12 w-12 text-destructive" />
            <div className="text-center space-y-2">
                <h2 className="text-xl font-semibold">Erreur d'administration</h2>
                <p className="text-muted-foreground text-sm">
                    Impossible de charger cette section. Veuillez réessayer.
                </p>
            </div>
            <Button onClick={reset} variant="outline">
                Réessayer
            </Button>
        </div>
    )
}
