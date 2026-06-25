import Link from 'next/link'
import {Home, Search, ArrowLeft} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {Logo} from '@/components/ui/logo'

export default function NotFound() {
    return (
        <main className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-background p-6">
            {/* Halo décoratif */}
            <div
                aria-hidden
                className="pointer-events-none absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
            />

            <div className="relative flex w-full max-w-md flex-col items-center gap-6 text-center">
                <Link href="/" aria-label="Akôm — accueil">
                    <Logo size="lg" variant="color" className="text-foreground"/>
                </Link>

                <div className="flex flex-col items-center gap-3">
                    <span className="type-hero-title bg-gradient-to-b from-primary to-primary/40 bg-clip-text text-transparent">
                        404
                    </span>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                        <Search className="h-5 w-5 text-muted-foreground"/>
                    </div>
                </div>

                <div className="space-y-2">
                    <h1 className="type-section-title">Page introuvable</h1>
                    <p className="type-body-muted">
                        La page que vous recherchez n’existe pas, a été déplacée
                        ou n’est plus disponible.
                    </p>
                </div>

                <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
                    <Button asChild>
                        <Link href="/">
                            <Home className="h-4 w-4"/>
                            Retour à l’accueil
                        </Link>
                    </Button>
                    <Button asChild variant="outline">
                        <Link href="/dashboard">
                            <ArrowLeft className="h-4 w-4"/>
                            Mon tableau de bord
                        </Link>
                    </Button>
                </div>
            </div>
        </main>
    )
}
