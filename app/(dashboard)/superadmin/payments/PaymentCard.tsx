// app/superadmin/payments/PaymentCard.tsx
'use client'

import { useState } from 'react'
import { validateManualPayment } from '@/lib/actions/subscription'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatPrice } from '@/lib/subscription/config'
import {
  CheckCircle2,
  XCircle,
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
import Image from 'next/image'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface PaymentCardProps {
  payment: any
}

export function PaymentCard({ payment }: PaymentCardProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleValidate = async () => {
    if (!confirm('Confirmer la validation de ce paiement ?')) return

    setLoading(true)
    const result = await validateManualPayment(payment.id)

    if (result.success) {
      toast.success('Paiement validé avec succès', {
        description: 'L\'abonnement du restaurant a été activé',
      })
      router.refresh()
    } else {
      toast.error('Erreur', {
        description: result.error || 'Impossible de valider le paiement',
      })
    }
    setLoading(false)
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
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
                <p className="text-sm text-gray-600 mt-1">
                  ID: {payment.id.slice(0, 8)}...
                </p>
              </div>
            </div>

            {/* Infos */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2 text-sm">
                <CreditCard className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-gray-600">Montant</p>
                  <p className="font-semibold">{formatPrice(payment.amount)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-gray-600">Plan</p>
                  <p className="font-semibold capitalize">
                    {payment.subscription.plan}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-gray-600">Durée</p>
                  <p className="font-semibold">{payment.billingCycle} mois</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-gray-600">Date</p>
                  <p className="font-semibold">
                    {new Date(payment.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            </div>

            {/* Notes */}
            {payment.manualNotes && (
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Notes</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {payment.manualNotes}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Validation info */}
            {payment.status === 'confirmed' && payment.validatedAt && (
              <div className="text-sm text-gray-600">
                Validé le{' '}
                {new Date(payment.validatedAt).toLocaleDateString('fr-FR')} à{' '}
                {new Date(payment.validatedAt).toLocaleTimeString('fr-FR')}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            {/* Voir la preuve */}
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
                      {payment.restaurant.name} • {formatPrice(payment.amount)}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="relative w-full h-[600px] bg-gray-100 rounded-lg overflow-hidden">
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

            {/* Valider (si pending) */}
            {payment.status === 'pending' && (
              <Button
                onClick={handleValidate}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
                size="sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Validation...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Valider
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}