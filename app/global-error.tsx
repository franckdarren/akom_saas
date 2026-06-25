'use client'

import {useEffect} from 'react'
import {AlertTriangle, RotateCcw} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {Logo} from '@/components/ui/logo'

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & {digest?: string}
    reset: () => void
}) {
    useEffect(() => {
        console.error(error)
    }, [error])

    return (
        <html lang="fr">
            <body className="antialiased">
                <main className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-background p-6">
                    <div className="relative flex w-full max-w-md flex-col items-center gap-6 text-center">
                        <Logo size="lg" variant="color" className="text-foreground"/>

                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
                            <AlertTriangle className="h-6 w-6 text-destructive"/>
                        </div>

                        <div className="space-y-2">
                            <h1 className="type-section-title">Erreur inattendue</h1>
                            <p className="type-body-muted">
                                L’application a rencontré un problème. Veuillez
                                réessayer dans un instant.
                            </p>
                            {error.digest && (
                                <p className="type-caption">Code : {error.digest}</p>
                            )}
                        </div>

                        <Button onClick={reset}>
                            <RotateCcw className="h-4 w-4"/>
                            Réessayer
                        </Button>
                    </div>
                </main>
            </body>
        </html>
    )
}
