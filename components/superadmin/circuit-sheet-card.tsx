'use client'

import {useState} from 'react'
import {useRouter} from 'next/navigation'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Progress} from '@/components/ui/progress'
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    CheckCircle,
    Calendar,
    ExternalLink,
    Loader2,
    Eye,
    FileText,
    AlertTriangle,
    Clock,
} from 'lucide-react'
import {toast} from 'sonner'
import {validateCircuitSheet} from '@/lib/actions/superadmin/restaurant-verification'
import {
    getDaysRemaining,
    isDeadlineOverdue,
    getDeadlineMessage,
} from '@/types/restaurant-verification'

interface CircuitSheetCardProps {
    circuitSheet: {
        id: string
        restaurantId: string
        circuitSheetUrl: string | null
        circuitSheetUploadedAt: Date | null
        deadlineAt: Date
        isSubmitted: boolean
        isValidated: boolean
        restaurant: {
            id: string
            name: string
            slug: string
        }
    }
}

export function CircuitSheetCard({circuitSheet}: CircuitSheetCardProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [showValidateDialog, setShowValidateDialog] = useState(false)

    const deadlineAt = new Date(circuitSheet.deadlineAt)
    const daysRemaining = getDaysRemaining(deadlineAt)
    const isOverdue = isDeadlineOverdue(deadlineAt)
    const deadlineMessage = getDeadlineMessage(deadlineAt)

    const progressValue = Math.min(
        Math.max(((90 - daysRemaining) / 90) * 100, 0),
        100
    )

    async function handleValidate() {
        setIsLoading(true)

        const result = await validateCircuitSheet(circuitSheet.restaurantId)

        if (result.success) {
            toast.success(`Fiche circuit validée`)
            router.refresh()
        } else {
            toast.error(result.error || 'Erreur lors de la validation')
        }

        setIsLoading(false)
        setShowValidateDialog(false)
    }

    return (
        <Card className={isOverdue ? 'border-destructive' : ''}>
            <CardHeader className="bg-muted/40">
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle className="text-lg">
                            {circuitSheet.restaurant.name}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                            Slug:{' '}
                            <code className="text-xs">
                                {circuitSheet.restaurant.slug}
                            </code>
                        </p>
                    </div>

                    {isOverdue && (
                        <Badge variant="destructive">
                            <AlertTriangle className="mr-1 h-3 w-3"/>
                            En retard
                        </Badge>
                    )}
                </div>
            </CardHeader>

            <CardContent className="pt-6 space-y-6">
                {/* Deadline */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              Échéance
            </span>

                        <Badge variant={deadlineMessage.variant}>
                            {isOverdue ? (
                                <AlertTriangle className="mr-1 h-3 w-3"/>
                            ) : (
                                <Clock className="mr-1 h-3 w-3"/>
                            )}
                            {deadlineMessage.message}
                        </Badge>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4"/>
                        {deadlineAt.toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                        })}
                    </div>

                    {/* Progress shadcn */}
                    <Progress value={progressValue}/>
                </div>

                {/* Document */}
                <div className="flex items-center justify-between p-4 bg-muted/40 rounded-xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-background rounded-lg border">
                            <FileText className="h-4 w-4"/>
                        </div>
                        <div>
                            <p className="text-sm font-medium">
                                Fiche circuit
                            </p>
                            {circuitSheet.circuitSheetUploadedAt && (
                                <p className="text-xs text-muted-foreground">
                                    Soumise le{' '}
                                    {new Date(
                                        circuitSheet.circuitSheetUploadedAt
                                    ).toLocaleDateString('fr-FR')}
                                </p>
                            )}
                        </div>
                    </div>

                    {circuitSheet.circuitSheetUrl ? (
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <Eye className="h-4 w-4 mr-2"/>
                                    Voir
                                </Button>
                            </DialogTrigger>

                            <DialogContent className="max-w-4xl max-h-[90vh]">
                                <DialogHeader>
                                    <DialogTitle>
                                        Fiche circuit
                                    </DialogTitle>
                                    <DialogDescription>
                                        Vérifiez le document avant validation
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-4">
                                    {circuitSheet.circuitSheetUrl.endsWith('.pdf') ? (
                                        <iframe
                                            src={circuitSheet.circuitSheetUrl}
                                            className="w-full h-[600px] rounded-lg border"
                                            title="Fiche circuit PDF"
                                        />
                                    ) : (
                                        <img
                                            src={circuitSheet.circuitSheetUrl}
                                            className="w-full rounded-lg border object-contain"
                                            alt="Fiche circuit"
                                        />
                                    )}

                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() =>
                                            window.open(
                                                circuitSheet.circuitSheetUrl!,
                                                '_blank'
                                            )
                                        }
                                    >
                                        <ExternalLink className="h-4 w-4 mr-2"/>
                                        Ouvrir dans un nouvel onglet
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    ) : (
                        <Badge variant="secondary">
                            Non soumise
                        </Badge>
                    )}
                </div>

                {/* Validation */}
                {circuitSheet.circuitSheetUrl && (
                    <AlertDialog
                        open={showValidateDialog}
                        onOpenChange={setShowValidateDialog}
                    >
                        <Button
                            onClick={() => setShowValidateDialog(true)}
                            disabled={isLoading}
                            className="w-full"
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin"/>
                            ) : (
                                <CheckCircle className="h-4 w-4 mr-2"/>
                            )}
                            Valider la fiche circuit
                        </Button>

                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>
                                    Confirmer la validation ?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                    Cette action confirmera que la fiche est conforme.
                                </AlertDialogDescription>
                            </AlertDialogHeader>

                            <AlertDialogFooter>
                                <AlertDialogCancel disabled={isLoading}>
                                    Annuler
                                </AlertDialogCancel>

                                <AlertDialogAction
                                    onClick={handleValidate}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin"/>
                                            Validation...
                                        </>
                                    ) : (
                                        'Confirmer'
                                    )}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </CardContent>
        </Card>
    )
}
