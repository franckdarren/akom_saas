import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardLoading() {
    return (
        <>
            {/* Header */}
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <Skeleton className="h-7 w-7 rounded-sm" />
                <div className="h-4 w-px bg-border mx-1" />
                <Skeleton className="h-4 w-32" />
                <div className="ml-auto">
                    <Skeleton className="h-8 w-36 rounded-lg" />
                </div>
            </header>

            <div className="layout-page overflow-auto">
                {/* 4 KPI cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="rounded-xl border bg-card p-6 space-y-3">
                            <div className="flex items-center justify-between">
                                <Skeleton className="h-4 w-28" />
                                <Skeleton className="h-4 w-4 rounded" />
                            </div>
                            <Skeleton className="h-8 w-24" />
                            <Skeleton className="h-3 w-32" />
                        </div>
                    ))}
                </div>

                {/* Charts section */}
                <div className="grid gap-4 md:grid-cols-2">
                    <Skeleton className="h-72 rounded-xl" />
                    <Skeleton className="h-72 rounded-xl" />
                </div>

                {/* Bottom cards : alertes stock + commandes récentes */}
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl border bg-card p-6 space-y-4">
                        <Skeleton className="h-5 w-36" />
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <Skeleton className="h-8 w-8 rounded flex-shrink-0" />
                                <div className="flex-1 space-y-1.5">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-3 w-20" />
                                </div>
                                <Skeleton className="h-5 w-14 rounded-full" />
                            </div>
                        ))}
                    </div>
                    <div className="rounded-xl border bg-card p-6 space-y-4">
                        <Skeleton className="h-5 w-44" />
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                                    <div className="space-y-1.5">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-3 w-16" />
                                    </div>
                                </div>
                                <Skeleton className="h-5 w-20 rounded-full" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    )
}
