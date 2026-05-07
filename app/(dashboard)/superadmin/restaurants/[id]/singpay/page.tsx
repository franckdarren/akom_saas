// app/(dashboard)/superadmin/restaurants/[id]/singpay/page.tsx

import { redirect, notFound } from 'next/navigation'
import { isSuperadmin } from '@/lib/auth/superadmin'
import prisma from '@/lib/prisma'
import { SingpayConfigForm } from './singpay-config-form'
import { Button } from '@/components/ui/button'
import { AppInsetHeader } from '@/components/layout/AppInsetHeader'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { PageHeader } from '@/components/ui/page-header'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function SingpayConfigPage({ params }: PageProps) {
  const { id } = await params

  if (!(await isSuperadmin())) {
    redirect('/dashboard')
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      slug: true,
      singpayConfig: true,
    },
  })

  if (!restaurant) {
    notFound()
  }

  return (
    <>
      <AppInsetHeader>
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/superadmin/restaurants/${id}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Link>
        </Button>
      </AppInsetHeader>

      <div className="layout-page">
        <PageHeader
          title={`SingPay — ${restaurant.name}`}
          description="Configuration du paiement mobile money pour cet établissement"
        />

        <SingpayConfigForm
          restaurantId={restaurant.id}
          config={restaurant.singpayConfig}
        />
      </div>
    </>
  )
}
