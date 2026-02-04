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
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'


export default async function SupportPage() {
    const [tickets, stats] = await Promise.all([
        getAllTickets(),
        getSupportStats(),
    ])

    return (
        <>
            {/* Header */}
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <div className="flex justify-between w-full">
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
                </div>
            </header>

            <div className='flex flex-col gap-6 p-6'>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Support Client</h1>
                    <p className="text-muted-foreground mt-2">
                        Gérez les tickets de support client
                    </p>
                </div>

                <SupportStatsCards stats={stats} />
                <SupportTicketsTable tickets={tickets} />
            </div>

        </>
    )
}
