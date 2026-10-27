// app/(dashboard)/dashboard/pos/monnaie-due/page.tsx
import {redirect} from 'next/navigation'
import prisma from '@/lib/prisma'
import {getCurrentUserAndRestaurant} from '@/lib/auth/session'
import {listChangeDues} from '@/lib/actions/change-due'
import {ChangeDueShell} from './_components/ChangeDueShell'
import {AppInsetHeader} from '@/components/layout/AppInsetHeader'
import {
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

export const metadata = {title: 'Monnaie due — Akôm'}

export default async function MonnaieDuePage() {
    const {userId, restaurantId} = await getCurrentUserAndRestaurant()
    if (!userId || !restaurantId) redirect('/login')

    // Même garde que /dashboard/pos : la caissière crée et solde les dettes,
    // l'admin les supervise et peut les annuler.
    const member = await prisma.restaurantUser.findUnique({
        where: {userId_restaurantId: {userId, restaurantId}},
        select: {role: true, customRole: {select: {slug: true}}},
    })
    const slug = member?.customRole?.slug ?? member?.role ?? null

    if (slug !== 'admin' && slug !== 'cashier') redirect('/dashboard')

    const result = await listChangeDues()
    if (!result.success) redirect('/dashboard/pos')

    return (
        <>
            <AppInsetHeader>
                <div className="my-auto">
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/dashboard/pos">Comptoir</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator/>
                        <BreadcrumbItem>
                            <BreadcrumbPage>Monnaie due</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </div>
            </AppInsetHeader>

            <div className="layout-page">
                <ChangeDueShell initialData={result.data} isAdmin={slug === 'admin'}/>
            </div>
        </>
    )
}
