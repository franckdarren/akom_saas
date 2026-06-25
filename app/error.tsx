'use client'

import {useEffect} from 'react'
import Link from 'next/link'
import {AlertTriangle, RotateCcw, Home} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {Logo} from '@/components/ui/logo'

export default function AppError({
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
        <main className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-background p-6">
            <div
                aria-hidden
                className="pointer-events-none absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-destructive/10 blur-3xl"
            />

            <div className="relative flex w-full max-w-md flex-col items-center gap-6 text-center">
                <Link href="/" aria-label="Akôm — accueil">
                    <Logo size="lg" variant="color" className="text-foreground"/>
                </Link>

                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
                    <AlertTriangle className="h-6 w-6 text-destructive"/>
                </div>

                <div className="space-y-2">
                    <h1 className="type-section-title">Une erreur est survenue</h1>
                    <p className="type-body-muted">
                        Quelque chose s’est mal passé de notre côté. Vous pouvez
                        réessayer ou revenir à l’accueil.
                    </p>
                    {error.digest && (
                        <p className="type-caption">Code : {error.digest}</p>
                    )}
                </div>

                <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
                    <Button onClick={reset}>
                        <RotateCcw className="h-4 w-4"/>
                        Réessayer
                    </Button>
                    <Button asChild variant="outline">
                        <Link href="/">
                            <Home className="h-4 w-4"/>
                            Retour à l’accueil
                        </Link>
                    </Button>
                </div>
            </div>
        </main>
    )
}
