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
                <div className="container py-4">
                    <Link href="/" aria-label="Accueil Akôm">
                        <Logo size="md" />
                    </Link>
                </div>
            </header>

            <main>{children}</main>

            <footer className="border-t mt-12">
                <div className="container py-8 text-center mx-auto">
                    <p className="type-caption">&copy; {new Date().getFullYear()} Akôm. Tous droits réservés.</p>
                </div>
            </footer>
        </div>
    )
}