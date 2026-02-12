// components/superadmin/suspended-restaurant-card.tsx
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
  PlayCircle,
  Calendar,
  FileText,
  Loader2,
  AlertCircle,
  Info
} from 'lucide-react'
import { toast } from 'sonner'
import { reactivateSuspendedRestaurant } from '@/lib/actions/superadmin/restaurant-verification'

// ============================================================
// TYPES
// ============================================================

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

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

export function SuspendedRestaurantCard({ 
  restaurant, 
  suspensionReason 
}: SuspendedRestaurantCardProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [reactivationComment, setReactivationComment] = useState('')
  const [showReactivateDialog, setShowReactivateDialog] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  // ============================================================
  // HANDLER
  // ============================================================

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

  // ============================================================
  // RENDU
  // ============================================================

  return (
    <Card className="overflow-hidden border-red-300">
      <CardHeader className="bg-red-50 dark:bg-red-950/20">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{restaurant.name}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Slug: <code className="text-xs">{restaurant.slug}</code>
            </p>
          </div>
          <Badge variant="destructive">
            <AlertCircle className="mr-1 h-3 w-3" />
            Suspendu
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-4">
        {/* Informations de base */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              Créé le {new Date(restaurant.createdAt).toLocaleDateString('fr-FR')}
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span>
              Suspendu le {new Date(restaurant.updatedAt).toLocaleDateString('fr-FR')}
            </span>
          </div>
        </div>

        {/* Raison de la suspension */}
        <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-red-900 dark:text-red-100 mb-1">
                Raison de la suspension
              </p>
              {suspensionReason === 'circuit_sheet' ? (
                <p className="text-red-800 dark:text-red-200">
                  Fiche circuit non soumise dans les délais (deadline: {' '}
                  {restaurant.circuitSheet && 
                    new Date(restaurant.circuitSheet.deadlineAt).toLocaleDateString('fr-FR')
                  })
                </p>
              ) : (
                <p className="text-red-800 dark:text-red-200">
                  Suspension manuelle ou autre raison
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Informations complémentaires selon la raison */}
        {suspensionReason === 'circuit_sheet' && restaurant.circuitSheet && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4" />
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
              <FileText className="mr-2 h-4 w-4" />
              Aller valider la fiche circuit
            </Button>
          ) : (
            <Dialog open={showReactivateDialog} onOpenChange={setShowReactivateDialog}>
              <DialogTrigger asChild>
                <Button
                  variant="default"
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Réactiver manuellement
                </Button>
              </DialogTrigger>
              
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Réactiver {restaurant.name}</DialogTitle>
                  <DialogDescription>
                    Cette réactivation manuelle lèvera la suspension et rendra le restaurant 
                    à nouveau actif. Utilisez cette option uniquement si vous avez une bonne 
                    raison (ex: exception accordée, erreur de suspension, etc.).
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="reactivation-comment">
                      Commentaire de réactivation <span className="text-red-500">*</span>
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
                      Ce commentaire sera enregistré dans l'historique de vérification.
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
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Continuer
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {/* Dialog de confirmation finale */}
          <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Confirmer la réactivation ?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Vous êtes sur le point de réactiver manuellement {restaurant.name}.
                  Le restaurant redeviendra immédiatement actif et accessible aux clients.
                  
                  {suspensionReason === 'circuit_sheet' && (
                    <span className="block mt-2 text-orange-600 dark:text-orange-400 font-medium">
                      ⚠️ Attention : Ce restaurant n'a pas soumis sa fiche circuit. 
                      Assurez-vous qu'il y a une raison valable pour cette réactivation.
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
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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