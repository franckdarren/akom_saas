// app/(dashboard)/dashboard/transactions/page.tsx
import {redirect} from 'next/navigation'
import {getCurrentUserAndRestaurant} from '@/lib/auth/session'
import {getTransactions} from '@/lib/actions/transaction'
import {TransactionsShell} from './_components/TransactionsShell'
import {SidebarTrigger} from '@/components/ui/sidebar'
import {Separator} from '@/components/ui/separator'
import {
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

export const metadata = {title: 'Transactions — Akôm'}

export default async function TransactionsPage() {
    const {userId, restaurantId} = await getCurrentUserAndRestaurant()
    if (!userId || !restaurantId) redirect('/login')

    // Données initiales : mois en cours
    const now = new Date()
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    const {transactions, total, summary} = await getTransactions({
        startDate,
        endDate,
        page: 1,
        pageSize: 50,
    })

    return (
        <>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1"/>
                <Separator orientation="vertical" className="mr-2 h-4"/>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/dashboard">Opérations</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator/>
                    <BreadcrumbItem>
                        <BreadcrumbPage>Transactions</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </header>

            <div className="layout-page">
                <TransactionsShell
                    initialTransactions={transactions}
                    initialSummary={summary}
                    initialTotal={total}
                    defaultStartDate={startDate.toISOString()}
                    defaultEndDate={endDate.toISOString()}
                />
            </div>
        </>
    )
}
