// components/superadmin/restaurant-verification-card.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  Eye
} from 'lucide-react'
import { toast } from 'sonner'
import {
  approveRestaurantVerification,
  rejectRestaurantVerification,
} from '@/lib/actions/superadmin/restaurant-verification'
import { IDENTITY_DOCUMENT_TYPE_LABELS } from '@/types/restaurant-verification'

// ============================================================
// TYPES
// ============================================================

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

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

export function RestaurantVerificationCard({ restaurant }: RestaurantVerificationCardProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [showApproveDialog, setShowApproveDialog] = useState(false)

  const docs = restaurant.verificationDocuments

  // Vérifier que tous les documents sont présents
  const hasAllDocuments = !!(docs?.profilePhotoUrl && docs?.identityDocumentUrl)

  // ============================================================
  // HANDLERS
  // ============================================================

  async function handleApprove() {
    setIsLoading(true)

    const result = await approveRestaurantVerification(restaurant.id)

    if (result.success) {
      toast.success(`Restaurant ${restaurant.name} approuvé avec succès`)
      router.refresh()
    } else {
      toast.error(result.error || 'Erreur lors de l\'approbation')
    }

    setIsLoading(false)
    setShowApproveDialog(false)
  }

  async function handleReject() {
    if (!rejectionReason.trim() || rejectionReason.trim().length < 10) {
      toast.error('Veuillez fournir une raison de rejet détaillée (minimum 10 caractères)')
      return
    }

    setIsLoading(true)

    const result = await rejectRestaurantVerification(
      restaurant.id,
      rejectionReason.trim()
    )

    if (result.success) {
      toast.success(`Restaurant ${restaurant.name} rejeté`)
      router.refresh()
      setShowRejectDialog(false)
      setRejectionReason('')
    } else {
      toast.error(result.error || 'Erreur lors du rejet')
    }

    setIsLoading(false)
  }

  // ============================================================
  // RENDU
  // ============================================================

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-muted/50">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{restaurant.name}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Slug: <code className="text-xs">{restaurant.slug}</code>
            </p>
          </div>
          <Badge variant={hasAllDocuments ? 'default' : 'secondary'}>
            {hasAllDocuments ? 'Complet' : 'Incomplet'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-4">
        {/* Informations de base */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>
            Créé le {new Date(restaurant.createdAt).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </span>
        </div>

        {/* Documents */}
        <div className="space-y-3">
          {/* Photo de profil */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-background rounded-lg">
                <User className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">Photo de profil</p>
                {docs?.profilePhotoUploadedAt && (
                  <p className="text-xs text-muted-foreground">
                    Uploadée le {new Date(docs.profilePhotoUploadedAt).toLocaleDateString('fr-FR')}
                  </p>
                )}
              </div>
            </div>
            
            {docs?.profilePhotoUrl ? (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    Voir
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Photo de profil - {restaurant.name}</DialogTitle>
                  </DialogHeader>
                  <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-muted">
                    <img
                      src={docs.profilePhotoUrl}
                      alt="Photo de profil"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(docs.profilePhotoUrl!, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ouvrir dans un nouvel onglet
                  </Button>
                </DialogContent>
              </Dialog>
            ) : (
              <Badge variant="secondary">Non uploadée</Badge>
            )}
          </div>

          {/* Pièce d'identité */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-background rounded-lg">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">Pièce d'identité</p>
                {docs?.identityDocumentType && (
                  <p className="text-xs text-muted-foreground">
                    {IDENTITY_DOCUMENT_TYPE_LABELS[docs.identityDocumentType as keyof typeof IDENTITY_DOCUMENT_TYPE_LABELS]}
                  </p>
                )}
                {docs?.identityDocumentUploadedAt && (
                  <p className="text-xs text-muted-foreground">
                    Uploadée le {new Date(docs.identityDocumentUploadedAt).toLocaleDateString('fr-FR')}
                  </p>
                )}
              </div>
            </div>
            
            {docs?.identityDocumentUrl ? (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    Voir
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Pièce d'identité - {restaurant.name}</DialogTitle>
                    <DialogDescription>
                      {docs.identityDocumentType && 
                        IDENTITY_DOCUMENT_TYPE_LABELS[docs.identityDocumentType as keyof typeof IDENTITY_DOCUMENT_TYPE_LABELS]
                      }
                    </DialogDescription>
                  </DialogHeader>
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted">
                    <img
                      src={docs.identityDocumentUrl}
                      alt="Pièce d'identité"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(docs.identityDocumentUrl!, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
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
        {hasAllDocuments && (
          <div className="flex gap-2 pt-4">
            {/* Bouton Approuver */}
            <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
              <Button
                onClick={() => setShowApproveDialog(true)}
                disabled={isLoading}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Approuver
              </Button>
              
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Approuver {restaurant.name} ?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action va vérifier et activer le restaurant. 
                    Le restaurant pourra alors utiliser toutes les fonctionnalités d'Akôm 
                    et les clients pourront accéder à son menu.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isLoading}>
                    Annuler
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleApprove}
                    disabled={isLoading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Approbation...
                      </>
                    ) : (
                      'Confirmer l\'approbation'
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Bouton Rejeter */}
            <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
              <DialogTrigger asChild>
                <Button
                  variant="destructive"
                  disabled={isLoading}
                  className="flex-1"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Rejeter
                </Button>
              </DialogTrigger>
              
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Rejeter {restaurant.name}</DialogTitle>
                  <DialogDescription>
                    Le restaurant recevra votre message et pourra corriger puis re-soumettre 
                    ses documents. Soyez clair et précis dans vos explications.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="rejection-reason">
                      Raison du rejet <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="rejection-reason"
                      placeholder="Ex: La pièce d'identité est floue et illisible. Veuillez uploader une photo plus nette où toutes les informations sont clairement visibles."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      disabled={isLoading}
                      rows={4}
                      className="resize-none"
                    />
                    <p className="text-xs text-muted-foreground">
                      Minimum 10 caractères. Soyez précis pour aider le restaurant à corriger.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowRejectDialog(false)
                      setRejectionReason('')
                    }}
                    disabled={isLoading}
                  >
                    Annuler
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleReject}
                    disabled={isLoading || rejectionReason.trim().length < 10}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Rejet...
                      </>
                    ) : (
                      'Confirmer le rejet'
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* Message si documents incomplets */}
        {!hasAllDocuments && (
          <div className="pt-4 text-sm text-muted-foreground text-center">
            En attente de la soumission des documents
          </div>
        )}
      </CardContent>
    </Card>
  )
}