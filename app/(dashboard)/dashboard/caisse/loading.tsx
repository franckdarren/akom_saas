import { Skeleton } from '@/components/ui/skeleton'
import { AppCard, CardContent, CardHeader } from '@/components/ui/app-card'
import { Separator } from '@/components/ui/separator'

export default function CaisseLoading() {
    return (
        <>
            {/* Header breadcrumb */}
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <Skeleton className="h-7 w-7 rounded-sm" />
                <div className="h-4 w-px bg-border mx-1" />
                <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-3 rounded-sm" />
                    <Skeleton className="h-4 w-16" />
                </div>
            </header>

            <div className="layout-page">
                {/* Titre + action */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1.5">
                        <Skeleton className="h-9 w-40" />
                        <Skeleton className="h-4 w-64 max-w-full" />
                    </div>
                    <Skeleton className="h-10 w-44 rounded-md" />
                </div>

                {/* Balance du jour (BalanceCard) */}
                <AppCard>
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-4 w-4 rounded" />
                            <Skeleton className="h-5 w-36" />
                        </div>
                    </CardHeader>
                    <CardContent className="layout-card-body">
                        {/* KPI row */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="rounded-xl border bg-card p-4 space-y-2">
                                    <div className="flex items-center gap-1.5">
                                        <Skeleton className="h-4 w-4 rounded" />
                                        <Skeleton className="h-3 w-24" />
                                    </div>
                                    <Skeleton className="h-5 w-28" />
                                </div>
                            ))}
                        </div>

                        <Separator />

                        {/* Balances */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                                <Skeleton className="h-3 w-32" />
                                <Skeleton className="h-7 w-32" />
                                <Skeleton className="h-3 w-40" />
                            </div>
                            <div className="space-y-1.5">
                                <Skeleton className="h-3 w-28" />
                                <Skeleton className="h-7 w-32" />
                                <Skeleton className="h-3 w-36" />
                            </div>
                        </div>

                        <Separator />

                        <Skeleton className="h-3 w-72 max-w-full" />
                    </CardContent>
                </AppCard>

                {/* Recettes / Dépenses */}
                <div className="grid gap-4 md:grid-cols-2">
                    {Array.from({ length: 2 }).map((_, i) => (
                        <AppCard key={i}>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <Skeleton className="h-5 w-32" />
                                    <Skeleton className="h-5 w-24" />
                                </div>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-4">
                                <Skeleton className="h-9 w-full rounded-md" />
                                <Separator />
                                <div className="space-y-3">
                                    {Array.from({ length: 5 }).map((_, j) => (
                                        <div key={j} className="flex items-center justify-between">
                                            <div className="space-y-1.5">
                                                <Skeleton className="h-4 w-32" />
                                                <Skeleton className="h-3 w-20" />
                                            </div>
                                            <Skeleton className="h-4 w-16" />
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </AppCard>
                    ))}
                </div>
            </div>
        </>
    )
}
