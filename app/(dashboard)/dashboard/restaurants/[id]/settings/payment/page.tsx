// app/(dashboard)/dashboard/restaurants/[id]/settings/payment/page.tsx

import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { PageHeader } from '@/components/ui/page-header'
import { AppCard } from '@/components/ui/app-card'
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle, Smartphone } from 'lucide-react'

export default async function PaymentSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      singpayConfig: {
        select: {
          enabled: true,
          isConfigured: true,
          walletId: true,
        },
      },
    },
  })

  if (!restaurant) notFound()

  // Vérifier l'accès
  const membership = await prisma.restaurantUser.findUnique({
    where: { userId_restaurantId: { userId: user.id, restaurantId: id } },
  })

  if (!membership) notFound()

  const config = restaurant.singpayConfig
  const isActive = config?.enabled && config?.isConfigured

  return (
    <div className="layout-page">
      <PageHeader
        title="Paiement"
        description="Configuration des moyens de paiement de votre établissement"
      />

      <div className="layout-sections">
        {/* Mobile Money */}
        <AppCard>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="layout-inline">
                <Smartphone className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="type-card-title">Mobile Money</CardTitle>
              </div>
              {isActive ? (
                <Badge className="bg-success text-success-foreground">Activé</Badge>
              ) : (
                <Badge variant="secondary">Non configuré</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="layout-card-body">
            {isActive ? (
              <div className="space-y-3">
                <div className="layout-inline text-success">
                  <CheckCircle2 className="h-4 w-4" />
                  <p className="type-body">
                    Le paiement par Airtel Money et Moov Money est activé pour votre établissement.
                  </p>
                </div>
                <p className="type-body-muted">
                  Vos clients peuvent payer directement depuis le catalogue en ligne.
                  Les fonds sont versés sur votre compte mobile money.
                </p>
                {config?.walletId && (
                  <div className="rounded-lg bg-muted p-3">
                    <p className="type-caption text-muted-foreground">Wallet ID</p>
                    <p className="type-code">
                      {config.walletId.substring(0, 8)}...{config.walletId.slice(-4)}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="layout-inline text-muted-foreground">
                  <XCircle className="h-4 w-4" />
                  <p className="type-body">
                    Le paiement mobile money n'est pas encore configuré.
                  </p>
                </div>
                <p className="type-body-muted">
                  Contactez l'équipe Akôm pour activer le paiement par Airtel Money et Moov Money
                  sur votre catalogue en ligne.
                </p>
              </div>
            )}
          </CardContent>
        </AppCard>

        {/* Espèces — toujours actif */}
        <AppCard>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="type-card-title">Espèces</CardTitle>
              <Badge className="bg-success text-success-foreground">Toujours actif</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="type-body-muted">
              Le paiement en espèces est toujours disponible pour vos clients,
              que ce soit au comptoir ou au retrait de la commande.
            </p>
          </CardContent>
        </AppCard>
      </div>
    </div>
  )
}
