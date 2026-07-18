// app/(dashboard)/dashboard/inventory/open-session-button.tsx
'use client'

import {useRouter} from 'next/navigation'
import {Loader2} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {useNavigationLoading} from '@/lib/hooks/use-navigation-loading'

// ============================================================
// Ouverture d'une session d'inventaire depuis la liste
// ------------------------------------------------------------
// Un simple <Link> ne donnait aucun retour au clic : l'écran de comptage
// charge des centaines de lignes, l'utilisateur cliquait donc plusieurs fois
// en pensant que rien ne se passait.
// ============================================================

export function OpenSessionButton({
    sessionId,
    label,
}: {
    sessionId: string
    label: string
}) {
    const router = useRouter()
    const {loading, startLoading} = useNavigationLoading()

    function handleClick() {
        startLoading()
        router.push(`/dashboard/inventory/${sessionId}`)
    }

    return (
        <Button variant="outline" size="sm" onClick={handleClick} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin"/>}
            {label}
        </Button>
    )
}
