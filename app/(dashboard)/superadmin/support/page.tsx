// app/(dashboard)/superadmin/support/page.tsx
import { getAllTickets, getSupportStats } from '@/lib/actions/support'
import { formatDate } from '@/lib/utils/format'
import SupportTicketsTable from '@/components/superadmin/support/SupportTicketsTable'
import SupportStatsCards from '@/components/superadmin/support/SupportStatsCards'
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


export default async function SupportPage() {
    const [tickets, stats] = await Promise.all([
        getAllTickets(),
        getSupportStats(),
    ])

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
                    title="Support Client"
                    description="Gérez les tickets de support client"
                />

                <SupportStatsCards stats={stats} />
                <SupportTicketsTable tickets={tickets} />
            </div>

        </>
    )
}
