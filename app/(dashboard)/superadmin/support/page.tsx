// app/(dashboard)/superadmin/support/page.tsx
import { getAllTickets, getSupportStats } from '@/lib/actions/support'
import { formatDate } from '@/lib/utils/format'
import SupportTicketsTable from '@/components/superadmin/support/SupportTicketsTable'
import SupportStatsCards from '@/components/superadmin/support/SupportStatsCards'    

export default async function SupportPage() {
    const [tickets, stats] = await Promise.all([
        getAllTickets(),
        getSupportStats(),
    ])

    return (
        <div className="space-y-6">
            <SupportStatsCards stats={stats} />
            <SupportTicketsTable tickets={tickets} />
        </div>
    )
}
