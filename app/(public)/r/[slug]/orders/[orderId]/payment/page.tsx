// app/(public)/r/[slug]/orders/[orderId]/payment/page.tsx

import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { PaymentStatusTracker } from './payment-status-tracker'

interface PaymentPageProps {
  params: Promise<{ slug: string; orderId: string }>
  searchParams: Promise<{ paymentId?: string }>
}

export default async function PaymentPage({ params, searchParams }: PaymentPageProps) {
  const { slug, orderId } = await params
  const { paymentId } = await searchParams

  if (!paymentId) {
    notFound()
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      orderNumber: true,
      totalAmount: true,
      status: true,
      restaurant: {
        select: { name: true, slug: true },
      },
    },
  })

  if (!order || order.restaurant.slug !== slug) {
    notFound()
  }

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    select: {
      id: true,
      status: true,
      phoneNumber: true,
      method: true,
    },
  })

  if (!payment) {
    notFound()
  }

  return (
    <PaymentStatusTracker
      paymentId={payment.id}
      initialStatus={payment.status}
      phoneNumber={payment.phoneNumber ?? ''}
      operator={payment.method === 'airtel_money' ? 'Airtel Money' : 'Moov Money'}
      orderNumber={order.orderNumber ?? ''}
      amount={order.totalAmount}
      restaurantName={order.restaurant.name}
      restaurantSlug={order.restaurant.slug}
      orderId={order.id}
    />
  )
}

export function generateMetadata() {
  return {
    title: 'Paiement en cours',
  }
}
