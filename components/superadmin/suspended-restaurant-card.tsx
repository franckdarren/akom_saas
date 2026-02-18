'use client'

import {useState} from 'react'
import {useRouter} from 'next/navigation'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Label} from '@/components/ui/label'
import {Textarea} from '@/components/ui/textarea'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
    PlayCircle,
    Calendar,
    FileText,
    Loader2,
    AlertCircle,
    Info
} from 'lucide-react'
import {toast} from 'sonner'
import {reactivateSuspendedRestaurant} from '@/lib/actions/superadmin/restaurant-verification'

interface SuspendedRestaurantCardProps {
    restaurant: {
        id: string
        name: string
        slug: string
        createdAt: Date
        updatedAt: Date
        verificationDocuments: {
            profilePhotoUrl: string | null
            identityDocumentUrl: string | null
        } | null
        circuitSheet: {
            deadlineAt: Date
            isSubmitted: boolean
            autoSuspendedAt: Date | null
        } | null
    }
    suspensionReason: 'circuit_sheet' | 'other'
}

export function SuspendedRestaurantCard({restaurant, suspensionReason}: SuspendedRestaurantCardProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [reactivationComment, setReactivationComment] = useState('')
    const [showReactivateDialog, setShowReactivateDialog] = useState(false)
    const [showConfirmDialog, setShowConfirmDialog] = useState(false)

    async function handleReactivate() {
        if (!reactivationComment.trim()) {
            toast.error('Veuillez fournir un commentaire pour la réactivation')
            return
        }

        setIsLoading(true)

        const result = await reactivateSuspendedRestaurant(
            restaurant.id,
            reactivationComment.trim()
        )

        if (result.success) {
            toast.success(`Restaurant ${restaurant.name} réactivé avec succès`)
            router.refresh()
            setShowReactivateDialog(false)
            setShowConfirmDialog(false)
            setReactivationComment('')
        } else {
            toast.error(result.error || 'Erreur lors de la réactivation')
        }

        setIsLoading(false)
    }

    return (
        <Card className="overflow-hidden border-destructive">
            <CardHeader className="bg-destructive/50">
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle className="text-lg">{restaurant.name}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                            Slug: <code className="text-xs">{restaurant.slug}</code>
                        </p>
                    </div>
                    <Badge variant="destructive">
                        <AlertCircle className="mr-1 h-3 w-3"/>
                        Suspendu
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="pt-6 space-y-4">
                {/* Infos de base */}
                <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4"/>
                        <span>
              Créé le {new Date(restaurant.createdAt).toLocaleDateString('fr-FR')}
            </span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <AlertCircle className="h-4 w-4"/>
                        <span>
              Suspendu le {new Date(restaurant.updatedAt).toLocaleDateString('fr-FR')}
            </span>
                    </div>
                </div>

                {/* Raison de suspension */}
                <div className="p-3 bg-destructive/50 rounded-lg border border-destructive/60">
                    <div className="flex items-start gap-2">
                        <Info className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0"/>
                        <div className="text-sm">
                            <p className="font-medium text-destructive-foreground mb-1">
                                Raison de la suspension
                            </p>
                            {suspensionReason === 'circuit_sheet' ? (
                                <p className="text-destructive-foreground">
                                    Fiche circuit non soumise dans les délais (deadline:{' '}
                                    {restaurant.circuitSheet &&
                                        new Date(restaurant.circuitSheet.deadlineAt).toLocaleDateString('fr-FR')
                                    })
                                </p>
                            ) : (
                                <p className="text-destructive-foreground">
                                    Suspension manuelle ou autre raison
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Fiche circuit */}
                {suspensionReason === 'circuit_sheet' && restaurant.circuitSheet && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <FileText className="h-4 w-4"/>
                            <span className="text-sm font-medium">Fiche circuit</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {restaurant.circuitSheet.isSubmitted
                                ? 'Soumise - En attente de validation dans l\'onglet "Fiches circuit"'
                                : 'Non soumise - Le restaurant doit la soumettre pour être réactivé'
                            }
                        </p>
                    </div>
                )}

                {/* Actions */}
                <div className="pt-2">
                    {suspensionReason === 'circuit_sheet' && restaurant.circuitSheet?.isSubmitted ? (
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => router.push('/superadmin/circuit-sheets')}
                        >
                            <FileText className="mr-2 h-4 w-4"/>
                            Aller valider la fiche circuit
                        </Button>
                    ) : (
                        <Dialog open={showReactivateDialog} onOpenChange={setShowReactivateDialog}>
                            <DialogTrigger asChild>
                                <Button variant="default" className="w-full">
                                    <PlayCircle className="mr-2 h-4 w-4"/>
                                    Réactiver manuellement
                                </Button>
                            </DialogTrigger>

                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Réactiver {restaurant.name}</DialogTitle>
                                    <DialogDescription>
                                        Cette réactivation manuelle lèvera la suspension et rendra le restaurant
                                        actif. Utilisez cette option uniquement si nécessaire.
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="reactivation-comment">
                                            Commentaire de réactivation <span className="text-destructive">*</span>
                                        </Label>
                                        <Textarea
                                            id="reactivation-comment"
                                            placeholder="Ex: Exception accordée suite à discussion téléphonique avec le gérant"
                                            value={reactivationComment}
                                            onChange={(e) => setReactivationComment(e.target.value)}
                                            disabled={isLoading}
                                            rows={3}
                                            className="resize-none"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Ce commentaire sera enregistré dans l'historique.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setShowReactivateDialog(false)
                                            setReactivationComment('')
                                        }}
                                        disabled={isLoading}
                                    >
                                        Annuler
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            setShowReactivateDialog(false)
                                            setShowConfirmDialog(true)
                                        }}
                                        disabled={isLoading || !reactivationComment.trim()}
                                        variant="default"
                                    >
                                        Continuer
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    )}

                    {/* Confirmation finale */}
                    <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>
                                    Confirmer la réactivation ?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                    Vous êtes sur le point de réactiver {restaurant.name}.
                                    {suspensionReason === 'circuit_sheet' && (
                                        <span className="block mt-2 text-warning font-medium">
                      ⚠️ Attention : ce restaurant n'a pas soumis sa fiche circuit. 
                      Assurez-vous d'une raison valable.
                    </span>
                                    )}
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel
                                    disabled={isLoading}
                                    onClick={() => setShowReactivateDialog(true)}
                                >
                                    Retour
                                </AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleReactivate}
                                    disabled={isLoading}
                                    variant="default"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin"/>
                                            Réactivation...
                                        </>
                                    ) : (
                                        'Confirmer la réactivation'
                                    )}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </CardContent>
        </Card>
    )
}
