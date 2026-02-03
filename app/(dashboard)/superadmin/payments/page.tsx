// app/superadmin/payments/page.tsx
import prisma from '@/lib/prisma'
import { PaymentCard } from './PaymentCard'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

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
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold">Gestion des Paiements</h1>
                <p className="text-gray-600 mt-1">
                    Validez ou refusez les paiements manuels
                </p>
            </div>

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
                        <div className="text-center py-12 text-gray-500">
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
                        <div className="text-center py-12 text-gray-500">
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
                        <div className="text-center py-12 text-gray-500">
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
    )
}