// app/(dashboard)/dashboard/transactions/page.tsx
import {redirect} from 'next/navigation'
import {getCurrentUserAndRestaurant} from '@/lib/auth/session'
import {getTransactions} from '@/lib/actions/transaction'
import {TransactionsShell} from './_components/TransactionsShell'
import {
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {AppInsetHeader} from '@/components/layout/AppInsetHeader'

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
            <AppInsetHeader>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/dashboard">Opérations</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator/>
                    <BreadcrumbItem>
                        <BreadcrumbPage>Transactions</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </AppInsetHeader>

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
