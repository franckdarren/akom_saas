import { Skeleton } from '@/components/ui/skeleton'
import { AppCard, CardContent } from '@/components/ui/app-card'

export default function SuperadminPaymentsLoading() {
    return (
        <>
            {/* Header breadcrumb */}
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <Skeleton className="h-7 w-7 rounded-sm" />
                <div className="h-4 w-px bg-border mx-1" />
                <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-3 rounded-sm" />
                    <Skeleton className="h-4 w-40" />
                </div>
            </header>

            <div className="layout-page">
                {/* Titre */}
                <div className="space-y-1.5">
                    <Skeleton className="h-9 w-56" />
                    <Skeleton className="h-4 w-72 max-w-full" />
                </div>

                {/* Tabs */}
                <div className="flex gap-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-9 w-32 rounded-md" />
                    ))}
                </div>

                {/* Payment cards */}
                <div className="space-y-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <AppCard key={i}>
                            <CardContent>
                                <div className="flex items-start justify-between gap-4">
                                    <div className="space-y-4 flex-1">
                                        <div className="flex items-center gap-3">
                                            <Skeleton className="h-5 w-40" />
                                            <Skeleton className="h-5 w-20 rounded-full" />
                                        </div>
                                        <Skeleton className="h-4 w-32" />
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {Array.from({ length: 4 }).map((_, j) => (
                                                <div key={j} className="flex items-center gap-2">
                                                    <Skeleton className="h-4 w-4 rounded shrink-0" />
                                                    <div className="space-y-1">
                                                        <Skeleton className="h-3 w-14" />
                                                        <Skeleton className="h-4 w-20" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Skeleton className="h-9 w-24 rounded-md" />
                                        <Skeleton className="h-9 w-24 rounded-md" />
                                    </div>
                                </div>
                            </CardContent>
                        </AppCard>
                    ))}
                </div>
            </div>
        </>
    )
}
