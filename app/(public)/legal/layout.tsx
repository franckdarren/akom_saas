// app/(public)/legal/layout.tsx
import Link from 'next/link'
import { Logo } from '@/components/ui/logo'

export default function LegalLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen">
            <header className="border-b px-4">
                <div className="container py-4 flex items-center justify-between">
                    <Link href="/" aria-label="Accueil Akôm">
                        <Logo size="md" />
                    </Link>
                    <Link
                        href="/"
                        className="layout-inline type-caption text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M19 12H5"/><path d="m12 5-7 7 7 7"/>
                        </svg>
                        Retour à l&apos;accueil
                    </Link>
                </div>
            </header>

            <main>{children}</main>

            <footer className="border-t mt-12">
                <div className="container py-8 mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="type-caption">&copy; {new Date().getFullYear()} Akôm. Tous droits réservés.</p>
                    <nav className="flex flex-wrap gap-4 type-caption">
                        <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
                            Accueil
                        </Link>
                        <Link href="/legal/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                            Confidentialité
                        </Link>
                        <Link href="/legal/terms" className="text-muted-foreground hover:text-foreground transition-colors">
                            CGU
                        </Link>
                        <Link href="/legal/cookies" className="text-muted-foreground hover:text-foreground transition-colors">
                            Cookies
                        </Link>
                    </nav>
                </div>
            </footer>
        </div>
    )
}