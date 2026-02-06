// components/rgpd/CookiePreferencesActions.tsx
'use client'

/**
 * Composant client pour les actions de gestion des préférences cookies.
 * 
 * Ce composant doit être un Client Component car il :
 * - Utilise des event handlers (onClick)
 * - Manipule le localStorage (API navigateur)
 * - Déclenche un rechargement de page
 * 
 * Il est extrait du Server Component principal pour garder
 * le maximum de contenu en Server Component (meilleur pour SEO).
 */

interface CookiePreferencesActionsProps {
    variant?: 'primary' | 'secondary'
    size?: 'sm' | 'md' | 'lg'
    className?: string
}

export function CookiePreferencesButton({
    variant = 'primary',
    size = 'md',
    className = '',
}: CookiePreferencesActionsProps) {
    const handleResetPreferences = () => {
        // Supprimer les préférences stockées
        if (typeof window !== 'undefined') {
            localStorage.removeItem('cookie-consent')
            // Recharger la page pour afficher à nouveau le banner
            window.location.reload()
        }
    }

    // Classes de base selon la variante
    const baseClasses = variant === 'primary'
        ? 'bg-blue-600 text-white hover:bg-blue-700'
        : 'text-gray-600 hover:text-gray-900 underline bg-transparent'

    // Classes de taille
    const sizeClasses = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base',
    }[size]

    // Classes communes
    const commonClasses = 'font-medium rounded-lg transition-colors'

    return (
        <button
            onClick={handleResetPreferences}
            className={`${baseClasses} ${sizeClasses} ${commonClasses} ${className}`}
        >
            Modifier mes préférences cookies
        </button>
    )
}

/**
 * Version inline du bouton pour les liens texte
 * (utilisé dans le footer de la page)
 */
export function CookiePreferencesLink({
    className = '',
}: {
    className?: string
}) {
    const handleResetPreferences = () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('cookie-consent')
            window.location.reload()
        }
    }

    return (
        <button
            onClick={handleResetPreferences}
            className={`text-sm text-gray-600 hover:text-gray-900 underline ${className}`}
        >
            Modifier mes préférences
        </button>
    )
}