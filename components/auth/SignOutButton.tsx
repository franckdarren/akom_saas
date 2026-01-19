'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { LogOut, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface SignOutButtonProps {
    variant?: 'default' | 'outline' | 'ghost' | 'destructive'
    size?: 'default' | 'sm' | 'lg' | 'icon'
    showConfirmation?: boolean
    redirectTo?: string
}

export function SignOutButton({
    variant = 'ghost',
    size = 'sm',
    showConfirmation = true,
    redirectTo = '/login',
}: SignOutButtonProps) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function handleSignOut() {
        setLoading(true)

        try {
            // On appelle l'action serveur. 
            // Comme elle contient redirect('/login'), l'exécution s'arrêtera ici
            // et le navigateur changera de page automatiquement.
            await signOut()

            // NE PAS AJOUTER router.push() ICI
        } catch (error: any) {
            // Important : redirect() lève une erreur spéciale que Next.js utilise.
            // On vérifie si c'est une vraie erreur ou juste la redirection.
            if (error.message !== 'NEXT_REDIRECT') {
                console.error('Erreur déconnexion:', error)
                toast.error('Erreur lors de la déconnexion')
                setLoading(false)
            }
        }
    }

    // Avec confirmation
    if (showConfirmation) {
        return (
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant={variant} size={size} disabled={loading}>
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <LogOut className="h-4 w-4" />
                        )}
                        Déconnexion
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmer la déconnexion</AlertDialogTitle>
                        <AlertDialogDescription>
                            Êtes-vous sûr de vouloir vous déconnecter ? Vous devrez vous
                            reconnecter pour accéder à nouveau au dashboard.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={handleSignOut}>
                            {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            Déconnexion
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        )
    }

    // Sans confirmation
    return (
        <Button
            variant={variant}
            size={size}
            onClick={handleSignOut}
            disabled={loading}
        >
            {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <LogOut className="h-4 w-4" />
            )}
            Déconnexion
        </Button>
    )
}