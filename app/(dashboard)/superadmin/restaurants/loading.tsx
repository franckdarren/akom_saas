import { Skeleton } from '@/components/ui/skeleton'

export default function SuperadminRestaurantsLoading() {
    return (
        <>
            {/* Header breadcrumb */}
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <Skeleton className="h-7 w-7 rounded-sm" />
                <div className="h-4 w-px bg-border mx-1" />
                <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-3 rounded-sm" />
                    <Skeleton className="h-4 w-24" />
                </div>
            </header>

            <div className="layout-page">
                {/* Titre + sous-titre */}
                <div className="space-y-1.5">
                    <Skeleton className="h-9 w-56" />
                    <Skeleton className="h-4 w-48" />
                </div>

                {/* Liste des restaurants (cards) */}
                <div className="grid gap-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="rounded-xl border bg-card p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex-1 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <Skeleton className="h-6 w-40" />
                                        <Skeleton className="h-5 w-20 rounded-full" />
                                        <Skeleton className="h-5 w-16 rounded-full" />
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                        {Array.from({ length: 5 }).map((_, j) => (
                                            <div key={j} className="space-y-1.5">
                                                <Skeleton className="h-3 w-16" />
                                                <Skeleton className="h-6 w-10" />
                                            </div>
                                        ))}
                                    </div>
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-48" />
                                        <Skeleton className="h-4 w-64" />
                                    </div>
                                </div>
                                <Skeleton className="h-4 w-24 shrink-0" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    )
}
