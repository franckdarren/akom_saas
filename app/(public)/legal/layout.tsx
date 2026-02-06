// app/(public)/legal/layout.tsx
import Link from 'next/link'

export default function LegalLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen">
            <header className="border-b px-4">
                <div className="container py-4">
                    <Link href="/" className="text-lg font-bold">
                        Akôm
                    </Link>
                </div>
            </header>

            <main>{children}</main>

            <footer className="border-t mt-12 border">
                <div className="container py-8 text-center text-sm text-muted-foreground mx-auto">
                    <p>&copy; {new Date().getFullYear()} Akôm. Tous droits réservés.</p>
                </div>
            </footer>
        </div>
    )
}