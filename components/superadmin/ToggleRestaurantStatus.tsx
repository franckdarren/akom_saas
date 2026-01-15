'use client'

import { useState } from 'react'
import { toggleRestaurantStatus } from '@/lib/actions/superadmin'
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
import { toast } from 'sonner'
import { Power, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ToggleRestaurantStatusProps {
    restaurantId: string
    isActive: boolean
}

export function ToggleRestaurantStatus({
    restaurantId,
    isActive,
}: ToggleRestaurantStatusProps) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function handleToggle() {
        setLoading(true)

        try {
            const result = await toggleRestaurantStatus(restaurantId)

            if (result.error) {
                toast.error(result.error)
                return
            }

            toast.success(
                isActive
                    ? 'Restaurant désactivé avec succès'
                    : 'Restaurant activé avec succès'
            )

            router.refresh()
        } catch (error) {
            console.error('Erreur toggle status:', error)
            toast.error('Une erreur est survenue')
        } finally {
            setLoading(false)
        }
    }

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button
                    variant={isActive ? 'destructive' : 'default'}
                    disabled={loading}
                >
                    {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Power className="h-4 w-4" />
                    )}
                    {isActive ? 'Désactiver' : 'Activer'}
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        {isActive ? 'Désactiver' : 'Activer'} ce restaurant ?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {isActive
                            ? 'Le restaurant ne sera plus accessible aux utilisateurs. Vous pourrez le réactiver plus tard.'
                            : 'Le restaurant sera à nouveau accessible aux utilisateurs.'}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={handleToggle}>
                        Confirmer
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}