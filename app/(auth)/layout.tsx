import {ReactNode} from 'react'
import {AppCard, CardContent} from '@/components/ui/app-card'

export default function AuthLayout({children}: { children: ReactNode }) {
    return (
        <div
            className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-800 p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-4 sm:mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
                        Akôm
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Le cœur digital de votre activité commerciale
                    </p>
                </div>

                {/* AppCard avec shadcn */}
                <AppCard>
                    <CardContent className="p-4 sm:p-8">
                        {children}
                    </CardContent>
                </AppCard>

                {/* Footer */}
                <p className="text-center text-sm text-muted-foreground mt-4 sm:mt-8">
                    © {new Date().getFullYear()} Akôm. Tous droits réservés.
                </p>
            </div>
        </div>
    )
}