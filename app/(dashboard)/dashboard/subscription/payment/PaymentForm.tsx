'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createManualPayment } from '@/lib/actions/subscription'
import {
  initiateSubscriptionPayment,
  getSubscriptionExternalPaymentLink,
} from '@/lib/actions/singpay-subscription'
import { uploadPaymentProof } from '@/lib/utils/upload'
import { Button } from '@/components/ui/button'
import { LoadingButton } from '@/components/ui/loading-button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import {
  AppCard,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/app-card'
import {
  Upload,
  CheckCircle2,
  AlertCircle,
  Users,
  Smartphone,
  FileText,
  ArrowLeft,
  ExternalLink,
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Image from 'next/image'
import { toast } from 'sonner'
import type { SubscriptionPlan, BillingCycle } from '@/lib/config/subscription'
import {
  formatPrice,
  calculateMonthlyPrice,
} from '@/lib/config/subscription'
import { MobilePaymentTracker } from './MobilePaymentTracker'
import { cn } from '@/lib/utils'

// ============================================================
// TYPES
// ============================================================

interface PaymentFormProps {
  restaurantId: string
  plan: SubscriptionPlan
  billingCycle: BillingCycle
  userCount: number
  amount: number
}

type PaymentMethod = 'mobile_money' | 'manual'
type MobileOperator = 'airtel' | 'moov'

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

export function PaymentForm({
  restaurantId,
  plan,
  billingCycle,
  userCount,
  amount,
}: PaymentFormProps) {
  const [method, setMethod] = useState<PaymentMethod | null>(null)

  return (
    <div className="space-y-4">
      {/* Sélection de la méthode si pas encore choisie */}
      {!method && (
        <PaymentMethodSelector onSelect={setMethod} />
      )}

      {/* Formulaire Mobile Money */}
      {method === 'mobile_money' && (
        <MobileMoneyForm
          restaurantId={restaurantId}
          plan={plan}
          billingCycle={billingCycle}
          userCount={userCount}
          amount={amount}
          onBack={() => setMethod(null)}
        />
      )}

      {/* Formulaire Manuel */}
      {method === 'manual' && (
        <ManualPaymentForm
          restaurantId={restaurantId}
          plan={plan}
          billingCycle={billingCycle}
          userCount={userCount}
          amount={amount}
          onBack={() => setMethod(null)}
        />
      )}
    </div>
  )
}

// ============================================================
// SÉLECTEUR DE MÉTHODE
// ============================================================

function PaymentMethodSelector({
  onSelect,
}: {
  onSelect: (method: PaymentMethod) => void
}) {
  return (
    <AppCard variant="flat">
      <CardHeader>
        <CardTitle className="type-card-title">Choisir le mode de paiement</CardTitle>
        <CardDescription>
          Sélectionnez votre méthode de paiement préférée
        </CardDescription>
      </CardHeader>

      <CardContent className="layout-card-body">
        <button
          type="button"
          onClick={() => onSelect('mobile_money')}
          className={cn(
            'w-full rounded-lg border-2 p-4 text-left transition-colors',
            'hover:border-primary hover:bg-accent/50',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          )}
        >
          <div className="layout-inline">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Smartphone className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">Mobile Money</p>
              <p className="type-body-muted text-sm">
                Payez directement via Airtel Money ou Moov Money
              </p>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onSelect('manual')}
          className={cn(
            'w-full rounded-lg border-2 p-4 text-left transition-colors',
            'hover:border-primary hover:bg-accent/50',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          )}
        >
          <div className="layout-inline">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">Virement / Dépôt manuel</p>
              <p className="type-body-muted text-sm">
                Envoyez votre preuve de paiement pour validation
              </p>
            </div>
          </div>
        </button>
      </CardContent>
    </AppCard>
  )
}

// ============================================================
// FORMULAIRE MOBILE MONEY
// ============================================================

