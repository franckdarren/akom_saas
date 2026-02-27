// app/(dashboard)/dashboard/pos/orders/page.tsx
import {getCurrentUserAndRestaurant} from '@/lib/auth/session'
import {redirect} from 'next/navigation'
import prisma from '@/lib/prisma'
import {Separator} from '@/components/ui/separator'
import {SidebarTrigger} from '@/components/ui/sidebar'
import {
    Breadcrumb, BreadcrumbItem, BreadcrumbLink,
    BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {POSOrdersShell} from '../_components/POSOrdersShell'

interface PageProps {
    searchParams: Promise<{ date?: string }>
}

export default async function POSOrdersPage({searchParams}: PageProps) {
    const {userId, restaurantId} = await getCurrentUserAndRestaurant()
    if (!userId || !restaurantId) redirect('/login')

    const restaurantUser = await prisma.restaurantUser.findUnique({
        where: {userId_restaurantId: {userId, restaurantId}},
        select: {role: true},
    })
    if (!restaurantUser || !['admin', 'cashier'].includes(restaurantUser.role ?? '')) {
        redirect('/dashboard')
    }

    // ─── Résoudre la date demandée ───────────────────────────────────
    // Par défaut : aujourd'hui. Le searchParam "date" permet l'historique.
    // Format attendu : YYYY-MM-DD (ex: 2025-03-15)
    const params = await searchParams
    const requestedDate = params.date

    let targetDate: Date
    if (requestedDate && /^\d{4}-\d{2}-\d{2}$/.test(requestedDate)) {
        targetDate = new Date(requestedDate)
        // Vérifier que la date est valide
        if (isNaN(targetDate.getTime())) targetDate = new Date()
    } else {
        targetDate = new Date()
    }

    // Borne de début : minuit du jour cible (heure locale serveur)
    const dayStart = new Date(targetDate)
    dayStart.setHours(0, 0, 0, 0)

    // Borne de fin : 23h59:59.999 du même jour
    const dayEnd = new Date(targetDate)
    dayEnd.setHours(23, 59, 59, 999)

    // ─── Requête commandes du jour ───────────────────────────────────
    const orders = await prisma.order.findMany({
        where: {
            restaurantId,
            createdAt: {gte: dayStart, lte: dayEnd},
        },
        include: {
            orderItems: {
                select: {
                    id: true, productName: true, quantity: true, unitPrice: true,
                },
            },
            table: {select: {number: true}},
            payments: {
                select: {
                    id: true, method: true, status: true, amount: true,
                },
            },
        },
        orderBy: {createdAt: 'desc'},
    })

    // ─── Stats du jour ───────────────────────────────────────────────
    const stats = {
        total: orders.length,
        pending: orders.filter(o => o.status === 'pending').length,
        preparing: orders.filter(o => o.status === 'preparing').length,
        ready: orders.filter(o => o.status === 'ready').length,
        delivered: orders.filter(o => o.status === 'delivered').length,
        cancelled: orders.filter(o => o.status === 'cancelled').length,
        unpaid: orders.filter(o =>
            o.status !== 'cancelled' &&
            !o.payments.some(p => p.status === 'paid')
        ).length,
        revenue: orders
            .filter(o => o.status !== 'cancelled')
            .reduce((sum, o) => sum + o.totalAmount, 0),
    }

    return (
        <>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-background">
                <SidebarTrigger className="-ml-1"/>
                <Separator orientation="vertical" className="mr-2 h-4"/>
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/dashboard/pos">
                                Caissière (POS)
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator/>
                        <BreadcrumbItem>
                            <BreadcrumbPage>Historique des ventes</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </header>

            <div className="flex flex-1 flex-col gap-6 p-6 overflow-auto">
                <POSOrdersShell
                    orders={orders}
                    stats={stats}
                    selectedDate={dayStart.toISOString().split('T')[0]}
                />
            </div>
        </>
    )
}