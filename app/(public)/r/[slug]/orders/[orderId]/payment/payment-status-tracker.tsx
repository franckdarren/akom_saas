// app/(public)/r/[slug]/orders/[orderId]/payment/payment-status-tracker.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, XCircle, Loader2, Smartphone, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AppCard } from '@/components/ui/app-card'
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatPrice } from '@/lib/utils/format'
import { SINGPAY_CONFIG } from '@/lib/singpay/constants'

interface PaymentStatusTrackerProps {
  paymentId: string
  initialStatus: string
  phoneNumber: string
  operator: string
  orderNumber: string
  amount: number
  restaurantName: string
  restaurantSlug: string
  orderId: string
}

type TrackerState = 'polling' | 'paid' | 'failed' | 'timeout'

export function PaymentStatusTracker({
  paymentId,
  initialStatus,
  phoneNumber,
  operator,
  orderNumber,
  amount,
  restaurantName,
  restaurantSlug,
  orderId,
}: PaymentStatusTrackerProps) {
  const router = useRouter()
  const [state, setState] = useState<TrackerState>(
    initialStatus === 'paid' ? 'paid' : initialStatus === 'failed' ? 'failed' : 'polling',
  )
  const [errorMessage, setErrorMessage] = useState<string>('')
  const pollCount = useRef(0)

  useEffect(() => {
    if (state !== 'polling') return

    const interval = setInterval(async () => {
      pollCount.current++

      // Timeout après maxStatusChecks
      if (pollCount.current > SINGPAY_CONFIG.maxStatusChecks) {
        setState('timeout')
        clearInterval(interval)
        return
      }

      try {
        const res = await fetch(`/api/payments/${paymentId}/status`)
        const data = await res.json()

        if (data.isPaid) {
          setState('paid')
          clearInterval(interval)
        } else if (data.isFailed) {
          setState('failed')
          setErrorMessage(data.errorMessage ?? 'Paiement échoué')
          clearInterval(interval)
        }
      } catch {
        // Erreur réseau, on continue le polling
      }
    }, SINGPAY_CONFIG.statusCheckInterval)

    return () => clearInterval(interval)
  }, [paymentId, state])

  function handleGoToOrder() {
    router.push(`/r/${restaurantSlug}/orders/${orderId}`)
  }

  function handleRetry() {
    router.back()
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <AppCard className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="type-card-title">{restaurantName}</CardTitle>
          <p className="type-caption text-muted-foreground">
            Commande {orderNumber}
          </p>
        </CardHeader>
        <CardContent className="layout-card-body">
          {/* Montant */}
          <div className="text-center">
            <p className="text-2xl font-bold">{formatPrice(amount)}</p>
            <p className="type-caption text-muted-foreground mt-1">
              {operator} · {phoneNumber}
            </p>
          </div>

          {/* État : Polling */}
          {state === 'polling' && (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="relative">
                <Smartphone className="h-12 w-12 text-muted-foreground" />
                <Loader2 className="h-5 w-5 text-primary animate-spin absolute -top-1 -right-1" />
              </div>
              <div className="text-center space-y-1">
                <p className="font-semibold">En attente de validation</p>
                <p className="type-body-muted">
                  Composez le code PIN sur votre téléphone pour valider le paiement
                </p>
              </div>
            </div>
          )}

          {/* État : Payé */}
          {state === 'paid' && (
            <div className="flex flex-col items-center gap-4 py-6">
              <CheckCircle2 className="h-14 w-14 text-success" />
              <div className="text-center space-y-1">
                <p className="font-semibold">Paiement confirmé !</p>
                <p className="type-body-muted">
                  Votre commande est en cours de préparation
                </p>
              </div>
              <Button className="w-full" size="lg" onClick={handleGoToOrder}>
                Suivre ma commande
              </Button>
            </div>
          )}

          {/* État : Échoué */}
          {state === 'failed' && (
            <div className="flex flex-col items-center gap-4 py-6">
              <XCircle className="h-14 w-14 text-destructive" />
              <div className="text-center space-y-1">
                <p className="font-semibold">Paiement échoué</p>
                <p className="type-body-muted">{errorMessage}</p>
              </div>
              <div className="flex flex-col gap-2 w-full">
                <Button className="w-full" size="lg" onClick={handleRetry}>
                  <RefreshCw className="h-4 w-4" />
                  Réessayer
                </Button>
                <Button variant="outline" className="w-full" onClick={handleGoToOrder}>
                  Payer en espèces
                </Button>
              </div>
            </div>
          )}

          {/* État : Timeout */}
          {state === 'timeout' && (
            <div className="flex flex-col items-center gap-4 py-6">
              <Loader2 className="h-14 w-14 text-warning" />
              <div className="text-center space-y-1">
                <p className="font-semibold">Délai dépassé</p>
                <p className="type-body-muted">
                  Nous n'avons pas reçu de confirmation. Si vous avez validé le paiement,
                  il sera traité automatiquement.
                </p>
              </div>
              <div className="flex flex-col gap-2 w-full">
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => {
                    pollCount.current = 0
                    setState('polling')
                  }}
                >
                  <RefreshCw className="h-4 w-4" />
                  Vérifier à nouveau
                </Button>
                <Button variant="outline" className="w-full" onClick={handleGoToOrder}>
                  Voir ma commande
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </AppCard>
    </div>
  )
}
