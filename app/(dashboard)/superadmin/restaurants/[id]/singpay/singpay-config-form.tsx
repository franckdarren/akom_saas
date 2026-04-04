// app/(dashboard)/superadmin/restaurants/[id]/singpay/singpay-config-form.tsx
'use client'

import { useState } from 'react'
import { AppCard } from '@/components/ui/app-card'
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { LoadingButton } from '@/components/ui/loading-button'
import { Badge } from '@/components/ui/badge'
import { Copy, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { saveSingpayConfig, toggleSingpayEnabled } from '@/lib/actions/singpay-config'
import { toast } from 'sonner'
import type { RestaurantSingpayConfig } from '@prisma/client'

interface SingpayConfigFormProps {
  restaurantId: string
  config: RestaurantSingpayConfig | null
}

export function SingpayConfigForm({ restaurantId, config }: SingpayConfigFormProps) {
  const [walletId, setWalletId] = useState(config?.walletId ?? '')
  const [merchantCode, setMerchantCode] = useState(config?.merchantCode ?? '')
  const [disbursementId, setDisbursementId] = useState(config?.defaultDisbursementId ?? '')
  const [enabled, setEnabled] = useState(config?.enabled ?? false)
  const [isConfigured, setIsConfigured] = useState(config?.isConfigured ?? false)
  const [isSaving, setIsSaving] = useState(false)
  const [isToggling, setIsToggling] = useState(false)
  const [copied, setCopied] = useState(false)

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
  const callbackUrl = config?.callbackUrl ?? `${appUrl}/api/webhooks/singpay/${restaurantId}`

  async function handleSave() {
    if (!walletId.trim()) {
      toast.error('Le Wallet ID est obligatoire')
      return
    }

    setIsSaving(true)
    try {
      const result = await saveSingpayConfig({
        restaurantId,
        walletId: walletId.trim(),
        merchantCode: merchantCode.trim() || undefined,
        defaultDisbursementId: disbursementId.trim() || undefined,
      })

      if (result.success) {
        setIsConfigured(true)
        toast.success('Configuration SingPay enregistrée')
      } else {
        toast.error(result.error)
      }
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleToggle(checked: boolean) {
    setIsToggling(true)
    try {
      const result = await toggleSingpayEnabled(restaurantId, checked)

      if (result.success) {
        setEnabled(checked)
        toast.success(checked ? 'Paiement mobile money activé' : 'Paiement mobile money désactivé')
      } else {
        toast.error(result.error)
      }
    } catch {
      toast.error('Erreur lors de la modification')
    } finally {
      setIsToggling(false)
    }
  }

  function handleCopyCallback() {
    navigator.clipboard.writeText(callbackUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="layout-sections">
      {/* Activation */}
      <AppCard>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="type-card-title">Paiement Mobile Money</CardTitle>
            <div className="layout-inline">
              {enabled ? (
                <Badge className="bg-success text-success-foreground">Activé</Badge>
              ) : (
                <Badge variant="secondary">Désactivé</Badge>
              )}
              <Switch
                checked={enabled}
                onCheckedChange={handleToggle}
                disabled={isToggling || !isConfigured}
              />
            </div>
          </div>
        </CardHeader>
        {!isConfigured && (
          <CardContent>
            <p className="type-body-muted">
              Remplissez et enregistrez la configuration ci-dessous avant de pouvoir activer le paiement.
            </p>
          </CardContent>
        )}
      </AppCard>

      {/* Configuration wallet */}
      <AppCard>
        <CardHeader>
          <CardTitle className="type-card-title">Configuration du portefeuille</CardTitle>
        </CardHeader>
        <CardContent className="layout-form">
          <div className="layout-field">
            <Label htmlFor="walletId" className="type-label">
              Wallet ID <span className="text-destructive">*</span>
            </Label>
            <Input
              id="walletId"
              value={walletId}
              onChange={(e) => setWalletId(e.target.value)}
              placeholder="ID du portefeuille SingPay"
            />
            <p className="type-caption text-muted-foreground">
              Disponible dans le détail du portefeuille sur SingPay Workspace
            </p>
          </div>

          <div className="layout-field">
            <Label htmlFor="merchantCode" className="type-label">
              Code marchand
            </Label>
            <Input
              id="merchantCode"
              value={merchantCode}
              onChange={(e) => setMerchantCode(e.target.value)}
              placeholder="Code marchand (optionnel)"
            />
          </div>

          <div className="layout-field">
            <Label htmlFor="disbursementId" className="type-label">
              ID de distribution
            </Label>
            <Input
              id="disbursementId"
              value={disbursementId}
              onChange={(e) => setDisbursementId(e.target.value)}
              placeholder="ID de la distribution par défaut"
            />
            <p className="type-caption text-muted-foreground">
              Obligatoire en production. Redirige les fonds vers le compte du commerçant.
            </p>
          </div>

          <LoadingButton
            onClick={handleSave}
            isLoading={isSaving}
            loadingText="Enregistrement..."
          >
            Enregistrer la configuration
          </LoadingButton>
        </CardContent>
      </AppCard>

      {/* URL de callback */}
      <AppCard variant="flat">
        <CardHeader>
          <CardTitle className="type-card-title">URL de callback</CardTitle>
        </CardHeader>
        <CardContent className="layout-card-body">
          <p className="type-body-muted">
            Configurez cette URL dans le portefeuille SingPay pour recevoir les notifications de paiement.
          </p>
          <div className="flex items-center gap-2 rounded-lg bg-muted p-3">
            <code className="type-code flex-1 break-all">{callbackUrl}</code>
            <Button variant="ghost" size="icon" className="shrink-0" onClick={handleCopyCallback}>
              {copied ? (
                <CheckCircle2 className="h-4 w-4 text-success" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </AppCard>
    </div>
  )
}
