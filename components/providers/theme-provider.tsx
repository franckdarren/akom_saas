'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'

interface ThemeProviderProps {
    children: React.ReactNode
    attribute?: 'class' | 'data-theme'
    defaultTheme?: string
    enableSystem?: boolean
    disableTransitionOnChange?: boolean
}

// next-themes injecte un <script> inline anti-flash, exécuté au rendu serveur.
// Côté client il n'est jamais exécuté, mais React 19.2 avertit dès qu'il crée un
// <script> exécutable : on le déclare donc en bloc de données côté client.
const scriptProps = {
    type: typeof window === 'undefined' ? 'text/javascript' : 'application/json',
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
    return <NextThemesProvider {...props} scriptProps={scriptProps}>{children}</NextThemesProvider>
}