function MobileMoneyForm({
  restaurantId,
  plan,
  billingCycle,
  userCount,
  amount,
  onBack,
}: PaymentFormProps & { onBack: () => void }) {
  const [operator, setOperator] = useState<MobileOperator>('airtel')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submittingFallback, setSubmittingFallback] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // État de suivi après initiation
  const [trackingPaymentId, setTrackingPaymentId] = useState<string | null>(null)

  // État fallback lien externe
  const [extPaymentLink, setExtPaymentLink] = useState<string | null>(null)

  const monthlyPrice = calculateMonthlyPrice(plan, userCount)

  if (trackingPaymentId) {
    return (
      <MobilePaymentTracker
        paymentId={trackingPaymentId}
        amount={amount}
        operator={operator}
        phoneNumber={phoneNumber}
        onRetry={() => {
          setTrackingPaymentId(null)
          setExtPaymentLink(null)
          setError(null)
        }}
        onSwitchToManual={onBack}
      />
    )
  }

  // Affichage du lien externe SingPay
  if (extPaymentLink) {
    return (
      <AppCard variant="flat">
        <CardHeader>
          <CardTitle className="type-card-title text-center">
            Paiement en ligne
          </CardTitle>
        </CardHeader>
        <CardContent className="layout-card-body">
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <Smartphone className="h-10 w-10 text-primary" />
            </div>
            <div className="text-center space-y-2">
              <p className="font-medium">
                Finalisez votre paiement de {formatPrice(amount)}
              </p>
              <p className="text-sm text-muted-foreground">
                Cliquez sur le bouton ci-dessous pour accéder à la page de paiement
                sécurisée SingPay. Vous pourrez payer via Airtel Money ou Moov Money.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button asChild className="w-full" size="lg">
              <a href={extPaymentLink} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Payer {formatPrice(amount)}
              </a>
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setExtPaymentLink(null)
                setError(null)
              }}
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Réessayer autrement
            </Button>
            <Button
              variant="ghost"
              onClick={onBack}
              className="w-full"
            >
              <FileText className="mr-2 h-4 w-4" />
              Payer manuellement
            </Button>
          </div>
        </CardContent>
      </AppCard>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!phoneNumber.trim()) {
      setError('Veuillez saisir votre numéro de téléphone')
      return
    }

    setSubmitting(true)
    setError(null)

    const paymentParams = {
      restaurantId,
      plan,
      billingCycle,
      userCount,
      phoneNumber: phoneNumber.trim(),
      operator,
    }

    try {
      const result = await initiateSubscriptionPayment(paymentParams)

      if (result.error) {
        // USSD Push échoué → tenter le fallback /ext
        console.warn('[SingPay-Sub] USSD Push échoué, tentative fallback /ext:', result.error)
        setSubmitting(false)
        setSubmittingFallback(true)
        try {
          const extResult = await getSubscriptionExternalPaymentLink(paymentParams)
          if (extResult.link) {
            setExtPaymentLink(extResult.link)
            return
          }
          setError(extResult.error ?? result.error)
        } catch {
          setError('Le service de paiement est temporairement indisponible. Réessayez dans quelques minutes ou utilisez le paiement manuel.')
        } finally {
          setSubmittingFallback(false)
        }
        return
      }

      if (result.paymentId) {
        setTrackingPaymentId(result.paymentId)
      }
    } catch {
      setError('Une erreur inattendue est survenue. Veuillez réessayer.')
    } finally {
      setSubmitting(false)
      setSubmittingFallback(false)
    }
  }

  return (
    <AppCard variant="flat">
      <CardHeader>
        <div className="layout-inline">
          <Button variant="ghost" size="icon" onClick={onBack} className="-ml-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <CardTitle className="type-card-title">Paiement Mobile Money</CardTitle>
            <CardDescription>
              Validez le paiement directement sur votre téléphone
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="layout-form">
          {/* Récap */}
          <Alert>
            <Users className="h-4 w-4" />
            <AlertDescription>
              <span className="font-medium">
                Abonnement pour {userCount} utilisateur{userCount > 1 ? 's' : ''}
              </span>
              <br />
              Plan {plan} — {formatPrice(monthlyPrice)}/mois
            </AlertDescription>
          </Alert>

          {/* Choix opérateur */}
          <div className="layout-field">
            <Label>Opérateur</Label>
            <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setOperator('airtel')}
                  className={cn(
                    'flex flex-col items-center justify-center gap-2 rounded-lg border-2 p-3 text-sm font-medium transition-colors',
                    operator === 'airtel'
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border hover:border-muted-foreground',
                  )}
                  >
                  <Image
                    src="/images/airtelmoney.webp"
                    width={80}
                    height={80}
                    alt="logo"
                  />  
                  <span>
                    Airtel Money
                  </span>
                </button>
              <button
                type="button"
                onClick={() => setOperator('moov')}
                className={cn(
                  'flex flex-col items-center justify-center gap-2 rounded-lg border-2 p-3 text-sm font-medium transition-colors',
                  operator === 'moov'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border hover:border-muted-foreground',
                )}
              >
                <Image
                    src="/images/moovmoney.png"
                    width={80}
                    height={80}
                    alt="logo"
                />
                <span>
                  Moov Money
                </span>
              </button>
            </div>
          </div>

          {/* Numéro de téléphone */}
          <div className="layout-field">
            <Label htmlFor="phone">Numéro de téléphone</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="07 XX XX XX"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={submitting}
            />
            <p className="text-xs text-muted-foreground">
              Le numéro {operator === 'airtel' ? 'Airtel Money' : 'Moov Money'} sur lequel
              vous recevrez la demande de paiement
            </p>
          </div>

          {/* Erreur */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Submit */}
          <LoadingButton
            type="submit"
            disabled={!phoneNumber.trim() || submittingFallback}
            isLoading={submitting || submittingFallback}
            loadingText={submittingFallback ? 'Génération du lien de paiement...' : 'Envoi en cours...'}
            icon={<Smartphone />}
            className="w-full"
            size="lg"
          >
            Payer {formatPrice(amount)}
          </LoadingButton>

          <p className="text-xs text-muted-foreground text-center">
            {submittingFallback
              ? 'La notification USSD n\'a pas abouti. Un lien de paiement alternatif est en cours de génération...'
              : 'Vous recevrez une notification USSD sur votre téléphone. Validez avec votre code PIN pour confirmer le paiement.'
            }
          </p>
        </form>
      </CardContent>
    </AppCard>
  )
}

