import { Skeleton } from '@/components/ui/skeleton'

export default function OrdersLoading() {
    return (
        <>
            {/* Header avec breadcrumb */}
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <Skeleton className="h-7 w-7 rounded-sm" />
                <div className="h-4 w-px bg-border mx-1" />
                <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-3 rounded-sm" />
                    <Skeleton className="h-4 w-24" />
                </div>
            </header>

            <div className="flex flex-1 flex-col gap-4 p-4">
                {/* Titre + sous-titre */}
                <div className="space-y-1.5">
                    <Skeleton className="h-9 w-40" />
                    <Skeleton className="h-4 w-56" />
                </div>

                {/* Filtres statuts (pills) */}
                <div className="flex gap-2 flex-wrap">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-9 w-24 rounded-full" />
                    ))}
                </div>

                {/* Grid de cards commandes */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="rounded-xl border bg-card p-4 space-y-4">
                            <div className="flex items-start justify-between gap-2">
                                <div className="space-y-1">
                                    <Skeleton className="h-5 w-24" />
                                    <Skeleton className="h-3 w-16" />
                                </div>
                                <Skeleton className="h-6 w-20 rounded-full shrink-0" />
                            </div>
                            <div className="space-y-2">
                                {Array.from({ length: 3 }).map((_, j) => (
                                    <div key={j} className="flex justify-between">
                                        <Skeleton className="h-3 w-32" />
                                        <Skeleton className="h-3 w-10" />
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2 pt-1">
                                <Skeleton className="h-8 flex-1 rounded" />
                                <Skeleton className="h-8 w-8 rounded shrink-0" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    )
}
