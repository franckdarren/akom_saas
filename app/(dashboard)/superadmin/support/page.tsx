// app/(dashboard)/superadmin/support/page.tsx
import { redirect } from 'next/navigation'
import { getAllTickets, getSupportStats } from '@/lib/actions/support'
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
import { PageHeader } from '@/components/ui/page-header'
import { AppInsetHeader } from '@/components/layout/AppInsetHeader'

export default async function SupportPage({
    searchParams,
}: {
    searchParams: Promise<{ ticket?: string }>
}) {
    const { ticket } = await searchParams

    // Compatibilité avec les anciennes notifications qui utilisent ?ticket=
    if (ticket) redirect(`/superadmin/support/${ticket}`)

    const [tickets, stats] = await Promise.all([
        getAllTickets(),
        getSupportStats(),
    ])

    return (
        <>
            <AppInsetHeader>
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/superadmin">Administration</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>Support client</BreadcrumbPage>
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
