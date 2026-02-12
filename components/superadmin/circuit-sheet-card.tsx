// components/superadmin/circuit-sheet-card.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  Clock
} from 'lucide-react'
import { toast } from 'sonner'
import { validateCircuitSheet } from '@/lib/actions/superadmin/restaurant-verification'
import { 
  getDaysRemaining, 
  isDeadlineOverdue,
  getDeadlineMessage 
} from '@/types/restaurant-verification'

// ============================================================
// TYPES
// ============================================================

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

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

export function CircuitSheetCard({ circuitSheet }: CircuitSheetCardProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showValidateDialog, setShowValidateDialog] = useState(false)

  const deadlineAt = new Date(circuitSheet.deadlineAt)
  const daysRemaining = getDaysRemaining(deadlineAt)
  const isOverdue = isDeadlineOverdue(deadlineAt)
  const deadlineMessage = getDeadlineMessage(deadlineAt)

  // ============================================================
  // HANDLER
  // ============================================================

  async function handleValidate() {
    setIsLoading(true)

    const result = await validateCircuitSheet(circuitSheet.restaurantId)

    if (result.success) {
      toast.success(`Fiche circuit de ${circuitSheet.restaurant.name} validée`)
      router.refresh()
    } else {
      toast.error(result.error || 'Erreur lors de la validation')
    }

    setIsLoading(false)
    setShowValidateDialog(false)
  }

  // ============================================================
  // RENDU
  // ============================================================

  return (
    <Card className={`overflow-hidden ${isOverdue ? 'border-red-300' : ''}`}>
      <CardHeader className={isOverdue ? 'bg-red-50 dark:bg-red-950/20' : 'bg-muted/50'}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{circuitSheet.restaurant.name}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Slug: <code className="text-xs">{circuitSheet.restaurant.slug}</code>
            </p>
          </div>
          
          {isOverdue && (
            <Badge variant="destructive">
              <AlertTriangle className="mr-1 h-3 w-3" />
              En retard
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-4">
        {/* Deadline */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Échéance</span>
            <Badge variant={deadlineMessage.variant}>
              {isOverdue ? (
                <AlertTriangle className="mr-1 h-3 w-3" />
              ) : (
                <Clock className="mr-1 h-3 w-3" />
              )}
              {deadlineMessage.message}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              Date limite: {deadlineAt.toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </span>
          </div>

          {/* Barre de progression visuelle */}
          <div className="relative h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`absolute inset-y-0 left-0 transition-all ${
                isOverdue 
                  ? 'bg-red-600' 
                  : daysRemaining <= 7 
                    ? 'bg-orange-500' 
                    : 'bg-green-500'
              }`}
              style={{
                width: `${Math.min(Math.max((90 - daysRemaining) / 90 * 100, 0), 100)}%`
              }}
            />
          </div>
        </div>

        {/* Document */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-background rounded-lg">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium">Fiche circuit</p>
              {circuitSheet.circuitSheetUploadedAt && (
                <p className="text-xs text-muted-foreground">
                  Soumise le {new Date(circuitSheet.circuitSheetUploadedAt).toLocaleDateString('fr-FR')}
                </p>
              )}
            </div>
          </div>
          
          {circuitSheet.circuitSheetUrl ? (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  Voir
                </Button>
              </DialogTrigger>
              
              <DialogContent className="max-w-4xl max-h-[90vh]">
                <DialogHeader>
                  <DialogTitle>Fiche circuit - {circuitSheet.restaurant.name}</DialogTitle>
                  <DialogDescription>
                    Vérifiez que le document contient tous les éléments requis
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  {/* Si c'est un PDF */}
                  {circuitSheet.circuitSheetUrl.endsWith('.pdf') ? (
                    <div className="relative w-full h-[600px] rounded-lg overflow-hidden bg-muted">
                      <iframe
                        src={circuitSheet.circuitSheetUrl}
                        className="w-full h-full"
                        title="Fiche circuit PDF"
                      />
                    </div>
                  ) : (
                    /* Si c'est une image */
                    <div className="relative w-full rounded-lg overflow-hidden bg-muted">
                      <img
                        src={circuitSheet.circuitSheetUrl}
                        alt="Fiche circuit"
                        className="w-full object-contain"
                      />
                    </div>
                  )}

                  {/* Checklist de vérification */}
                  <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm font-semibold mb-2">Points à vérifier :</p>
                    <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                      <li>Organigramme de l'équipe</li>
                      <li>Circuit des commandes (prise → préparation → livraison)</li>
                      <li>Gestion des stocks et approvisionnements</li>
                      <li>Horaires et rotations du personnel</li>
                    </ul>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(circuitSheet.circuitSheetUrl!, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ouvrir dans un nouvel onglet
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          ) : (
            <Badge variant="secondary">Non soumise</Badge>
          )}
        </div>

        {/* Action de validation */}
        {circuitSheet.circuitSheetUrl && (
          <AlertDialog open={showValidateDialog} onOpenChange={setShowValidateDialog}>
            <Button
              onClick={() => setShowValidateDialog(true)}
              disabled={isLoading}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Valider la fiche circuit
            </Button>
            
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Valider la fiche circuit de {circuitSheet.restaurant.name} ?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action confirmera que la fiche circuit est conforme aux exigences. 
                  {isOverdue && (
                    <span className="block mt-2 text-orange-600 dark:text-orange-400 font-medium">
                      ⚠️ Ce restaurant était suspendu pour fiche manquante. 
                      La validation le réactivera automatiquement.
                    </span>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isLoading}>
                  Annuler
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleValidate}
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Validation...
                    </>
                  ) : (
                    'Confirmer la validation'
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