'use client'

// components/dashboard/stats/FinancesTab.tsx

import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'
import { StatsCard } from './StatsCard'
import { NetResultCard } from './NetResultCard'
import { CashSessionsKpi } from './CashSessionsKpi'
import { formatPrice } from '@/lib/utils/format'
import { CreditCard, Receipt, Wallet } from 'lucide-react'
import type { FinancialPeriodStats, PaymentAnalytics } from '@/types/stats'

function computePercentChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0
    return Math.round(((current - previous) / previous) * 1000) / 10
}

const ExpensesByCategoryChart = dynamic(
    () => import('./ExpensesByCategoryChart').then((m) => ({ default: m.ExpensesByCategoryChart })),
    { ssr: false, loading: () => <Skeleton className="h-[340px] w-full rounded-xl" /> },
)

const RevenueByMethodChart = dynamic(
    () => import('./RevenueByMethodChart').then((m) => ({ default: m.RevenueByMethodChart })),
    { ssr: false, loading: () => <Skeleton className="h-[340px] w-full rounded-xl" /> },
)

const PaymentStatusChart = dynamic(
    () => import('./PaymentStatusChart').then((m) => ({ default: m.PaymentStatusChart })),
    { ssr: false, loading: () => <Skeleton className="h-[280px] w-full rounded-xl" /> },
)

const PaymentMethodSuccessChart = dynamic(
    () => import('./PaymentMethodSuccessChart').then((m) => ({ default: m.PaymentMethodSuccessChart })),
    { ssr: false, loading: () => <Skeleton className="h-[280px] w-full rounded-xl" /> },
)

interface FinancesTabProps {
    financial: FinancialPeriodStats
    paymentAnalytics: PaymentAnalytics | null
}

export function FinancesTab({ financial, paymentAnalytics }: FinancesTabProps) {
    return (
        <div className="layout-sections">
            {/* KPIs */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <NetResultCard financial={financial} />
                <StatsCard
                    title="CA POS"
                    value={formatPrice(financial.akomRevenue)}
                    icon={<Receipt className="h-4 w-4" />}
                    variant="success"
                    description="Paiements encaissés"
                />
                <StatsCard
                    title="Recettes manuelles"
                    value={formatPrice(financial.manualRevenue)}
                    icon={<Wallet className="h-4 w-4" />}
                    variant="default"
                    description="Saisies en caisse"
                />
                <CashSessionsKpi
                    sessionsCount={financial.sessionsCount}
                    sessionsWithGap={financial.sessionsWithGap}
                />
            </div>

            {/* Graphiques CA & dépenses */}
            <div className="grid gap-6 md:grid-cols-2">
                <ExpensesByCategoryChart data={financial.expensesByCategory} />
                <RevenueByMethodChart data={financial.revenueByMethod} />
            </div>

            {/* Qualité des paiements */}
            {paymentAnalytics && (() => {
                const paymentsChange = computePercentChange(
                    paymentAnalytics.totalPayments,
                    paymentAnalytics.previousTotalPayments,
                )
                return (
                    <>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <StatsCard
                                title="Paiements initiés"
                                value={paymentAnalytics.totalPayments}
                                icon={<CreditCard className="h-4 w-4" />}
                                variant="default"
                                trend={{
                                    value: Math.abs(paymentsChange),
                                    isPositive: paymentsChange >= 0,
                                }}
                            />
                            <StatsCard
                                title="Taux de succès"
                                value={`${paymentAnalytics.overallSuccessRate}%`}
                                icon={<CreditCard className="h-4 w-4" />}
                                variant={paymentAnalytics.overallSuccessRate >= 80 ? 'success' : 'warning'}
                                description="Paiements aboutis / initiés"
                            />
                        </div>
                        <div className="grid gap-6 md:grid-cols-2">
                            <PaymentStatusChart
                                data={paymentAnalytics.byStatus}
                                totalPayments={paymentAnalytics.totalPayments}
                                overallSuccessRate={paymentAnalytics.overallSuccessRate}
                            />
                            <PaymentMethodSuccessChart data={paymentAnalytics.byMethod} />
                        </div>
                    </>
                )
            })()}
        </div>
    )
}
