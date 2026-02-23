import {ReactNode} from 'react'
import {Card, CardContent} from '@/components/ui/card'

export default function AuthLayout({children}: { children: ReactNode }) {
    return (
        <div
            className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-800 p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
                        Akôm
                    </h1>
                    <p className="text-zinc-600 dark:text-zinc-400 mt-2">
                        Le cœur digital de votre activité commerciale
                    </p>
                </div>

                {/* Card avec shadcn */}
                <Card>
                    <CardContent className="p-8">
                        {children}
                    </CardContent>
                </Card>

                {/* Footer */}
                <p className="text-center text-sm text-zinc-600 dark:text-zinc-400 mt-8">
                    © {new Date().getFullYear()} Akôm. Tous droits réservés.
                </p>
            </div>
        </div>
    )
}