'use client'

import { useState } from 'react'
import { validateManualPayment } from '@/lib/actions/subscription'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatPrice } from '@/lib/subscription/config'
import {
  CheckCircle2,
  ExternalLink,
  Calendar,
  CreditCard,
  Building2,
  Loader2,
  FileText,
} from 'lucide-react'
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
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'
import Image from 'next/image'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface PaymentCardProps {
  payment: any
}

export function PaymentCard({ payment }: PaymentCardProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [openConfirm, setOpenConfirm] = useState(false)

  const handleValidate = async () => {
    setLoading(true)

    const result = await validateManualPayment(payment.id)

    if (result.success) {
      toast.success('Paiement validé avec succès', {
        description: "L'abonnement du restaurant a été activé",
      })
      router.refresh()
      setOpenConfirm(false)
    } else {
      toast.error('Erreur', {
        description: result.error || 'Impossible de valider le paiement',
      })
    }

    setLoading(false)
  }

  return (
    <>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-4">
              {/* Header */}
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold">
                  {payment.restaurant.name}
                </h3>
                <Badge
                  variant={
                    payment.status === 'confirmed'
                      ? 'default'
                      : payment.status === 'pending'
                      ? 'secondary'
                      : 'destructive'
                  }
                >
                  {payment.status === 'confirmed' && 'Confirmé'}
                  {payment.status === 'pending' && 'En attente'}
                  {payment.status === 'failed' && 'Échoué'}
                </Badge>
              </div>

              <p className="text-sm text-gray-600">
                ID: {payment.id.slice(0, 8)}...
              </p>

              {/* Infos */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Info icon={<CreditCard />} label="Montant">
                  {formatPrice(payment.amount)}
                </Info>

                <Info icon={<Building2 />} label="Plan">
                  {payment.subscription.plan}
                </Info>

                <Info icon={<Calendar />} label="Durée">
                  {payment.billingCycle} mois
                </Info>

                <Info icon={<Calendar />} label="Date">
                  {new Date(payment.createdAt).toLocaleDateString('fr-FR')}
                </Info>
              </div>

              {/* Notes */}
              {payment.manualNotes && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Notes</p>
                      <p className="text-sm text-gray-600">
                        {payment.manualNotes}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              {payment.proofUrl && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Voir la preuve
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl">
                    <DialogHeader>
                      <DialogTitle>Preuve de paiement</DialogTitle>
                      <DialogDescription>
                        {payment.restaurant.name} •{' '}
                        {formatPrice(payment.amount)}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="relative h-[600px]">
                      <Image
                        src={payment.proofUrl}
                        alt="Preuve de paiement"
                        fill
                        className="object-contain"
                      />
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              {payment.status === 'pending' && (
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => setOpenConfirm(true)}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Valider
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MODALE DE CONFIRMATION */}
      <AlertDialog open={openConfirm} onOpenChange={setOpenConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Confirmer la validation du paiement
            </AlertDialogTitle>
            <AlertDialogDescription>
              Cette action activera l’abonnement du restaurant{' '}
              <strong>{payment.restaurant.name}</strong>.  
              Cette opération est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleValidate}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

/* Petit helper UI */
function Info({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <div className="text-gray-500">{icon}</div>
      <div>
        <p className="text-gray-600">{label}</p>
        <p className="font-semibold">{children}</p>
      </div>
    </div>
  )
}
