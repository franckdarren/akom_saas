import { Skeleton } from '@/components/ui/skeleton'

export default function SuperadminLoading() {
    return (
        <>
            {/* Header */}
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <Skeleton className="h-7 w-7 rounded-sm" />
                <div className="h-4 w-px bg-border mx-1" />
                <Skeleton className="h-4 w-32" />
            </header>

            <div className="layout-page">
                {/* Titre + sous-titre */}
                <div className="space-y-1.5">
                    <Skeleton className="h-8 w-56" />
                    <Skeleton className="h-4 w-80" />
                </div>

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

                {/* Table établissements */}
                <div className="rounded-xl border bg-card overflow-hidden">
                    <div className="px-6 py-4 border-b">
                        <Skeleton className="h-5 w-48" />
                    </div>
                    <div className="divide-y">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-4 px-6 py-4">
                                <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                                <Skeleton className="h-4 w-40" />
                                <Skeleton className="h-4 w-32" />
                                <div className="ml-auto flex items-center gap-3">
                                    <Skeleton className="h-5 w-20 rounded-full" />
                                    <Skeleton className="h-7 w-7 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    )
}
