import { Skeleton } from '@/components/ui/skeleton'

export default function SuperadminSupportLoading() {
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
                    <Skeleton className="h-9 w-48" />
                    <Skeleton className="h-4 w-64 max-w-full" />
                </div>

                {/* Stats cards */}
                <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="rounded-xl border bg-card p-6 space-y-3">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-7 w-16" />
                        </div>
                    ))}
                </div>

                {/* Table tickets */}
                <div className="rounded-xl border bg-card overflow-hidden">
                    <div className="border-b bg-muted/40 px-4 py-3 flex items-center gap-4">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-20 ml-auto" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                    <div className="divide-y">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="px-4 py-3 flex items-center gap-4">
                                <Skeleton className="h-4 w-40 shrink-0" />
                                <Skeleton className="h-4 flex-1" />
                                <Skeleton className="h-5 w-20 rounded-full shrink-0" />
                                <Skeleton className="h-4 w-24 shrink-0" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    )
}