// ============================================================
// FORMULAIRE MANUEL (existant, déplacé ici)
// ============================================================

function ManualPaymentForm({
  restaurantId,
  plan,
  billingCycle,
  userCount,
  amount,
  onBack,
}: PaymentFormProps & { onBack: () => void }) {
  const router = useRouter()

  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const monthlyPrice = calculateMonthlyPrice(plan, userCount)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (!selectedFile.type.startsWith('image/')) {
      setError('Le fichier doit être une image (PNG, JPG, JPEG)')
      return
    }

    const maxSize = 5 * 1024 * 1024
    if (selectedFile.size > maxSize) {
      setError("L'image ne doit pas dépasser 5MB")
      return
    }

    setFile(selectedFile)
    setError(null)

    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(selectedFile)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file) {
      setError('Veuillez ajouter une preuve de paiement')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      setUploading(true)

      const { url, error: uploadError } = await uploadPaymentProof(
        file,
        restaurantId,
      )

      setUploading(false)

      if (uploadError || !url) {
        throw new Error(uploadError || "Erreur lors de l'upload")
      }

      const result = await createManualPayment({
        restaurantId,
        plan,
        billingCycle,
        userCount,
        proofUrl: url,
        notes: notes.trim() || undefined,
      })

      if (!result.success) {
        throw new Error(result.error)
      }

      toast.success('Paiement soumis avec succès', {
        description: 'Validation sous 24h',
      })

      router.push('/dashboard/subscription')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Erreur lors de la soumission',
      )
    } finally {
      setSubmitting(false)
      setUploading(false)
    }
  }

  return (
    <AppCard variant="flat">
      <CardHeader>
        <div className="layout-inline">
          <Button variant="ghost" size="icon" onClick={onBack} className="-ml-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <CardTitle className="type-card-title">Paiement manuel</CardTitle>
            <CardDescription>
              Uploadez la preuve de votre paiement pour validation
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="layout-form">
          {/* Récap */}
          <Alert>
            <Users className="h-4 w-4" />
            <AlertDescription>
              <span className="font-medium">
                Abonnement pour {userCount} utilisateur{userCount > 1 ? 's' : ''}
              </span>
              <br />
              Plan {plan} — {formatPrice(monthlyPrice)}/mois
            </AlertDescription>
          </Alert>

          {/* Upload */}
          <div className="layout-field">
            <Label htmlFor="proof">Preuve de paiement *</Label>
            <p className="text-xs text-muted-foreground">
              PNG, JPG, JPEG (max 5MB)
            </p>

            {!preview ? (
              <Input
                id="proof"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
              />
            ) : (
              <div className="space-y-3">
                <div className="relative h-64 w-full rounded-md border bg-muted overflow-hidden">
                  <Image
                    src={preview}
                    alt="Aperçu preuve paiement"
                    fill
                    className="object-contain"
                  />
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setFile(null)
                    setPreview(null)
                  }}
                  className="w-full"
                >
                  Changer l&apos;image
                </Button>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="layout-field">
            <Label htmlFor="notes">Notes (optionnel)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Numéro de transaction, date..."
              rows={4}
            />
          </div>

          {/* Erreur */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Submit */}
          <LoadingButton
            type="submit"
            disabled={!file}
            isLoading={submitting || uploading}
            loadingText="Traitement..."
            icon={<CheckCircle2 />}
            className="w-full"
            size="lg"
          >
            Soumettre {formatPrice(amount)}
          </LoadingButton>

          <p className="text-xs text-muted-foreground text-center">
            Validation sous 24h ouvrées. Notification envoyée par email.
          </p>
        </form>
      </CardContent>
    </AppCard>
  )
}
