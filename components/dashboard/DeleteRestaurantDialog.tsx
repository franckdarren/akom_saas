// components/dashboard/DeleteRestaurantDialog.tsx
'use client'

import {useState, useTransition} from 'react'
import {useRouter} from 'next/navigation'
import {deleteRestaurant} from '@/lib/actions/restaurant'
import {useRestaurant} from '@/lib/hooks/use-restaurant'
import {useNavigationLoading} from '@/lib/hooks/use-navigation-loading'
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {Button} from '@/components/ui/button'
import {LoadingButton} from '@/components/ui/loading-button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Alert, AlertDescription} from '@/components/ui/alert'
import {toast} from 'sonner'
import {AlertTriangle, Trash2} from 'lucide-react'

interface DeleteRestaurantDialogProps {
    restaurantId: string
    restaurantName: string
}

export function DeleteRestaurantDialog({
                                           restaurantId,
                                           restaurantName,
                                       }: DeleteRestaurantDialogProps) {
    const router = useRouter()
    const {startLoading} = useNavigationLoading()
    const {restaurants, setCurrentRestaurant, refreshRestaurants} = useRestaurant()

    const [open, setOpen] = useState(false)
    const [confirmName, setConfirmName] = useState('')
    const [isPending, startTransition] = useTransition()

    const isConfirmed = confirmName.trim() === restaurantName.trim()

    function handleOpenChange(next: boolean) {
        if (!isPending) {
            if (!next) setConfirmName('')
            setOpen(next)
        }
    }

    function handleDelete() {
        if (!isConfirmed) return

        startTransition(async () => {
            const result = await deleteRestaurant(restaurantId)

            if (!result.success) {
                toast.error(result.error ?? 'Une erreur est survenue')
                return
            }

            toast.success(`"${restaurantName}" a été supprimé.`)

            // Rafraîchir la liste et basculer vers une autre structure
            await refreshRestaurants()
            const remaining = restaurants.filter(r => r.id !== restaurantId)
            if (remaining.length > 0) {
                setCurrentRestaurant(remaining[0])
                document.cookie = `akom_current_restaurant_id=${remaining[0].id}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`
            }

            setOpen(false)
            startLoading()
            router.push('/dashboard')
            router.refresh()
        })
    }

    return (
        <>
            {/* Bouton déclencheur */}
            <Button
                variant="destructive"
                size="sm"
                onClick={() => setOpen(true)}
                className="gap-1.5 w-fit"
            >
                <Trash2 className="h-3.5 w-3.5"/>
                Supprimer cette structure
            </Button>

            {/* Dialog de confirmation */}
            <AlertDialog open={open} onOpenChange={handleOpenChange}>
                <AlertDialogContent className="max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                            <Trash2 className="h-5 w-5"/>
                            Supprimer cette structure
                        </AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-4">

                                {/* Avertissement */}
                                <Alert variant="destructive" className="border-destructive/50">
                                    <AlertTriangle className="h-4 w-4"/>
                                    <AlertDescription className="text-sm">
                                        Cette action est <strong>irréversible</strong>. Toutes les données
                                        seront définitivement supprimées.
                                    </AlertDescription>
                                </Alert>

                                {/* Liste de ce qui sera supprimé */}
                                <div className="rounded-lg border bg-muted/30 p-3 space-y-1.5">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        Données supprimées
                                    </p>
                                    {[
                                        'Tous les produits et catégories',
                                        "Tout l'historique des commandes",
                                        'Toutes les tables et QR codes',
                                        "Tout le stock et l'entrepôt",
                                        'Les membres et leurs accès',
                                        "L'abonnement de cette structure",
                                    ].map(item => (
                                        <div
                                            key={item}
                                            className="flex items-center gap-2 text-xs text-muted-foreground"
                                        >
                                            <div className="h-1 w-1 rounded-full bg-destructive shrink-0"/>
                                            {item}
                                        </div>
                                    ))}
                                </div>

                                {/* Confirmation par saisie du nom */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="confirm-name" className="text-sm">
                                        Tapez{' '}
                                        <strong className="text-foreground select-none">
                                            {restaurantName}
                                        </strong>{' '}
                                        pour confirmer
                                    </Label>
                                    <Input
                                        id="confirm-name"
                                        value={confirmName}
                                        onChange={e => setConfirmName(e.target.value)}
                                        placeholder={restaurantName}
                                        disabled={isPending}
                                        autoComplete="off"
                                        className={isConfirmed ? 'border-destructive focus-visible:ring-destructive' : ''}
                                    />
                                </div>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPending}>
                            Annuler
                        </AlertDialogCancel>
                        <LoadingButton
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={!isConfirmed}
                            isLoading={isPending}
                            loadingText="Suppression…"
                            icon={<Trash2 className="h-4 w-4" />}
                            className="gap-1.5"
                        >
                            Supprimer définitivement
                        </LoadingButton>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}