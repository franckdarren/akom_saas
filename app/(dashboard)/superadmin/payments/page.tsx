// app/superadmin/payments/page.tsx
import prisma from '@/lib/prisma'
import { PaymentCard } from './PaymentCard'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Breadcrumb,
    BreadcrumbList,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbSeparator,
    BreadcrumbPage,
} from '@/components/ui/breadcrumb'
import { Suspense } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { AppInsetHeader } from '@/components/layout/AppInsetHeader'

export default async function PaymentsPage() {
    const payments = await prisma.subscriptionPayment.findMany({
        include: {
            restaurant: { select: { name: true, slug: true } },
            subscription: { select: { plan: true } },
        },
        orderBy: { createdAt: 'desc' },
    })

    const pending = payments.filter((p) => p.status === 'pending')
    const confirmed = payments.filter((p) => p.status === 'confirmed')
    const failed = payments.filter((p) => p.status === 'failed')

    return (
        <>
            {/* Header */}
            <AppInsetHeader>
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/superadmin">Administration</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>Gestion des Paiements</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </AppInsetHeader>

            <div className='layout-page'>
                <PageHeader
                    title="Gestion des Paiements"
                    description="Validez ou refusez les paiements manuels"
                />

                {/* Tabs */}
                <Tabs defaultValue="pending" className="w-full">
                    <TabsList>
                        <TabsTrigger value="pending">
                            En attente ({pending.length})
                        </TabsTrigger>
                        <TabsTrigger value="confirmed">
                            Confirmés ({confirmed.length})
                        </TabsTrigger>
                        <TabsTrigger value="failed">Échoués ({failed.length})</TabsTrigger>
                    </TabsList>

                    <TabsContent value="pending" className="space-y-4 mt-6">
                        {pending.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <p>Aucun paiement en attente</p>
                            </div>
                        ) : (
                            pending.map((payment) => (
                                <PaymentCard key={payment.id} payment={payment} />
                            ))
                        )}
                    </TabsContent>

                    <TabsContent value="confirmed" className="space-y-4 mt-6">
                        {confirmed.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <p>Aucun paiement confirmé</p>
                            </div>
                        ) : (
                            confirmed.map((payment) => (
                                <PaymentCard key={payment.id} payment={payment} />
                            ))
                        )}
                    </TabsContent>

                    <TabsContent value="failed" className="space-y-4 mt-6">
                        {failed.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <p>Aucun paiement échoué</p>
                            </div>
                        ) : (
                            failed.map((payment) => (
                                <PaymentCard key={payment.id} payment={payment} />
                            ))
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </>
    )
}