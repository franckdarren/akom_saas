import { Skeleton } from '@/components/ui/skeleton'

export default function SuperadminLogsLoading() {
    return (
        <>
            {/* Header breadcrumb */}
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <Skeleton className="h-7 w-7 rounded-sm" />
                <div className="h-4 w-px bg-border mx-1" />
                <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-3 rounded-sm" />
                    <Skeleton className="h-4 w-28" />
                </div>
            </header>

            <div className="layout-page">
                {/* Titre */}
                <div className="space-y-1.5">
                    <Skeleton className="h-9 w-44" />
                    <Skeleton className="h-4 w-64 max-w-full" />
                </div>

                {/* 4 stat cards */}
                <div className="grid gap-4 md:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="rounded-xl border bg-card p-6 space-y-3">
                            <div className="flex items-center justify-between">
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-4 w-4 rounded" />
                            </div>
                            <Skeleton className="h-7 w-16" />
                        </div>
                    ))}
                </div>

                {/* Table logs */}
                <div className="rounded-xl border bg-card p-6 space-y-4">
                    <div className="space-y-1.5">
                        <Skeleton className="h-5 w-40" />
                        <Skeleton className="h-3 w-48" />
                    </div>
                    <div className="flex items-center gap-4 border-b pb-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 flex-1" />
                        <Skeleton className="h-4 w-20" />
                    </div>
                    <div className="divide-y">
                        {Array.from({ length: 10 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-4 py-3">
                                <Skeleton className="h-4 w-24 shrink-0" />
                                <Skeleton className="h-5 w-16 rounded-full shrink-0" />
                                <Skeleton className="h-4 w-20 shrink-0" />
                                <Skeleton className="h-4 flex-1" />
                                <Skeleton className="h-4 w-16 shrink-0" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    )
}
