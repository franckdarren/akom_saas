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
    CheckCircle,
    XCircle,
    User,
    FileText,
    Calendar,
    ExternalLink,
    Loader2,
    Eye,
} from 'lucide-react'
import {toast} from 'sonner'
import {
    approveRestaurantVerification,
    rejectRestaurantVerification,
} from '@/lib/actions/superadmin/restaurant-verification'
import {IDENTITY_DOCUMENT_TYPE_LABELS} from '@/types/restaurant-verification'

interface RestaurantVerificationCardProps {
    restaurant: {
        id: string
        name: string
        slug: string
        createdAt: Date
        verificationStatus: string
        verificationDocuments: {
            profilePhotoUrl: string | null
            profilePhotoUploadedAt: Date | null
            identityDocumentUrl: string | null
            identityDocumentType: string | null
            identityDocumentUploadedAt: Date | null
        } | null
        users: Array<{
            userId: string
            role: string
        }>
    }
}

export function RestaurantVerificationCard({
                                               restaurant,
                                           }: RestaurantVerificationCardProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [rejectionReason, setRejectionReason] = useState('')
    const [showRejectDialog, setShowRejectDialog] = useState(false)
    const [showApproveDialog, setShowApproveDialog] = useState(false)

    const docs = restaurant.verificationDocuments
    const hasAllDocuments = !!(
        docs?.profilePhotoUrl && docs?.identityDocumentUrl
    )

    async function handleApprove() {
        setIsLoading(true)

        const result = await approveRestaurantVerification(restaurant.id)

        if (result.success) {
            toast.success(`Restaurant approuvé`)
            router.refresh()
        } else {
            toast.error(result.error || "Erreur lors de l'approbation")
        }

        setIsLoading(false)
        setShowApproveDialog(false)
    }

    async function handleReject() {
        if (!rejectionReason.trim() || rejectionReason.trim().length < 10) {
            toast.error(
                'Veuillez fournir une raison détaillée (minimum 10 caractères)'
            )
            return
        }

        setIsLoading(true)

        const result = await rejectRestaurantVerification(
            restaurant.id,
            rejectionReason.trim()
        )

        if (result.success) {
            toast.success(`Restaurant rejeté`)
            router.refresh()
            setShowRejectDialog(false)
            setRejectionReason('')
        } else {
            toast.error(result.error || 'Erreur lors du rejet')
        }

        setIsLoading(false)
    }

    return (
        <Card>
            <CardHeader className="">
                <div className="flex items-center justify-between pb-3">
                    <div>
                        <CardTitle className="text-lg">
                            {restaurant.name}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                            Slug:{' '}
                            <code className="text-xs">
                                {restaurant.slug}
                            </code>
                        </p>
                    </div>

                    <Badge variant={hasAllDocuments ? 'default' : 'secondary'}>
                        {hasAllDocuments ? 'Complet' : 'Incomplet'}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="pt-3 space-y-6">
                {/* Date création */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4"/>
                    {new Date(restaurant.createdAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                    })}
                </div>

                {/* Documents */}
                <div className="space-y-3">

                    {/* ================= PHOTO ================= */}
                    <div className="flex items-center justify-between p-4 border rounded-xl">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-background rounded-lg border">
                                <User className="h-4 w-4"/>
                            </div>
                            <div>
                                <p className="text-sm font-medium">
                                    Photo de profil
                                </p>
                                {docs?.profilePhotoUploadedAt && (
                                    <p className="text-xs text-muted-foreground">
                                        Uploadée le{" "}
                                        {new Date(
                                            docs.profilePhotoUploadedAt
                                        ).toLocaleDateString("fr-FR")}
                                    </p>
                                )}
                            </div>
                        </div>

                        {docs?.profilePhotoUrl ? (
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="sm">
                                        <Eye className="h-4 w-4 mr-2"/>
                                        Voir
                                    </Button>
                                </DialogTrigger>

                                <DialogContent className="max-w-2xl">
                                    <DialogHeader>
                                        <DialogTitle>Photo de profil</DialogTitle>
                                    </DialogHeader>

                                    <img
                                        src={docs.profilePhotoUrl}
                                        alt="Photo de profil"
                                        className="w-full rounded-lg border object-contain max-h-[70vh]"
                                    />

                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() =>
                                            window.open(docs.profilePhotoUrl!, "_blank")
                                        }
                                    >
                                        <ExternalLink className="h-4 w-4 mr-2"/>
                                        Ouvrir dans un nouvel onglet
                                    </Button>
                                </DialogContent>
                            </Dialog>
                        ) : (
                            <Badge variant="secondary">Non uploadée</Badge>
                        )}
                    </div>


                    {/* ================= PIECE IDENTITE ================= */}
                    <div className="flex items-center justify-between p-4 border rounded-xl">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-background rounded-lg border">
                                <FileText className="h-4 w-4"/>
                            </div>
                            <div>
                                <p className="text-sm font-medium">
                                    Pièce d'identité
                                </p>

                                {docs?.identityDocumentType && (
                                    <p className="text-xs text-muted-foreground">
                                        {
                                            IDENTITY_DOCUMENT_TYPE_LABELS[
                                                docs.identityDocumentType as keyof typeof IDENTITY_DOCUMENT_TYPE_LABELS
                                                ]
                                        }
                                    </p>
                                )}
                            </div>
                        </div>

                        {docs?.identityDocumentUrl ? (
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="sm">
                                        <Eye className="h-4 w-4 mr-2"/>
                                        Voir
                                    </Button>
                                </DialogTrigger>

                                <DialogContent className="max-w-3xl">
                                    <DialogHeader>
                                        <DialogTitle>
                                            Pièce d'identité
                                        </DialogTitle>
                                    </DialogHeader>

                                    {/* Gestion image ou PDF */}
                                    {docs.identityDocumentUrl.endsWith(".pdf") ? (
                                        <iframe
                                            src={docs.identityDocumentUrl}
                                            className="w-full h-[70vh] rounded-lg border"
                                        />
                                    ) : (
                                        <img
                                            src={docs.identityDocumentUrl}
                                            alt="Pièce d'identité"
                                            className="w-full rounded-lg border object-contain max-h-[70vh]"
                                        />
                                    )}

                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() =>
                                            window.open(docs.identityDocumentUrl!, "_blank")
                                        }
                                    >
                                        <ExternalLink className="h-4 w-4 mr-2"/>
                                        Ouvrir dans un nouvel onglet
                                    </Button>
                                </DialogContent>
                            </Dialog>
                        ) : (
                            <Badge variant="secondary">Non uploadée</Badge>
                        )}
                    </div>
                </div>


                {/* Actions */}
                {hasAllDocuments ? (
                    <div className="flex gap-3 pt-4">
                        {/* Approve */}
                        <AlertDialog
                            open={showApproveDialog}
                            onOpenChange={setShowApproveDialog}
                        >
                            <Button
                                onClick={() => setShowApproveDialog(true)}
                                disabled={isLoading}
                                className="flex-1"
                            >
                                {isLoading ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin"/>
                                ) : (
                                    <CheckCircle className="h-4 w-4 mr-2"/>
                                )}
                                Approuver
                            </Button>

                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>
                                        Confirmer l'approbation ?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Le restaurant sera activé et visible.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>
                                        Annuler
                                    </AlertDialogCancel>
                                    <AlertDialogAction onClick={handleApprove}>
                                        Confirmer
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>

                        {/* Reject */}
                        <Dialog
                            open={showRejectDialog}
                            onOpenChange={setShowRejectDialog}
                        >
                            <DialogTrigger asChild>
                                <Button
                                    variant="destructive"
                                    className="flex-1"
                                >
                                    <XCircle className="h-4 w-4 mr-2"/>
                                    Rejeter
                                </Button>
                            </DialogTrigger>

                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>
                                        Raison du rejet
                                    </DialogTitle>
                                </DialogHeader>

                                <div className="space-y-4 py-4">
                                    <Label htmlFor="reason">
                                        Raison{' '}
                                        <span className="text-destructive">*</span>
                                    </Label>
                                    <Textarea
                                        id="reason"
                                        rows={4}
                                        value={rejectionReason}
                                        onChange={(e) =>
                                            setRejectionReason(e.target.value)
                                        }
                                        disabled={isLoading}
                                    />
                                </div>

                                <div className="flex justify-end gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setShowRejectDialog(false)
                                            setRejectionReason('')
                                        }}
                                    >
                                        Annuler
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={handleReject}
                                        disabled={
                                            isLoading ||
                                            rejectionReason.trim().length < 10
                                        }
                                    >
                                        Confirmer le rejet
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                ) : (
                    <div className="pt-4 text-sm text-muted-foreground text-center">
                        En attente de la soumission des documents
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
