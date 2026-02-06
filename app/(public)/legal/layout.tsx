// app/(public)/legal/layout.tsx
import Link from 'next/link'

export default function LegalLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen">
            <header className="border-b">
                <div className="container py-4">
                    <Link href="/" className="text-lg font-bold">
                        Akôm
                    </Link>
                </div>
            </header>

            <main>{children}</main>

            <footer className="border-t mt-12">
                <div className="container py-8 text-center text-sm text-muted-foreground">
                    <p>&copy; {new Date().getFullYear()} Akôm. Tous droits réservés.</p>
                </div>
            </footer>
        </div>
    )
}