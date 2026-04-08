'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  AppCard,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/app-card'
import {
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  ArrowRight,
  FileText,
  Smartphone,
} from 'lucide-react'
import { formatPrice } from '@/lib/config/subscription'
import { SINGPAY_CONFIG } from '@/lib/singpay/constants'
import { cn } from '@/lib/utils'
import { useNavigationLoading } from '@/lib/hooks/use-navigation-loading'

// ============================================================
// TYPES
// ============================================================

interface MobilePaymentTrackerProps {
  paymentId: string
  amount: number
  operator: 'airtel' | 'moov'
  phoneNumber: string
  onRetry: () => void
  onSwitchToManual: () => void
}

type TrackingStatus = 'polling' | 'success' | 'failed' | 'timeout'

interface PollResponse {
  status: string
  isPaid: boolean
  isFailed: boolean
  errorMessage?: string
  error?: string
}

// ============================================================
// COMPOSANT
// ============================================================

export function MobilePaymentTracker({
  paymentId,
  amount,
  operator,
  phoneNumber,
  onRetry,
  onSwitchToManual,
}: MobilePaymentTrackerProps) {
  const router = useRouter()
  const { startLoading } = useNavigationLoading()

  const [status, setStatus] = useState<TrackingStatus>('polling')
  const [checkCount, setCheckCount] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const maxChecks = SINGPAY_CONFIG.maxStatusChecks
  const interval = SINGPAY_CONFIG.statusCheckInterval

  const pollStatus = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/subscription-payments/${paymentId}/status`,
      )

      if (!response.ok) {
        return // Retry au prochain interval
      }

      const data: PollResponse = await response.json()

      if (data.isPaid) {
        setStatus('success')
        return
      }

      if (data.isFailed) {
        setStatus('failed')
        setErrorMessage(data.errorMessage ?? 'Paiement échoué')
        return
      }

      // Encore pending → continuer le polling
    } catch {
      // Erreur réseau → on continue le polling
    }
  }, [paymentId])

  useEffect(() => {
    if (status !== 'polling') return

    // Timeout atteint
    if (checkCount >= maxChecks) {
      setStatus('timeout')
      return
    }

    const timer = setTimeout(async () => {
      await pollStatus()
      setCheckCount((prev) => prev + 1)
    }, interval)

    return () => clearTimeout(timer)
  }, [status, checkCount, maxChecks, interval, pollStatus])

  const operatorLabel = operator === 'airtel' ? 'Airtel Money' : 'Moov Money'

  const handleGoToDashboard = () => {
    startLoading()
    router.push('/dashboard/subscription')
  }

  return (
    <AppCard variant="flat">
      <CardHeader>
        <CardTitle className="type-card-title text-center">
          {status === 'polling' && 'Paiement en cours...'}
          {status === 'success' && 'Paiement confirmé !'}
          {status === 'failed' && 'Paiement échoué'}
          {status === 'timeout' && 'Délai dépassé'}
        </CardTitle>
      </CardHeader>

      <CardContent className="layout-card-body">
        {/* Indicateur visuel */}
        <div className="flex flex-col items-center gap-4 py-6">
          {status === 'polling' && (
            <>
              <div className="relative">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                  <Smartphone className="h-10 w-10 text-primary" />
                </div>
                <Loader2 className="absolute -top-1 -right-1 h-6 w-6 animate-spin text-primary" />
              </div>
              <div className="text-center space-y-2">
                <p className="font-medium">
                  Validez le paiement de {formatPrice(amount)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Via {operatorLabel} sur le {phoneNumber}
                </p>
                <p className="text-xs text-muted-foreground">
                  Composez votre code PIN sur votre téléphone pour confirmer
                </p>
              </div>
              {/* Barre de progression */}
              <div className="w-full max-w-xs">
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${(checkCount / maxChecks) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center mt-1">
                  Vérification {checkCount}/{maxChecks}
                </p>
              </div>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
                <CheckCircle2 className="h-10 w-10 text-success" />
              </div>
              <div className="text-center space-y-2">
                <p className="font-medium text-success">
                  Votre abonnement est maintenant actif !
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatPrice(amount)} payé via {operatorLabel}
                </p>
              </div>
            </>
          )}

          {status === 'failed' && (
            <>
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
                <XCircle className="h-10 w-10 text-destructive" />
              </div>
              <div className="text-center space-y-2">
                <p className="font-medium text-destructive">
                  Le paiement n&apos;a pas abouti
                </p>
                <p className="text-sm text-muted-foreground">
                  {errorMessage}
                </p>
              </div>
            </>
          )}

          {status === 'timeout' && (
            <>
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-warning/10">
                <Loader2 className="h-10 w-10 text-warning" />
              </div>
              <div className="text-center space-y-2">
                <p className="font-medium text-warning-foreground">
                  Le délai de vérification est dépassé
                </p>
                <p className="text-sm text-muted-foreground">
                  Le paiement peut encore être en cours de traitement.
                  Si le montant a été débité, votre abonnement sera activé automatiquement.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className={cn(
          'flex flex-col gap-2',
          status === 'polling' && 'hidden',
        )}>
          {status === 'success' && (
            <Button onClick={handleGoToDashboard} className="w-full" size="lg">
              Accéder au dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}

          {(status === 'failed' || status === 'timeout') && (
            <>
              <Button onClick={onRetry} className="w-full" size="lg">
                <RefreshCw className="mr-2 h-4 w-4" />
                Réessayer
              </Button>
              <Button
                variant="outline"
                onClick={onSwitchToManual}
                className="w-full"
              >
                <FileText className="mr-2 h-4 w-4" />
                Payer manuellement
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </AppCard>
  )
}
