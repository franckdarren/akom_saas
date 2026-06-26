import { Skeleton } from '@/components/ui/skeleton'

export default function SuperadminSuspendedLoading() {
    return (
        <>
            {/* Header breadcrumb */}
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <Skeleton className="h-7 w-7 rounded-sm" />
                <div className="h-4 w-px bg-border mx-1" />
                <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-3 rounded-sm" />
                    <Skeleton className="h-4 w-44" />
                </div>
            </header>

            <div className="layout-page">
                {/* Titre */}
                <div className="space-y-1.5">
                    <Skeleton className="h-9 w-64" />
                    <Skeleton className="h-4 w-80 max-w-full" />
                </div>

                {/* Alert */}
                <Skeleton className="h-20 w-full rounded-lg" />

                {/* 3 stat cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="rounded-xl border bg-card p-6 space-y-3">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-7 w-12" />
                        </div>
                    ))}
                </div>

                {/* Section titre + grille de cards */}
                <div className="flex items-center gap-3">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-5 w-8 rounded-full" />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="rounded-xl border bg-card p-6 space-y-4">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1.5">
                                    <Skeleton className="h-5 w-40" />
                                    <Skeleton className="h-3 w-28" />
                                </div>
                                <Skeleton className="h-5 w-24 rounded-full" />
                            </div>
                            <Skeleton className="h-12 w-full rounded-lg" />
                            <Skeleton className="h-9 w-32 rounded-md" />
                        </div>
                    ))}
                </div>
            </div>
        </>
    )
}
